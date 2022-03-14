//! Swap calculations and curve invariant implementation

use crate::{bn::U192, math::div_fraction, math::mul_fraction, math::FeeCalculator};
use num_traits::ToPrimitive;
use stable_swap_client::{
    fees::Fees,
    fraction::Fraction,
    solana_program::{clock::Clock, program_error::ProgramError, sysvar::Sysvar},
    state::SwapInfo,
};

/// Number of coins in a swap.
/// The Saber StableSwap only supports 2 tokens.
pub const N_COINS: u8 = 2;

/// Timestamp at 0
pub const ZERO_TS: i64 = 0;

/// Minimum ramp duration, in seconds.
pub const MIN_RAMP_DURATION: i64 = 86_400;

/// Minimum amplification coefficient.
pub const MIN_AMP: u64 = 1;

/// Maximum amplification coefficient.
pub const MAX_AMP: u64 = 1_000_000;

/// Maximum number of tokens to swap at once.
pub const MAX_TOKENS_IN: u64 = u64::MAX >> 4;

/// Encodes all results of swapping from a source token to a destination token.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct SwapResult {
    /// New amount of source token
    pub new_source_amount: u64,
    /// New amount of destination token
    pub new_destination_amount: u64,
    /// Amount of destination token swapped
    pub amount_swapped: u64,
    /// Admin fee for the swap
    pub admin_fee: u64,
    /// Fee for the swap
    pub fee: u64,
}

/// The [StableSwap] invariant calculator.
///
/// This is primarily used to calculate two quantities:
/// - `D`, the swap invariant, and
/// - `Y`, the amount of tokens swapped in an instruction.
///
/// This calculator also contains several helper utilities for computing
/// swap, withdraw, and deposit amounts.
///
/// # Resources:
///
/// - [Curve StableSwap paper](https://curve.fi/files/stableswap-paper.pdf)
/// - [StableSwap Python model](https://github.com/saber-hq/stable-swap/blob/master/stable-swap-math/sim/simulation.py)
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct StableSwap {
    /// Initial amplification coefficient (A)
    initial_amp_factor: u64,
    /// Target amplification coefficient (A)
    target_amp_factor: u64,
    /// Current unix timestamp
    current_ts: i64,
    /// Ramp A start timestamp
    start_ramp_ts: i64,
    /// Ramp A stop timestamp
    stop_ramp_ts: i64,
}

impl TryFrom<&SwapInfo> for StableSwap {
    type Error = ProgramError;

    fn try_from(info: &SwapInfo) -> Result<Self, ProgramError> {
        Ok(StableSwap::new_from_swap_info(
            info,
            Clock::get()?.unix_timestamp,
        ))
    }
}

impl StableSwap {
    /// Constructs a new [StableSwap] from a [SwapInfo].
    pub fn new_from_swap_info(info: &SwapInfo, current_ts: i64) -> StableSwap {
        StableSwap::new(
            info.initial_amp_factor,
            info.target_amp_factor,
            current_ts,
            info.start_ramp_ts,
            info.stop_ramp_ts,
        )
    }

    /// Constructs a new [StableSwap] invariant calculator.
    pub fn new(
        initial_amp_factor: u64,
        target_amp_factor: u64,
        current_ts: i64,
        start_ramp_ts: i64,
        stop_ramp_ts: i64,
    ) -> Self {
        Self {
            initial_amp_factor,
            target_amp_factor,
            current_ts,
            start_ramp_ts,
            stop_ramp_ts,
        }
    }

    fn compute_next_d(
        &self,
        amp_factor: u64,
        d_init: U192,
        d_prod: U192,
        sum_x: u64,
    ) -> Option<U192> {
        let ann = amp_factor.checked_mul(N_COINS.into())?;
        let leverage = (sum_x as u128).checked_mul(ann.into())?;
        // d = (ann * sum_x + d_prod * n_coins) * d / ((ann - 1) * d + (n_coins + 1) * d_prod)
        let numerator = d_init.checked_mul(
            d_prod
                .checked_mul(N_COINS.into())?
                .checked_add(leverage.into())?,
        )?;
        let denominator = d_init
            .checked_mul(ann.checked_sub(1)?.into())?
            .checked_add(d_prod.checked_mul((N_COINS.checked_add(1)?).into())?)?;
        numerator.checked_div(denominator)
    }

    /// Compute the amplification coefficient (A).
    ///
    /// The amplification coefficient is used to determine the slippage incurred when
    /// performing swaps. The lower it is, the closer the invariant is to the constant product[^stableswap].
    ///
    /// The amplication coefficient linearly increases with respect to time,
    /// based on the [`SwapInfo::start_ramp_ts`] and [`SwapInfo::stop_ramp_ts`] parameters.
    ///
    /// [^stableswap]: [Egorov, "StableSwap," 2019.](https://curve.fi/files/stableswap-paper.pdf)
    pub fn compute_amp_factor(&self) -> Option<u64> {
        if self.current_ts < self.stop_ramp_ts {
            let time_range = self.stop_ramp_ts.checked_sub(self.start_ramp_ts)?;
            let time_delta = self.current_ts.checked_sub(self.start_ramp_ts)?;

            // Compute amp factor based on ramp time
            if self.target_amp_factor >= self.initial_amp_factor {
                // Ramp up
                let amp_range = self
                    .target_amp_factor
                    .checked_sub(self.initial_amp_factor)?;
                let amp_delta = (amp_range as u128)
                    .checked_mul(time_delta.to_u128()?)?
                    .checked_div(time_range.to_u128()?)?
                    .to_u64()?;
                self.initial_amp_factor.checked_add(amp_delta)
            } else {
                // Ramp down
                let amp_range = self
                    .initial_amp_factor
                    .checked_sub(self.target_amp_factor)?;
                let amp_delta = (amp_range as u128)
                    .checked_mul(time_delta.to_u128()?)?
                    .checked_div(time_range.to_u128()?)?
                    .to_u64()?;
                self.initial_amp_factor.checked_sub(amp_delta)
            }
        } else {
            // when stop_ramp_ts == 0 or current_ts >= stop_ramp_ts
            Some(self.target_amp_factor)
        }
    }

    /// Computes the Stable Swap invariant (D).
    /// Assumes that the exchange rates of the tokens are both 1.
    ///
    /// The invariant is defined as follows:
    ///
    /// ```text
    /// A * sum(x_i) * n**n + D = A * D * n**n + D**(n+1) / (n**n * prod(x_i))
    /// ```
    ///
    /// # Arguments
    ///
    /// - `amount_a` - The amount of token A owned by the LP pool. (i.e. token A reserves)
    /// - `amount_b` - The amount of token B owned by the LP pool. (i.e. token B reserves)
    ///
    /// *For more info on reserves, see [stable_swap_client::state::SwapTokenInfo::reserves].*
    pub fn compute_d(&self, amount_a: u64, amount_b: u64) -> Option<U192> {
        self.compute_d_with_exchange_rates(Fraction::ONE, Fraction::ONE, amount_a, amount_b)
    }

    /// Computes the Stable Swap invariant (D).
    ///
    /// The invariant is defined as follows:
    ///
    /// ```text
    /// A * sum(x_i) * n**n + D = A * D * n**n + D**(n+1) / (n**n * prod(x_i))
    /// ```
    ///
    /// # Arguments
    ///
    /// - `exchange_rate_a` - Exchange rate of token A
    /// - `exchange_rate_b` - Exchange rate of token B
    /// - `amount_a` - The amount of token A owned by the LP pool. (i.e. token A reserves)
    /// - `amount_b` - The amount of token B owned by the LP pool. (i.e. token B reserves)
    ///
    /// *For more info on reserves, see [stable_swap_client::state::SwapTokenInfo::reserves].*
    pub fn compute_d_with_exchange_rates(
        &self,
        exchange_rate_a: Fraction,
        exchange_rate_b: Fraction,
        amount_a: u64,
        amount_b: u64,
    ) -> Option<U192> {
        let adjusted_amount_a = mul_fraction(amount_a, exchange_rate_a)?;
        let adjusted_amount_b = mul_fraction(amount_b, exchange_rate_b)?;

        let sum_x = adjusted_amount_a.checked_add(adjusted_amount_b)?; // sum(x_i), a.k.a S
        if sum_x == 0 {
            Some(0.into())
        } else {
            let amp_factor = self.compute_amp_factor()?;
            let amount_a_times_coins = adjusted_amount_a.checked_mul(N_COINS.into())?;
            let amount_b_times_coins = adjusted_amount_b.checked_mul(N_COINS.into())?;

            // Newton's method to approximate D
            let mut d_prev: U192;
            let mut d: U192 = sum_x.into();
            for _ in 0..256 {
                let mut d_prod = d;
                d_prod = d_prod
                    .checked_mul(d)?
                    .checked_div(amount_a_times_coins.into())?;
                d_prod = d_prod
                    .checked_mul(d)?
                    .checked_div(amount_b_times_coins.into())?;
                d_prev = d;
                d = self.compute_next_d(amp_factor, d, d_prod, sum_x)?;
                // Equality with the precision of 1
                if d > d_prev {
                    if d.checked_sub(d_prev)? <= 1.into() {
                        break;
                    }
                } else if d_prev.checked_sub(d)? <= 1.into() {
                    break;
                }
            }

            Some(d)
        }
    }

    /// Computes the amount of pool tokens to mint after a deposit.
    /// Assumes that the exchange rates of the tokens are both 1.
    pub fn compute_mint_amount_for_deposit(
        &self,
        deposit_amount_a: u64,
        deposit_amount_b: u64,
        swap_amount_a: u64,
        swap_amount_b: u64,
        pool_token_supply: u64,
        fees: &Fees,
    ) -> Option<u64> {
        self.compute_mint_amount_for_deposit_with_exchange_rates(
            deposit_amount_a,
            deposit_amount_b,
            swap_amount_a,
            swap_amount_b,
            Fraction::ONE,
            Fraction::ONE,
            pool_token_supply,
            fees,
        )
    }

    /// Computes the amount of pool tokens to mint after a deposit.
    #[allow(clippy::too_many_arguments)]
    pub fn compute_mint_amount_for_deposit_with_exchange_rates(
        &self,
        deposit_amount_a: u64,
        deposit_amount_b: u64,
        swap_amount_a: u64,
        swap_amount_b: u64,
        exchange_rate_a: Fraction,
        exchange_rate_b: Fraction,
        pool_token_supply: u64,
        fees: &Fees,
    ) -> Option<u64> {
        // Initial invariant
        let d_0 = self.compute_d_with_exchange_rates(
            exchange_rate_a,
            exchange_rate_b,
            swap_amount_a,
            swap_amount_b,
        )?;
        let old_balances = [swap_amount_a, swap_amount_b];
        let mut new_balances = [
            swap_amount_a.checked_add(deposit_amount_a)?,
            swap_amount_b.checked_add(deposit_amount_b)?,
        ];
        // Invariant after change
        let d_1 = self.compute_d_with_exchange_rates(
            exchange_rate_a,
            exchange_rate_b,
            new_balances[0],
            new_balances[1],
        )?;
        if d_1 <= d_0 {
            None
        } else {
            // Recalculate the invariant accounting for fees
            for i in 0..new_balances.len() {
                let ideal_balance = d_1
                    .checked_mul(old_balances[i].into())?
                    .checked_div(d_0)?
                    .to_u64()?;
                let difference = if ideal_balance > new_balances[i] {
                    ideal_balance.checked_sub(new_balances[i])?
                } else {
                    new_balances[i].checked_sub(ideal_balance)?
                };
                let fee = fees.normalized_trade_fee(N_COINS, difference)?;
                new_balances[i] = new_balances[i].checked_sub(fee)?;
            }

            let d_2 = self.compute_d_with_exchange_rates(
                exchange_rate_a,
                exchange_rate_b,
                new_balances[0],
                new_balances[1],
            )?;
            U192::from(pool_token_supply)
                .checked_mul(d_2.checked_sub(d_0)?)?
                .checked_div(d_0)?
                .to_u64()
        }
    }

    /// Compute the swap amount `y` in proportion to `x`.
    ///
    /// Solve for `y`:
    ///
    /// ```text
    /// y**2 + y * (sum' - (A*n**n - 1) * D / (A * n**n)) = D ** (n + 1) / (n ** (2 * n) * prod' * A)
    /// y**2 + b*y = c
    /// ```
    #[allow(clippy::many_single_char_names)]
    pub fn compute_y_raw(&self, x: u64, d: U192) -> Option<U192> {
        let amp_factor = self.compute_amp_factor()?;
        let ann = amp_factor.checked_mul(N_COINS.into())?; // A * n ** n

        // sum' = prod' = x
        // c =  D ** (n + 1) / (n ** (2 * n) * prod' * A)
        let mut c = d
            .checked_mul(d)?
            .checked_div(x.checked_mul(N_COINS.into())?.into())?;
        c = c
            .checked_mul(d)?
            .checked_div(ann.checked_mul(N_COINS.into())?.into())?;
        // b = sum' - (A*n**n - 1) * D / (A * n**n)
        let b = d.checked_div(ann.into())?.checked_add(x.into())?; // d is subtracted on line 147

        // Solve for y by approximating: y**2 + b*y = c
        let mut y_prev: U192;
        let mut y = d;
        for _ in 0..256 {
            y_prev = y;
            // y = (y * y + c) / (2 * y + b - d);
            let y_numerator = y.checked_pow(2.into())?.checked_add(c)?;
            let y_denominator = y.checked_mul(2.into())?.checked_add(b)?.checked_sub(d)?;
            y = y_numerator.checked_div(y_denominator)?;
            if y > y_prev {
                if y.checked_sub(y_prev)? <= 1.into() {
                    break;
                }
            } else if y_prev.checked_sub(y)? <= 1.into() {
                break;
            }
        }
        Some(y)
    }

    /// Computes the swap amount `y` in proportion to `x`.
    pub fn compute_y(&self, x: u64, d: U192) -> Option<u64> {
        self.compute_y_raw(x, d)?.to_u64()
    }

    /// Calculates the withdrawal amount when withdrawing only one type of token.
    /// Assumes that the exchange rates of the tokens are both 1.
    ///
    /// Calculation:
    ///
    /// 1. Get current D
    /// 2. Solve Eqn against `y_i` for `D - _token_amount`
    #[allow(clippy::too_many_arguments)]
    pub fn compute_withdraw_one(
        &self,
        pool_token_amount: u64,
        pool_token_supply: u64,
        swap_base_amount: u64,  // Same denomination of token to be withdrawn
        swap_quote_amount: u64, // Counter denomination of token to be withdrawn
        fees: &Fees,
    ) -> Option<(u64, u64)> {
        self.compute_withdraw_one_with_exchange_rates(
            pool_token_amount,
            pool_token_supply,
            swap_base_amount,
            swap_quote_amount,
            Fraction::ONE,
            Fraction::ONE,
            fees,
        )
    }

    /// Calculates the withdrawal amount when withdrawing only one type of token.
    ///
    /// Calculation:
    ///
    /// 1. Get current D
    /// 2. Solve Eqn against `y_i` for `D - _token_amount`
    #[allow(clippy::too_many_arguments)]
    pub fn compute_withdraw_one_with_exchange_rates(
        &self,
        pool_token_amount: u64,
        pool_token_supply: u64,
        swap_base_amount: u64,  // Same denomination of token to be withdrawn
        swap_quote_amount: u64, // Counter denomination of token to be withdrawn
        swap_base_exchange_rate: Fraction,
        swap_quote_exchange_rate: Fraction,
        fees: &Fees,
    ) -> Option<(u64, u64)> {
        let d_0 = self.compute_d_with_exchange_rates(
            swap_base_exchange_rate,
            swap_quote_exchange_rate,
            swap_base_amount,
            swap_quote_amount,
        )?;
        let swap_base_amount_xp = mul_fraction(swap_base_amount, swap_base_exchange_rate)?;
        let swap_quote_amount_xp = mul_fraction(swap_quote_amount, swap_quote_exchange_rate)?;
        let d_1 = d_0.checked_sub(
            U192::from(pool_token_amount)
                .checked_mul(d_0)?
                .checked_div(pool_token_supply.into())?,
        )?;
        let new_y = self.compute_y(swap_quote_amount_xp, d_1)?;

        // expected_base_amount = swap_base_amount_xp * d_1 / d_0 - new_y;
        let expected_base_amount = U192::from(swap_base_amount_xp)
            .checked_mul(d_1)?
            .checked_div(d_0)?
            .to_u64()?
            .checked_sub(new_y)?;
        // expected_quote_amount = swap_quote_amount_xp - swap_quote_amount_xp * d_1 / d_0;
        let expected_quote_amount = swap_quote_amount_xp.checked_sub(
            U192::from(swap_quote_amount_xp)
                .checked_mul(d_1)?
                .checked_div(d_0)?
                .to_u64()?,
        )?;
        // new_base_amount = swap_base_amount_xp - expected_base_amount * fee / fee_denominator;
        let new_base_amount = swap_base_amount_xp
            .checked_sub(fees.normalized_trade_fee(N_COINS, expected_base_amount)?)?;
        // new_quote_amount = swap_quote_amount_xp - expected_quote_amount * fee / fee_denominator;
        let new_quote_amount = swap_quote_amount_xp
            .checked_sub(fees.normalized_trade_fee(N_COINS, expected_quote_amount)?)?;
        let dy = new_base_amount
            .checked_sub(self.compute_y(new_quote_amount, d_1)?)?
            .checked_sub(1)?; // Withdraw less to account for rounding errors
        let dy_0 = swap_base_amount_xp.checked_sub(new_y)?;

        Some((
            div_fraction(dy, swap_base_exchange_rate)?,
            div_fraction(dy_0.checked_sub(dy)?, swap_base_exchange_rate)?,
        ))
    }

    /// Compute SwapResult after an exchange.
    /// Assumes that the exchange rates of the tokens are both 1.
    pub fn swap_to(
        &self,
        source_amount: u64,
        swap_source_amount: u64,
        swap_destination_amount: u64,
        fees: &Fees,
    ) -> Option<SwapResult> {
        self.swap_to_with_exchange_rates(
            source_amount,
            swap_source_amount,
            swap_destination_amount,
            Fraction::ONE,
            Fraction::ONE,
            fees,
        )
    }

    /// Compute SwapResult after an exchange
    pub fn swap_to_with_exchange_rates(
        &self,
        source_amount: u64,
        swap_source_amount: u64,
        swap_destination_amount: u64,
        swap_source_exchange_rate: Fraction,
        swap_destination_exchange_rate: Fraction,
        fees: &Fees,
    ) -> Option<SwapResult> {
        let y = self.compute_y(
            mul_fraction(
                swap_source_amount.checked_add(source_amount)?,
                swap_source_exchange_rate,
            )?,
            self.compute_d_with_exchange_rates(
                swap_source_exchange_rate,
                swap_destination_exchange_rate,
                swap_source_amount,
                swap_destination_amount,
            )?,
        )?;
        // https://github.com/curvefi/curve-contract/blob/b0bbf77f8f93c9c5f4e415bce9cd71f0cdee960e/contracts/pool-templates/base/SwapTemplateBase.vy#L466
        let dy = mul_fraction(swap_destination_amount, swap_destination_exchange_rate)?
            .checked_sub(y)?
            .checked_sub(1)?;
        let dy_fee = fees.trade_fee(dy)?;
        let admin_fee = fees.admin_trade_fee(dy_fee)?;

        let amount_swapped = div_fraction(dy.checked_sub(dy_fee)?, swap_destination_exchange_rate)?;
        let new_destination_amount = swap_destination_amount
            .checked_sub(amount_swapped)?
            .checked_sub(admin_fee)?;
        let new_source_amount = swap_source_amount.checked_add(source_amount)?;

        Some(SwapResult {
            new_source_amount,
            new_destination_amount,
            amount_swapped,
            admin_fee,
            fee: dy_fee,
        })
    }
}

#[cfg(test)]
#[allow(
    clippy::unwrap_used,
    clippy::integer_arithmetic,
    clippy::too_many_arguments
)]
mod tests {
    use super::*;
    use crate::pool_converter::PoolTokenConverter;
    use proptest::prelude::*;
    use rand::Rng;
    use sim::{Model, MODEL_FEE_DENOMINATOR, MODEL_FEE_NUMERATOR};
    use std::cmp;

    const ZERO_FEES: Fees = Fees {
        admin_trade_fee_numerator: 0,
        admin_trade_fee_denominator: 1000,
        admin_withdraw_fee_numerator: 0,
        admin_withdraw_fee_denominator: 1000,
        trade_fee_numerator: 0,
        trade_fee_denominator: 1000,
        withdraw_fee_numerator: 0,
        withdraw_fee_denominator: 1000,
    };
    const MODEL_FEES: Fees = Fees {
        admin_trade_fee_numerator: 0,
        admin_trade_fee_denominator: 1,
        admin_withdraw_fee_numerator: 0,
        admin_withdraw_fee_denominator: 1,
        trade_fee_numerator: MODEL_FEE_NUMERATOR,
        trade_fee_denominator: MODEL_FEE_DENOMINATOR,
        withdraw_fee_numerator: 0,
        withdraw_fee_denominator: 1,
    };

    const RAMP_TICKS: i64 = 100000;

    #[test]
    fn test_ramp_amp_up() {
        let mut rng = rand::thread_rng();
        let initial_amp_factor = 100;
        let target_amp_factor = initial_amp_factor * 2;
        let start_ramp_ts = rng.gen_range(ZERO_TS..=i64::MAX - RAMP_TICKS);
        let stop_ramp_ts = start_ramp_ts + MIN_RAMP_DURATION;
        println!(
            "start_ramp_ts: {}, stop_ramp_ts: {}",
            start_ramp_ts, stop_ramp_ts
        );

        for tick in 0..RAMP_TICKS {
            let current_ts = start_ramp_ts + tick;
            let invariant = StableSwap::new(
                initial_amp_factor,
                target_amp_factor,
                current_ts,
                start_ramp_ts,
                stop_ramp_ts,
            );
            let expected = if tick >= MIN_RAMP_DURATION {
                target_amp_factor
            } else {
                initial_amp_factor + (initial_amp_factor * tick as u64 / MIN_RAMP_DURATION as u64)
            };
            assert_eq!(invariant.compute_amp_factor().unwrap(), expected);
        }
    }

    #[test]
    fn test_ramp_amp_down() {
        let mut rng = rand::thread_rng();
        let initial_amp_factor = 100;
        let target_amp_factor = initial_amp_factor / 10;
        let amp_range = initial_amp_factor - target_amp_factor;
        let start_ramp_ts = rng.gen_range(ZERO_TS..=i64::MAX - RAMP_TICKS);
        let stop_ramp_ts = start_ramp_ts + MIN_RAMP_DURATION;
        println!(
            "start_ramp_ts: {}, stop_ramp_ts: {}",
            start_ramp_ts, stop_ramp_ts
        );

        for tick in 0..RAMP_TICKS {
            let current_ts = start_ramp_ts + tick;
            let invariant = StableSwap::new(
                initial_amp_factor,
                target_amp_factor,
                current_ts,
                start_ramp_ts,
                stop_ramp_ts,
            );
            let expected = if tick >= MIN_RAMP_DURATION {
                target_amp_factor
            } else {
                initial_amp_factor - (amp_range * tick as u64 / MIN_RAMP_DURATION as u64)
            };
            assert_eq!(invariant.compute_amp_factor().unwrap(), expected);
        }
    }

    fn check_d(
        model: &Model,
        amount_a: u64,
        amount_b: u64,
        current_ts: i64,
        start_ramp_ts: i64,
        stop_ramp_ts: i64,
    ) -> U192 {
        let swap = StableSwap {
            initial_amp_factor: model.amp_factor,
            target_amp_factor: model.amp_factor,
            current_ts,
            start_ramp_ts,
            stop_ramp_ts,
        };
        let d = swap.compute_d(amount_a, amount_b).unwrap();
        assert_eq!(d, model.sim_d().into());
        d
    }

    fn check_y(
        model: &Model,
        x: u64,
        d: U192,
        current_ts: i64,
        start_ramp_ts: i64,
        stop_ramp_ts: i64,
    ) {
        let swap = StableSwap {
            initial_amp_factor: model.amp_factor,
            target_amp_factor: model.amp_factor,
            current_ts,
            start_ramp_ts,
            stop_ramp_ts,
        };
        assert_eq!(
            swap.compute_y_raw(x, d).unwrap().to_u128().unwrap(),
            model.sim_y(0, 1, x)
        )
    }

    proptest! {
        #[test]
        fn test_curve_math(
            current_ts in ZERO_TS..i64::MAX,
            amp_factor in MIN_AMP..=MAX_AMP,
            amount_a in 1..MAX_TOKENS_IN,    // Start at 1 to prevent divide by 0 when computing d
            amount_b in 1..MAX_TOKENS_IN,    // Start at 1 to prevent divide by 0 when computing d
        ) {
            let start_ramp_ts = cmp::max(0, current_ts - MIN_RAMP_DURATION);
            let stop_ramp_ts = cmp::min(i64::MAX, current_ts + MIN_RAMP_DURATION);
            let model = Model::new(amp_factor, vec![amount_a, amount_b], N_COINS);
            let d = check_d(&model, amount_a, amount_b, current_ts, start_ramp_ts, stop_ramp_ts);
            check_y(&model, amount_a, d, current_ts, start_ramp_ts, stop_ramp_ts);
        }
    }

    #[test]
    fn test_curve_math_specific() {
        // Specific cases
        let current_ts = ZERO_TS;
        let start_ramp_ts = ZERO_TS;
        let stop_ramp_ts = ZERO_TS;
        let model_no_balance = Model::new(1, vec![0, 0], N_COINS);
        check_d(
            &model_no_balance,
            0,
            0,
            current_ts,
            start_ramp_ts,
            stop_ramp_ts,
        );

        let amount_a: u64 = 1046129065254161082;
        let amount_b: u64 = 1250710035549196829;
        let model = Model::new(1188, vec![amount_a, amount_b], N_COINS);
        let d = check_d(
            &model,
            amount_a,
            amount_b,
            current_ts,
            start_ramp_ts,
            stop_ramp_ts,
        );
        let amount_x: u64 = 2045250484898639148;
        check_y(&model, amount_x, d, current_ts, start_ramp_ts, stop_ramp_ts);

        let amount_a: u64 = 862538457714585493;
        let amount_b: u64 = 492548187909826733;
        let model = Model::new(9, vec![amount_a, amount_b], N_COINS);
        let d = check_d(
            &model,
            amount_a,
            amount_b,
            current_ts,
            start_ramp_ts,
            stop_ramp_ts,
        );
        let amount_x: u64 = 8155777549389559399;
        check_y(&model, amount_x, d, current_ts, start_ramp_ts, stop_ramp_ts);
    }

    #[test]
    fn test_compute_mint_amount_for_deposit() {
        let initial_amp_factor = MIN_AMP;
        let target_amp_factor = MAX_AMP;
        let current_ts = MIN_RAMP_DURATION / 2;
        let start_ramp_ts = ZERO_TS;
        let stop_ramp_ts = MIN_RAMP_DURATION;
        let invariant = StableSwap::new(
            initial_amp_factor,
            target_amp_factor,
            current_ts,
            start_ramp_ts,
            stop_ramp_ts,
        );

        let deposit_amount_a = MAX_TOKENS_IN;
        let deposit_amount_b = MAX_TOKENS_IN;
        let swap_amount_a = MAX_TOKENS_IN;
        let swap_amount_b = MAX_TOKENS_IN;
        let pool_token_supply = MAX_TOKENS_IN;
        let actual_mint_amount = invariant
            .compute_mint_amount_for_deposit(
                deposit_amount_a,
                deposit_amount_b,
                swap_amount_a,
                swap_amount_b,
                pool_token_supply,
                &MODEL_FEES,
            )
            .unwrap();
        let expected_mint_amount = MAX_TOKENS_IN;
        assert_eq!(actual_mint_amount, expected_mint_amount);
    }

    #[test]
    fn test_curve_math_with_random_inputs() {
        for _ in 0..100 {
            let mut rng = rand::thread_rng();

            let amp_factor: u64 = rng.gen_range(MIN_AMP..=MAX_AMP);
            let amount_a: u64 = rng.gen_range(1..=MAX_TOKENS_IN);
            let amount_b: u64 = rng.gen_range(1..=MAX_TOKENS_IN);
            let start_ramp_ts: i64 = rng.gen_range(ZERO_TS..=i64::MAX);
            let stop_ramp_ts: i64 = rng.gen_range(start_ramp_ts..=i64::MAX);
            let current_ts: i64 = rng.gen_range(start_ramp_ts..=stop_ramp_ts);
            println!("testing curve_math_with_random_inputs:");
            println!(
                "current_ts: {}, start_ramp_ts: {}, stop_ramp_ts: {}",
                current_ts, start_ramp_ts, stop_ramp_ts
            );
            println!(
                "amp_factor: {}, amount_a: {}, amount_b: {}",
                amp_factor, amount_a, amount_b,
            );

            let model = Model::new(amp_factor, vec![amount_a, amount_b], N_COINS);
            let d = check_d(
                &model,
                amount_a,
                amount_b,
                current_ts,
                start_ramp_ts,
                stop_ramp_ts,
            );
            let amount_x: u64 = rng.gen_range(0..=amount_a);

            println!("amount_x: {}", amount_x);
            check_y(&model, amount_x, d, current_ts, start_ramp_ts, stop_ramp_ts);
        }
    }

    fn check_swap(
        initial_amp_factor: u64,
        target_amp_factor: u64,
        current_ts: i64,
        start_ramp_ts: i64,
        stop_ramp_ts: i64,
        source_amount: u64,
        swap_source_amount: u64,
        swap_destination_amount: u64,
    ) {
        let swap = StableSwap::new(
            initial_amp_factor,
            target_amp_factor,
            current_ts,
            start_ramp_ts,
            stop_ramp_ts,
        );
        let result = swap
            .swap_to(
                source_amount,
                swap_source_amount,
                swap_destination_amount,
                &MODEL_FEES,
            )
            .unwrap();
        let model = Model::new(
            swap.compute_amp_factor().unwrap(),
            vec![swap_source_amount, swap_destination_amount],
            N_COINS,
        );

        let expected_amount_swapped = model.sim_exchange(0, 1, source_amount.into());
        let diff = (expected_amount_swapped as i128 - result.amount_swapped as i128).abs();
        let tolerance = std::cmp::max(1, expected_amount_swapped as i128 / 1_000_000_000);
        assert!(
            diff <= tolerance,
            "result={:?}, expected_amount_swapped={}, amp={}, source_amount={}, swap_source_amount={}, swap_destination_amount={}, diff={}",
            result,
            expected_amount_swapped,
            swap.compute_amp_factor().unwrap(),
            source_amount,
            swap_source_amount,
            swap_destination_amount,
            diff
        );
        assert_eq!(result.new_source_amount, swap_source_amount + source_amount);
        assert_eq!(
            result.new_destination_amount,
            swap_destination_amount - result.amount_swapped
        );
    }

    proptest! {
        #[test]
        fn test_swap_calculation(
            current_ts in ZERO_TS..i64::MAX,
            amp_factor in MIN_AMP..=MAX_AMP,
            source_amount in 0..MAX_TOKENS_IN,
            swap_source_amount in 0..MAX_TOKENS_IN,
            swap_destination_amount in 0..MAX_TOKENS_IN,
        ) {
            let start_ramp_ts = cmp::max(0, current_ts - MIN_RAMP_DURATION);
            let stop_ramp_ts = cmp::min(i64::MAX, current_ts + MIN_RAMP_DURATION);
            check_swap(
                amp_factor,
                amp_factor,
                current_ts,
                start_ramp_ts,
                stop_ramp_ts,
                source_amount,
                swap_source_amount,
                swap_destination_amount,
            );
        }
    }

    #[test]
    fn test_swap_calculation_with_random_inputs() {
        for _ in 0..100 {
            let mut rng = rand::thread_rng();

            let initial_amp_factor: u64 = rng.gen_range(MIN_AMP..=MAX_AMP);
            let target_amp_factor: u64 = rng.gen_range(MIN_AMP..=MAX_AMP);
            let start_ramp_ts: i64 = rng.gen_range(ZERO_TS..=i64::MAX);
            let stop_ramp_ts: i64 = rng.gen_range(start_ramp_ts..=i64::MAX);
            let current_ts: i64 = rng.gen_range(start_ramp_ts..=stop_ramp_ts);
            let source_amount: u64 = rng.gen_range(1..=MAX_TOKENS_IN);
            let swap_source_amount: u64 = rng.gen_range(1..=MAX_TOKENS_IN);
            let swap_destination_amount: u64 = rng.gen_range(1..=MAX_TOKENS_IN);
            println!("testing swap_calculation_with_random_inputs:");
            println!(
                "current_ts: {}, start_ramp_ts: {}, stop_ramp_ts: {}",
                current_ts, start_ramp_ts, stop_ramp_ts
            );
            println!(
                "initial_amp_factor: {}, target_amp_factor: {}, source_amount: {}, swap_source_amount: {}, swap_destination_amount: {}",
                initial_amp_factor, target_amp_factor, source_amount, swap_source_amount, swap_destination_amount
            );

            check_swap(
                initial_amp_factor,
                target_amp_factor,
                current_ts,
                start_ramp_ts,
                stop_ramp_ts,
                source_amount,
                swap_source_amount,
                swap_destination_amount,
            );
        }
    }

    #[derive(Debug)]
    struct SwapTest<'a> {
        pub stable_swap: &'a StableSwap,
        pub swap_reserve_balance_a: u64,
        pub swap_reserve_balance_b: u64,
        pub user_token_balance_a: u64,
        pub user_token_balance_b: u64,
    }

    impl SwapTest<'_> {
        pub fn swap_a_to_b(&mut self, swap_amount: u64) {
            self.do_swap(true, swap_amount)
        }

        pub fn swap_b_to_a(&mut self, swap_amount: u64) {
            self.do_swap(false, swap_amount)
        }

        fn do_swap(&mut self, swap_a_to_b: bool, source_amount: u64) {
            let (swap_source_amount, swap_dest_amount) = match swap_a_to_b {
                true => (self.swap_reserve_balance_a, self.swap_reserve_balance_b),
                false => (self.swap_reserve_balance_b, self.swap_reserve_balance_a),
            };

            let SwapResult {
                new_source_amount,
                new_destination_amount,
                amount_swapped,
                ..
            } = self
                .stable_swap
                .swap_to(
                    source_amount,
                    swap_source_amount,
                    swap_dest_amount,
                    &ZERO_FEES,
                )
                .unwrap();

            match swap_a_to_b {
                true => {
                    self.swap_reserve_balance_a = new_source_amount;
                    self.swap_reserve_balance_b = new_destination_amount;
                    self.user_token_balance_a -= source_amount;
                    self.user_token_balance_b += amount_swapped;
                }
                false => {
                    self.swap_reserve_balance_a = new_destination_amount;
                    self.swap_reserve_balance_b = new_source_amount;
                    self.user_token_balance_a += amount_swapped;
                    self.user_token_balance_b -= source_amount;
                }
            }
        }
    }

    proptest! {
        #[test]
        fn test_swaps_does_not_result_in_more_tokens(
            amp_factor in MIN_AMP..=MAX_AMP,
            initial_user_token_a_amount in 10_000_000..MAX_TOKENS_IN >> 16,
            initial_user_token_b_amount in 10_000_000..MAX_TOKENS_IN >> 16,
        ) {

            let stable_swap = StableSwap {
                initial_amp_factor: amp_factor,
                target_amp_factor: amp_factor,
                current_ts: ZERO_TS,
                start_ramp_ts: ZERO_TS,
                stop_ramp_ts: ZERO_TS
            };
            let mut t = SwapTest { stable_swap: &stable_swap, swap_reserve_balance_a: MAX_TOKENS_IN, swap_reserve_balance_b: MAX_TOKENS_IN, user_token_balance_a: initial_user_token_a_amount, user_token_balance_b: initial_user_token_b_amount };

            const ITERATIONS: u64 = 100;
            const SHRINK_MULTIPLIER: u64= 10;

            for i in 0..ITERATIONS {
                let before_balance_a = t.user_token_balance_a;
                let before_balance_b = t.user_token_balance_b;
                let swap_amount = before_balance_a / ((i + 1) * SHRINK_MULTIPLIER);
                t.swap_a_to_b(swap_amount);
                let after_balance = t.user_token_balance_a + t.user_token_balance_b;

                assert!(before_balance_a + before_balance_b >= after_balance, "before_a: {}, before_b: {}, after_a: {}, after_b: {}, swap: {:?}", before_balance_a, before_balance_b, t.user_token_balance_a, t.user_token_balance_b, stable_swap);
            }

            for i in 0..ITERATIONS {
                let before_balance_a = t.user_token_balance_a;
                let before_balance_b = t.user_token_balance_b;
                let swap_amount = before_balance_a / ((i + 1) * SHRINK_MULTIPLIER);
                t.swap_a_to_b(swap_amount);
                let after_balance = t.user_token_balance_a + t.user_token_balance_b;

                assert!(before_balance_a + before_balance_b >= after_balance, "before_a: {}, before_b: {}, after_a: {}, after_b: {}, swap: {:?}", before_balance_a, before_balance_b, t.user_token_balance_a, t.user_token_balance_b, stable_swap);
            }
        }
    }

    #[test]
    fn test_swaps_does_not_result_in_more_tokens_specific_one() {
        const AMP_FACTOR: u64 = 324449;
        const INITIAL_SWAP_RESERVE_AMOUNT: u64 = 100_000_000_000;
        const INITIAL_USER_TOKEN_AMOUNT: u64 = 10_000_000_000;

        let stable_swap = StableSwap {
            initial_amp_factor: AMP_FACTOR,
            target_amp_factor: AMP_FACTOR,
            current_ts: ZERO_TS,
            start_ramp_ts: ZERO_TS,
            stop_ramp_ts: ZERO_TS,
        };

        let mut t = SwapTest {
            stable_swap: &stable_swap,
            swap_reserve_balance_a: INITIAL_SWAP_RESERVE_AMOUNT,
            swap_reserve_balance_b: INITIAL_SWAP_RESERVE_AMOUNT,
            user_token_balance_a: INITIAL_USER_TOKEN_AMOUNT,
            user_token_balance_b: INITIAL_USER_TOKEN_AMOUNT,
        };

        t.swap_a_to_b(2097152);
        t.swap_a_to_b(8053063680);
        t.swap_a_to_b(48);
        assert!(t.user_token_balance_a + t.user_token_balance_b <= INITIAL_USER_TOKEN_AMOUNT * 2);
    }

    #[test]
    fn test_swaps_does_not_result_in_more_tokens_specific_two() {
        const AMP_FACTOR: u64 = 186512;
        const INITIAL_SWAP_RESERVE_AMOUNT: u64 = 100_000_000_000;
        const INITIAL_USER_TOKEN_AMOUNT: u64 = 1_000_000_000;

        let stable_swap = StableSwap {
            initial_amp_factor: AMP_FACTOR,
            target_amp_factor: AMP_FACTOR,
            current_ts: ZERO_TS,
            start_ramp_ts: ZERO_TS,
            stop_ramp_ts: ZERO_TS,
        };

        let mut t = SwapTest {
            stable_swap: &stable_swap,
            swap_reserve_balance_a: INITIAL_SWAP_RESERVE_AMOUNT,
            swap_reserve_balance_b: INITIAL_SWAP_RESERVE_AMOUNT,
            user_token_balance_a: INITIAL_USER_TOKEN_AMOUNT,
            user_token_balance_b: INITIAL_USER_TOKEN_AMOUNT,
        };

        t.swap_b_to_a(33579101);
        t.swap_a_to_b(2097152);
        assert!(t.user_token_balance_a + t.user_token_balance_b <= INITIAL_USER_TOKEN_AMOUNT * 2);
    }

    #[test]
    fn test_swaps_does_not_result_in_more_tokens_specific_three() {
        const AMP_FACTOR: u64 = 1220;
        const INITIAL_SWAP_RESERVE_AMOUNT: u64 = 100_000_000_000;
        const INITIAL_USER_TOKEN_AMOUNT: u64 = 1_000_000_000;

        let stable_swap = StableSwap {
            initial_amp_factor: AMP_FACTOR,
            target_amp_factor: AMP_FACTOR,
            current_ts: ZERO_TS,
            start_ramp_ts: ZERO_TS,
            stop_ramp_ts: ZERO_TS,
        };

        let mut t = SwapTest {
            stable_swap: &stable_swap,
            swap_reserve_balance_a: INITIAL_SWAP_RESERVE_AMOUNT,
            swap_reserve_balance_b: INITIAL_SWAP_RESERVE_AMOUNT,
            user_token_balance_a: INITIAL_USER_TOKEN_AMOUNT,
            user_token_balance_b: INITIAL_USER_TOKEN_AMOUNT,
        };

        t.swap_b_to_a(65535);
        t.swap_b_to_a(6133503);
        t.swap_a_to_b(65535);
        assert!(t.user_token_balance_a + t.user_token_balance_b <= INITIAL_USER_TOKEN_AMOUNT * 2);
    }

    fn check_withdraw_one(
        initial_amp_factor: u64,
        target_amp_factor: u64,
        current_ts: i64,
        start_ramp_ts: i64,
        stop_ramp_ts: i64,
        pool_token_amount: u64,
        pool_token_supply: u64,
        swap_base_amount: u64,
        swap_quote_amount: u64,
    ) {
        let swap = StableSwap::new(
            initial_amp_factor,
            target_amp_factor,
            current_ts,
            start_ramp_ts,
            stop_ramp_ts,
        );
        let result = swap
            .compute_withdraw_one(
                pool_token_amount,
                pool_token_supply,
                swap_base_amount,
                swap_quote_amount,
                &MODEL_FEES,
            )
            .unwrap();
        let model = Model::new_with_pool_tokens(
            swap.compute_amp_factor().unwrap(),
            vec![swap_base_amount, swap_quote_amount],
            N_COINS,
            pool_token_supply,
        );
        assert_eq!(
            result.0,
            model.sim_calc_withdraw_one_coin(pool_token_amount, 0).0
        );
        assert_eq!(
            result.1,
            model.sim_calc_withdraw_one_coin(pool_token_amount, 0).1
        );
    }

    proptest! {
        #[test]
        fn test_compute_withdraw_one(
            current_ts in ZERO_TS..i64::MAX,
            amp_factor in MIN_AMP..=MAX_AMP,
            pool_token_amount in 1..MAX_TOKENS_IN / 2,
            swap_base_amount in 1..MAX_TOKENS_IN / 2,
            swap_quote_amount in 1..MAX_TOKENS_IN / 2,
        ) {
            let pool_token_supply = MAX_TOKENS_IN;
            let start_ramp_ts = cmp::max(0, current_ts - MIN_RAMP_DURATION);
            let stop_ramp_ts = cmp::min(i64::MAX, current_ts + MIN_RAMP_DURATION);
            check_withdraw_one(
                amp_factor,
                amp_factor,
                current_ts,
                start_ramp_ts,
                stop_ramp_ts,
                pool_token_amount,
                pool_token_supply,
                swap_base_amount,
                swap_quote_amount,
            );
        }
    }

    #[test]
    fn test_compute_withdraw_one_with_random_inputs() {
        for _ in 0..100 {
            let mut rng = rand::thread_rng();

            let initial_amp_factor: u64 = rng.gen_range(MIN_AMP..=MAX_AMP);
            let target_amp_factor: u64 = rng.gen_range(MIN_AMP..=MAX_AMP);
            let start_ramp_ts: i64 = rng.gen_range(ZERO_TS..=i64::MAX);
            let stop_ramp_ts: i64 = rng.gen_range(start_ramp_ts..=i64::MAX);
            let current_ts: i64 = rng.gen_range(start_ramp_ts..=stop_ramp_ts);
            let swap_base_amount: u64 = rng.gen_range(1..=MAX_TOKENS_IN);
            let swap_quote_amount: u64 = rng.gen_range(1..=MAX_TOKENS_IN);
            let pool_token_supply = swap_base_amount + swap_quote_amount;
            let pool_token_amount: u64 = rng.gen_range(1..=pool_token_supply);
            println!("testing compute_withdraw_one_with_random_inputs:");
            println!(
                "current_ts: {}, start_ramp_ts: {}, stop_ramp_ts: {}",
                current_ts, start_ramp_ts, stop_ramp_ts
            );
            println!(
                "initial_amp_factor: {}, target_amp_factor: {}, swap_base_amount: {}, swap_quote_amount: {}, pool_token_amount: {}, pool_token_supply: {}",
                initial_amp_factor, target_amp_factor,  swap_base_amount, swap_quote_amount, pool_token_amount, pool_token_supply
            );

            check_withdraw_one(
                initial_amp_factor,
                target_amp_factor,
                current_ts,
                start_ramp_ts,
                stop_ramp_ts,
                pool_token_amount,
                pool_token_supply,
                swap_base_amount,
                swap_quote_amount,
            );
        }
    }

    proptest! {
        #[test]
        fn test_virtual_price_does_not_decrease_from_deposit(
            current_ts in ZERO_TS..i64::MAX,
            amp_factor in MIN_AMP..=MAX_AMP,
            deposit_amount_a in 0..MAX_TOKENS_IN >> 2,
            deposit_amount_b in 0..MAX_TOKENS_IN >> 2,
            swap_token_a_amount in 0..MAX_TOKENS_IN,
            swap_token_b_amount in 0..MAX_TOKENS_IN,
            pool_token_supply in 0..MAX_TOKENS_IN,
        ) {
            let deposit_amount_a = deposit_amount_a;
            let deposit_amount_b = deposit_amount_b;
            let swap_token_a_amount = swap_token_a_amount;
            let swap_token_b_amount = swap_token_b_amount;
            let pool_token_supply = pool_token_supply;

            let start_ramp_ts = cmp::max(0, current_ts - MIN_RAMP_DURATION);
            let stop_ramp_ts = cmp::min(i64::MAX, current_ts + MIN_RAMP_DURATION);
            let invariant = StableSwap::new(amp_factor, amp_factor, current_ts, start_ramp_ts, stop_ramp_ts);
            let d0 = invariant.compute_d(swap_token_a_amount, swap_token_b_amount).unwrap();

            let mint_amount = invariant.compute_mint_amount_for_deposit(
                    deposit_amount_a,
                    deposit_amount_b,
                    swap_token_a_amount,
                    swap_token_b_amount,
                    pool_token_supply,
                    &MODEL_FEES,
                );
            prop_assume!(mint_amount.is_some());

            let new_swap_token_a_amount = swap_token_a_amount + deposit_amount_a;
            let new_swap_token_b_amount = swap_token_b_amount + deposit_amount_b;
            let new_pool_token_supply = pool_token_supply + mint_amount.unwrap();
            let d1 = invariant.compute_d(new_swap_token_a_amount, new_swap_token_b_amount).unwrap();

            assert!(d0 < d1);
            assert!(d0 / pool_token_supply <= d1 / new_pool_token_supply);
        }
    }

    proptest! {
        #[test]
        fn test_virtual_price_does_not_decrease_from_swap(
            current_ts in ZERO_TS..i64::MAX,
            amp_factor in MIN_AMP..=MAX_AMP,
            source_token_amount in 0..MAX_TOKENS_IN,
            swap_source_amount in 0..MAX_TOKENS_IN,
            swap_destination_amount in 0..MAX_TOKENS_IN,
        ) {
            let source_token_amount = source_token_amount;
            let swap_source_amount = swap_source_amount;
            let swap_destination_amount = swap_destination_amount;

            let start_ramp_ts = cmp::max(0, current_ts - MIN_RAMP_DURATION);
            let stop_ramp_ts = cmp::min(i64::MAX, current_ts + MIN_RAMP_DURATION);
            let invariant = StableSwap::new(amp_factor, amp_factor, current_ts, start_ramp_ts, stop_ramp_ts);
            let d0 = invariant.compute_d(swap_source_amount, swap_destination_amount).unwrap();

            let swap_result = invariant.swap_to(source_token_amount, swap_source_amount, swap_destination_amount, &MODEL_FEES);
            prop_assume!(swap_result.is_some());

            let swap_result = swap_result.unwrap();
            let d1 = invariant.compute_d(swap_result.new_source_amount, swap_result.new_destination_amount).unwrap();

            assert!(d0 <= d1);  // Pool token supply not changed on swaps
        }
    }

    proptest! {
        #[test]
        fn test_virtual_price_does_not_decrease_from_withdraw(
            current_ts in ZERO_TS..i64::MAX,
            amp_factor in MIN_AMP..=MAX_AMP,
            (pool_token_supply, pool_token_amount) in total_and_intermediate(),
            swap_token_a_amount in 0..MAX_TOKENS_IN,
            swap_token_b_amount in 0..MAX_TOKENS_IN,
        ) {
            let swap_token_a_amount = swap_token_a_amount;
            let swap_token_b_amount = swap_token_b_amount;
            let pool_token_amount = pool_token_amount;
            let pool_token_supply = pool_token_supply;

            let start_ramp_ts = cmp::max(0, current_ts - MIN_RAMP_DURATION);
            let stop_ramp_ts = cmp::min(i64::MAX, current_ts + MIN_RAMP_DURATION);
            let invariant = StableSwap::new(amp_factor, amp_factor, current_ts, start_ramp_ts, stop_ramp_ts);
            let d0 = invariant.compute_d(swap_token_a_amount, swap_token_b_amount).unwrap();

            let converter = PoolTokenConverter {
                supply: pool_token_supply,
                token_a: swap_token_a_amount,
                token_b: swap_token_b_amount,
                fees: &MODEL_FEES,
            };

            // Make sure we will get at least one trading token out for each
            // side, otherwise the calculation fails
            prop_assume!((pool_token_amount as u128) * (swap_token_a_amount as u128) / (pool_token_supply as u128) >= 1);
            prop_assume!((pool_token_amount as u128) * (swap_token_b_amount as u128) / (pool_token_supply as u128) >= 1);

            let (withdraw_amount_a, _, _) = converter.token_a_rate(pool_token_amount).unwrap();
            let (withdraw_amount_b, _, _) = converter.token_b_rate(pool_token_amount).unwrap();

            let new_swap_token_a_amount = swap_token_a_amount - withdraw_amount_a;
            let new_swap_token_b_amount = swap_token_b_amount - withdraw_amount_b;
            let d1 = invariant.compute_d(new_swap_token_a_amount, new_swap_token_b_amount).unwrap();
            let new_pool_token_supply = pool_token_supply - pool_token_amount;

            assert!(d0 / pool_token_supply <= d1 / new_pool_token_supply);
        }
    }

    proptest! {
        #[test]
        fn test_virtual_price_does_not_decrease_from_withdraw_one(
            current_ts in ZERO_TS..i64::MAX,
            amp_factor in MIN_AMP..MAX_AMP,
            (pool_token_supply, pool_token_amount) in total_and_intermediate(),
            base_token_amount in 0..MAX_TOKENS_IN,
            quote_token_amount in 0..MAX_TOKENS_IN,
        ) {
            let base_token_amount = base_token_amount;
            let quote_token_amount = quote_token_amount;
            let pool_token_amount = pool_token_amount;
            let pool_token_supply = pool_token_supply;

            let start_ramp_ts = cmp::max(0, current_ts - MIN_RAMP_DURATION);
            let stop_ramp_ts = cmp::min(i64::MAX, current_ts + MIN_RAMP_DURATION);
            let invariant = StableSwap::new(amp_factor, amp_factor, current_ts, start_ramp_ts, stop_ramp_ts);
            let d0 = invariant.compute_d(base_token_amount, quote_token_amount).unwrap();

            prop_assume!(U192::from(pool_token_amount) * U192::from(base_token_amount) / U192::from(pool_token_supply) >= U192::from(1));
            let (withdraw_amount, _) = invariant.compute_withdraw_one(pool_token_amount, pool_token_supply, base_token_amount, quote_token_amount, &MODEL_FEES).unwrap();

            let new_base_token_amount = base_token_amount - withdraw_amount;
            let d1 = invariant.compute_d(new_base_token_amount, quote_token_amount).unwrap();
            let new_pool_token_supply = pool_token_supply - pool_token_amount;

            assert!(d0 / pool_token_supply <= d1 / new_pool_token_supply);
        }
    }

    prop_compose! {
        pub fn total_and_intermediate()(total in 1..MAX_TOKENS_IN)
                        (intermediate in 1..total, total in Just(total))
                        -> (u64, u64) {
           (total, intermediate)
       }
    }

    /// The below tests test varying exchange rates.
    const MAX_EXCHANGE_RATE_NUMERATOR: u64 = 10u64.pow(18) * 4;
    const EXCHANGE_RATE_DENOMINATOR: u64 = 10_u64.pow(18);

    fn model_with_exchange_rates_and_pool_tokens(
        amp_factor: u64,
        balance_a: u64,
        balance_b: u64,
        exchange_rate_a: Fraction,
        exchange_rate_b: Fraction,
        n_coins: u8,
        pool_tokens: u64,
    ) -> Model {
        let target_price_a = 10_u128.pow(18) * u128::from(exchange_rate_a.numerator)
            / u128::from(exchange_rate_a.denominator);
        let target_price_b = 10_u128.pow(18) * u128::from(exchange_rate_b.numerator)
            / u128::from(exchange_rate_b.denominator);
        Model::new_with_target_prices_and_pool_tokens(
            amp_factor,
            vec![balance_a, balance_b],
            n_coins,
            vec![target_price_a, target_price_b],
            pool_tokens,
        )
    }

    fn model_with_exchange_rates(
        amp_factor: u64,
        balance_a: u64,
        balance_b: u64,
        exchange_rate_a: Fraction,
        exchange_rate_b: Fraction,
        n_coins: u8,
    ) -> Model {
        let mut target_price_a: u128 = 10;
        target_price_a = target_price_a.pow(18) * u128::from(exchange_rate_a.numerator)
            / u128::from(exchange_rate_a.denominator);
        let mut target_price_b: u128 = 10;
        target_price_b = target_price_b.pow(18) * u128::from(exchange_rate_b.numerator)
            / u128::from(exchange_rate_b.denominator);
        Model::new_with_target_prices(
            amp_factor,
            vec![balance_a, balance_b],
            vec![target_price_a, target_price_b],
            n_coins,
        )
    }

    fn check_d_with_exchange_rates(
        model: &Model,
        amount_a: u64,
        amount_b: u64,
        current_ts: i64,
        start_ramp_ts: i64,
        stop_ramp_ts: i64,
        exchange_rate_a: Fraction,
        exchange_rate_b: Fraction,
    ) -> U192 {
        let swap = StableSwap {
            initial_amp_factor: model.amp_factor,
            target_amp_factor: model.amp_factor,
            current_ts,
            start_ramp_ts,
            stop_ramp_ts,
        };
        let d = swap
            .compute_d_with_exchange_rates(exchange_rate_a, exchange_rate_b, amount_a, amount_b)
            .unwrap();
        assert_eq!(d, model.sim_d().into());
        d
    }

    proptest! {
        #[test]
        fn test_curve_math_varying_exchange_rates(
            current_ts in ZERO_TS..i64::MAX,
            amp_factor in MIN_AMP..=MAX_AMP,
            amount_a in 1..MAX_TOKENS_IN,    // Start at 1 to prevent divide by 0 when computing d
            amount_b in 1..MAX_TOKENS_IN,    // Start at 1 to prevent divide by 0 when computing d
            exchange_rate_a in exchange_rate(),
            exchange_rate_b in exchange_rate(),
        ) {
            let start_ramp_ts = cmp::max(0, current_ts - MIN_RAMP_DURATION);
            let stop_ramp_ts = cmp::min(i64::MAX, current_ts + MIN_RAMP_DURATION);
            let model = model_with_exchange_rates(amp_factor, amount_a, amount_b, exchange_rate_a, exchange_rate_b, N_COINS);
            let d = check_d_with_exchange_rates(&model, amount_a, amount_b, current_ts, start_ramp_ts, stop_ramp_ts, exchange_rate_a, exchange_rate_b);
            check_y(&model, amount_a, d, current_ts, start_ramp_ts, stop_ramp_ts);
        }
    }

    #[test]
    fn test_curve_math_with_random_inputs_varying_exchange_rates() {
        for _ in 0..100 {
            let mut rng = rand::thread_rng();

            let amp_factor: u64 = rng.gen_range(MIN_AMP..=MAX_AMP);
            let amount_a: u64 = rng.gen_range(1..=MAX_TOKENS_IN);
            let amount_b: u64 = rng.gen_range(1..=MAX_TOKENS_IN);
            let start_ramp_ts: i64 = rng.gen_range(ZERO_TS..=i64::MAX);
            let stop_ramp_ts: i64 = rng.gen_range(start_ramp_ts..=i64::MAX);
            let current_ts: i64 = rng.gen_range(start_ramp_ts..=stop_ramp_ts);
            let token_a_exchange_rate_numerator: u64 =
                rng.gen_range(1..=MAX_EXCHANGE_RATE_NUMERATOR);
            let token_b_exchange_rate_numerator: u64 =
                rng.gen_range(1..=MAX_EXCHANGE_RATE_NUMERATOR);
            println!("testing curve_math_with_random_inputs:");
            println!(
                "current_ts: {}, start_ramp_ts: {}, stop_ramp_ts: {}",
                current_ts, start_ramp_ts, stop_ramp_ts
            );
            println!(
                "amp_factor: {}, amount_a: {}, amount_b: {}",
                amp_factor, amount_a, amount_b,
            );

            let exchange_rate_a = Fraction {
                numerator: token_a_exchange_rate_numerator,
                denominator: EXCHANGE_RATE_DENOMINATOR,
            };
            let exchange_rate_b = Fraction {
                numerator: token_b_exchange_rate_numerator,
                denominator: EXCHANGE_RATE_DENOMINATOR,
            };
            let model = model_with_exchange_rates(
                amp_factor,
                amount_a,
                amount_b,
                exchange_rate_a,
                exchange_rate_b,
                N_COINS,
            );
            let d = check_d_with_exchange_rates(
                &model,
                amount_a,
                amount_b,
                current_ts,
                start_ramp_ts,
                stop_ramp_ts,
                exchange_rate_a,
                exchange_rate_b,
            );
            let amount_x: u64 = rng.gen_range(0..=amount_a);

            println!("amount_x: {}", amount_x);
            check_y(&model, amount_x, d, current_ts, start_ramp_ts, stop_ramp_ts);
        }
    }

    fn check_swap_with_exchange_rates(
        initial_amp_factor: u64,
        target_amp_factor: u64,
        current_ts: i64,
        start_ramp_ts: i64,
        stop_ramp_ts: i64,
        source_amount: u64,
        swap_source_amount: u64,
        swap_destination_amount: u64,
        swap_source_exchange_rate: Fraction,
        swap_destination_exchange_rate: Fraction,
    ) {
        let swap = StableSwap::new(
            initial_amp_factor,
            target_amp_factor,
            current_ts,
            start_ramp_ts,
            stop_ramp_ts,
        );
        let result = swap
            .swap_to_with_exchange_rates(
                source_amount,
                swap_source_amount,
                swap_destination_amount,
                swap_source_exchange_rate,
                swap_destination_exchange_rate,
                &MODEL_FEES,
            )
            .unwrap();
        let model = model_with_exchange_rates(
            swap.compute_amp_factor().unwrap(),
            swap_source_amount,
            swap_destination_amount,
            swap_source_exchange_rate,
            swap_destination_exchange_rate,
            N_COINS,
        );

        let expected_amount_swapped = div_fraction(
            model.sim_exchange(
                0,
                1,
                mul_fraction(source_amount, swap_source_exchange_rate)
                    .unwrap()
                    .into(),
            ),
            swap_destination_exchange_rate,
        )
        .unwrap();
        let diff = (expected_amount_swapped as i128 - result.amount_swapped as i128).abs();
        let tolerance = std::cmp::max(1, expected_amount_swapped as i128 / 1_000_000_000);
        assert!(
            diff <= tolerance,
            "result={:?}, expected_amount_swapped={}, amp={}, source_amount={}, swap_source_amount={}, swap_destination_amount={}, diff={}",
            result,
            expected_amount_swapped,
            swap.compute_amp_factor().unwrap(),
            source_amount,
            swap_source_amount,
            swap_destination_amount,
            diff
        );
        assert_eq!(result.new_source_amount, swap_source_amount + source_amount);
        assert_eq!(
            result.new_destination_amount,
            swap_destination_amount - result.amount_swapped
        );
    }

    proptest! {
        #[test]
        fn test_swap_calculation_varying_exchange_rates(
            current_ts in ZERO_TS..i64::MAX,
            amp_factor in MIN_AMP..=MAX_AMP,
            source_amount in 0..MAX_TOKENS_IN,
            swap_source_amount in 0..MAX_TOKENS_IN,
            swap_destination_amount in 0..MAX_TOKENS_IN,
            swap_source_exchange_rate in exchange_rate(),
            swap_destination_exchange_rate in exchange_rate(),
        ) {
            let start_ramp_ts = cmp::max(0, current_ts - MIN_RAMP_DURATION);
            let stop_ramp_ts = cmp::min(i64::MAX, current_ts + MIN_RAMP_DURATION);
            check_swap_with_exchange_rates(
                amp_factor,
                amp_factor,
                current_ts,
                start_ramp_ts,
                stop_ramp_ts,
                source_amount,
                swap_source_amount,
                swap_destination_amount,
                swap_source_exchange_rate,
                swap_destination_exchange_rate
            );
        }
    }

    #[test]
    fn test_swap_calculation_with_random_inputs_varying_exchange_rates() {
        for _ in 0..100 {
            let mut rng = rand::thread_rng();

            let initial_amp_factor: u64 = rng.gen_range(MIN_AMP..=MAX_AMP);
            let target_amp_factor: u64 = rng.gen_range(MIN_AMP..=MAX_AMP);
            let start_ramp_ts: i64 = rng.gen_range(ZERO_TS..=i64::MAX);
            let stop_ramp_ts: i64 = rng.gen_range(start_ramp_ts..=i64::MAX);
            let current_ts: i64 = rng.gen_range(start_ramp_ts..=stop_ramp_ts);
            let source_amount: u64 = rng.gen_range(1..=MAX_TOKENS_IN);
            let swap_source_amount: u64 = rng.gen_range(1..=MAX_TOKENS_IN);
            let swap_destination_amount: u64 = rng.gen_range(1..=MAX_TOKENS_IN);
            let swap_source_exchange_rate_numerator: u64 =
                rng.gen_range(1..=MAX_EXCHANGE_RATE_NUMERATOR);
            let swap_destination_exchange_rate_numerator: u64 =
                rng.gen_range(1..=MAX_EXCHANGE_RATE_NUMERATOR);
            println!("testing swap_calculation_with_random_inputs:");
            println!(
                "current_ts: {}, start_ramp_ts: {}, stop_ramp_ts: {}",
                current_ts, start_ramp_ts, stop_ramp_ts
            );
            println!(
                "initial_amp_factor: {}, target_amp_factor: {}, source_amount: {}, swap_source_amount: {}, swap_destination_amount: {}",
                initial_amp_factor, target_amp_factor, source_amount, swap_source_amount, swap_destination_amount
            );
            let swap_source_exchange_rate = Fraction {
                numerator: swap_source_exchange_rate_numerator,
                denominator: 10u64.pow(18),
            };
            let swap_destination_exchange_rate = Fraction {
                numerator: swap_destination_exchange_rate_numerator,
                denominator: 10u64.pow(18),
            };
            println!("swap_source_exchange_rate: {:?}", swap_source_exchange_rate);
            println!(
                "swap_destination_exchange_rate: {:?}",
                swap_destination_exchange_rate
            );

            check_swap_with_exchange_rates(
                initial_amp_factor,
                target_amp_factor,
                current_ts,
                start_ramp_ts,
                stop_ramp_ts,
                source_amount,
                swap_source_amount,
                swap_destination_amount,
                swap_source_exchange_rate,
                swap_destination_exchange_rate,
            );
        }
    }

    fn check_withdraw_one_with_exchange_rates(
        initial_amp_factor: u64,
        target_amp_factor: u64,
        current_ts: i64,
        start_ramp_ts: i64,
        stop_ramp_ts: i64,
        pool_token_amount: u64,
        pool_token_supply: u64,
        swap_base_amount: u64,
        swap_quote_amount: u64,
        swap_base_exchange_rate: Fraction,
        swap_quote_exchange_rate: Fraction,
    ) {
        let swap = StableSwap::new(
            initial_amp_factor,
            target_amp_factor,
            current_ts,
            start_ramp_ts,
            stop_ramp_ts,
        );
        let result = swap
            .compute_withdraw_one_with_exchange_rates(
                pool_token_amount,
                pool_token_supply,
                swap_base_amount,
                swap_quote_amount,
                swap_base_exchange_rate,
                swap_quote_exchange_rate,
                &MODEL_FEES,
            )
            .unwrap();
        let model = model_with_exchange_rates_and_pool_tokens(
            swap.compute_amp_factor().unwrap(),
            swap_base_amount,
            swap_quote_amount,
            swap_base_exchange_rate,
            swap_quote_exchange_rate,
            N_COINS,
            pool_token_supply,
        );
        assert_eq!(
            result.0,
            div_fraction(
                model.sim_calc_withdraw_one_coin(pool_token_amount, 0).0,
                swap_base_exchange_rate,
            )
            .unwrap(),
        );
        assert_eq!(
            result.1,
            div_fraction(
                model.sim_calc_withdraw_one_coin(pool_token_amount, 0).1,
                swap_base_exchange_rate,
            )
            .unwrap(),
        );
    }

    proptest! {
        #[test]
        fn test_compute_withdraw_one_varying_exchange_rates(
            current_ts in ZERO_TS..i64::MAX,
            amp_factor in MIN_AMP..=MAX_AMP,
            pool_token_amount in 1..MAX_TOKENS_IN / 2,
            swap_base_amount in 1..MAX_TOKENS_IN / 2,
            swap_quote_amount in 1..MAX_TOKENS_IN / 2,
            swap_base_exchange_rate in exchange_rate(),
            swap_quote_exchange_rate in exchange_rate(),
        ) {
            let pool_token_supply = MAX_TOKENS_IN;
            let start_ramp_ts = cmp::max(0, current_ts - MIN_RAMP_DURATION);
            let stop_ramp_ts = cmp::min(i64::MAX, current_ts + MIN_RAMP_DURATION);
            check_withdraw_one_with_exchange_rates(
                amp_factor,
                amp_factor,
                current_ts,
                start_ramp_ts,
                stop_ramp_ts,
                pool_token_amount,
                pool_token_supply,
                swap_base_amount,
                swap_quote_amount,
                swap_base_exchange_rate,
                swap_quote_exchange_rate,
            );
        }
    }

    #[test]
    fn test_compute_withdraw_one_with_random_inputs_varying_exchange_rates() {
        for _ in 0..100 {
            let mut rng = rand::thread_rng();

            let initial_amp_factor: u64 = rng.gen_range(MIN_AMP..=MAX_AMP);
            let target_amp_factor: u64 = rng.gen_range(MIN_AMP..=MAX_AMP);
            let start_ramp_ts: i64 = rng.gen_range(ZERO_TS..=i64::MAX);
            let stop_ramp_ts: i64 = rng.gen_range(start_ramp_ts..=i64::MAX);
            let current_ts: i64 = rng.gen_range(start_ramp_ts..=stop_ramp_ts);
            let swap_base_amount: u64 = rng.gen_range(1..=MAX_TOKENS_IN);
            let swap_quote_amount: u64 = rng.gen_range(1..=MAX_TOKENS_IN);
            let pool_token_supply = swap_base_amount + swap_quote_amount;
            let pool_token_amount: u64 = rng.gen_range(1..=pool_token_supply);
            let swap_base_exchange_rate_numerator: u64 =
                rng.gen_range(1..=MAX_EXCHANGE_RATE_NUMERATOR);
            let swap_quote_exchange_rate_numerator: u64 =
                rng.gen_range(1..=MAX_EXCHANGE_RATE_NUMERATOR);
            println!("testing compute_withdraw_one_with_random_inputs:");
            println!(
                "current_ts: {}, start_ramp_ts: {}, stop_ramp_ts: {}",
                current_ts, start_ramp_ts, stop_ramp_ts
            );
            println!(
                "initial_amp_factor: {}, target_amp_factor: {}, swap_base_amount: {}, swap_quote_amount: {}, pool_token_amount: {}, pool_token_supply: {}",
                initial_amp_factor, target_amp_factor,  swap_base_amount, swap_quote_amount, pool_token_amount, pool_token_supply
            );
            let swap_base_exchange_rate = Fraction {
                numerator: swap_base_exchange_rate_numerator,
                denominator: 10u64.pow(18),
            };
            let swap_quote_exchange_rate = Fraction {
                numerator: swap_quote_exchange_rate_numerator,
                denominator: 10u64.pow(18),
            };
            println!("swap_base_exchange_rate: {:?}", swap_base_exchange_rate);
            println!("swap_quote_exchange_rate: {:?}", swap_quote_exchange_rate);

            check_withdraw_one_with_exchange_rates(
                initial_amp_factor,
                target_amp_factor,
                current_ts,
                start_ramp_ts,
                stop_ramp_ts,
                pool_token_amount,
                pool_token_supply,
                swap_base_amount,
                swap_quote_amount,
                swap_base_exchange_rate,
                swap_quote_exchange_rate,
            );
        }
    }

    /// Check if any tokens would be swapped.
    fn valid_swap_would_occur(
        invariant: StableSwap,
        swap_amount: u64,
        swap_source_amount: u64,
        swap_destination_amount: u64,
        swap_source_exchange_rate: Fraction,
        swap_destination_exchange_rate: Fraction,
    ) -> bool {
        let y = invariant
            .compute_y(
                mul_fraction(
                    swap_source_amount.checked_add(swap_amount).unwrap(),
                    swap_source_exchange_rate,
                )
                .unwrap(),
                invariant
                    .compute_d_with_exchange_rates(
                        swap_source_exchange_rate,
                        swap_destination_exchange_rate,
                        swap_source_amount,
                        swap_destination_amount,
                    )
                    .unwrap(),
            )
            .unwrap();
        mul_fraction(swap_destination_amount, swap_destination_exchange_rate).unwrap() > y + 1
    }

    proptest! {
        #[test]
        fn test_virtual_price_does_not_decrease_from_swap_varying_exchange_rates(
            current_ts in ZERO_TS..i64::MAX,
            amp_factor in MIN_AMP..=MAX_AMP,
            source_token_amount in 0..MAX_TOKENS_IN,
            swap_source_amount in 0..MAX_TOKENS_IN,
            swap_destination_amount in 0..MAX_TOKENS_IN,
            swap_source_exchange_rate in exchange_rate(),
            swap_destination_exchange_rate in exchange_rate(),
        ) {
            let source_token_amount = source_token_amount;
            let swap_source_amount = swap_source_amount;
            let swap_destination_amount = swap_destination_amount;

            let start_ramp_ts = cmp::max(0, current_ts - MIN_RAMP_DURATION);
            let stop_ramp_ts = cmp::min(i64::MAX, current_ts + MIN_RAMP_DURATION);

            let invariant = StableSwap::new(amp_factor, amp_factor, current_ts, start_ramp_ts, stop_ramp_ts);
            prop_assume!(valid_swap_would_occur(invariant, source_token_amount, swap_source_amount, swap_destination_amount, swap_source_exchange_rate, swap_destination_exchange_rate));
            let d0 = invariant.compute_d_with_exchange_rates(swap_source_exchange_rate, swap_destination_exchange_rate, swap_source_amount, swap_destination_amount).unwrap();

            let swap_result = invariant.swap_to_with_exchange_rates(source_token_amount, swap_source_amount, swap_destination_amount, swap_source_exchange_rate, swap_destination_exchange_rate, &MODEL_FEES);
            prop_assume!(swap_result.is_some());

            let swap_result = swap_result.unwrap();
            let d1 = invariant.compute_d_with_exchange_rates(swap_source_exchange_rate, swap_destination_exchange_rate, swap_result.new_source_amount, swap_result.new_destination_amount).unwrap();

            assert!(d0 <= d1);  // Pool token supply not changed on swaps
        }
    }

    proptest! {
        #[test]
        fn test_virtual_price_does_not_decrease_from_withdraw_varying_exchange_rates(
            current_ts in ZERO_TS..i64::MAX,
            amp_factor in MIN_AMP..=MAX_AMP,
            (pool_token_supply, pool_token_amount) in total_and_intermediate(),
            swap_token_a_amount in 0..MAX_TOKENS_IN,
            swap_token_b_amount in 0..MAX_TOKENS_IN,
            token_a_exchange_rate in exchange_rate(),
            token_b_exchange_rate in exchange_rate(),
        ) {
            let swap_token_a_amount = swap_token_a_amount;
            let swap_token_b_amount = swap_token_b_amount;
            let pool_token_amount = pool_token_amount;
            let pool_token_supply = pool_token_supply;

            let start_ramp_ts = cmp::max(0, current_ts - MIN_RAMP_DURATION);
            let stop_ramp_ts = cmp::min(i64::MAX, current_ts + MIN_RAMP_DURATION);

            let invariant = StableSwap::new(amp_factor, amp_factor, current_ts, start_ramp_ts, stop_ramp_ts);
            let d0 = invariant.compute_d_with_exchange_rates(token_a_exchange_rate, token_b_exchange_rate, swap_token_a_amount, swap_token_b_amount).unwrap();

            let converter = PoolTokenConverter {
                supply: pool_token_supply,
                token_a: swap_token_a_amount,
                token_b: swap_token_b_amount,
                fees: &MODEL_FEES,
            };

            // Make sure we will get at least one trading token out for each
            // side, otherwise the calculation fails
            prop_assume!((pool_token_amount as u128) * (swap_token_a_amount as u128) / (pool_token_supply as u128) >= 1);
            prop_assume!((pool_token_amount as u128) * (swap_token_b_amount as u128) / (pool_token_supply as u128) >= 1);

            let (withdraw_amount_a, _, _) = converter.token_a_rate(pool_token_amount).unwrap();
            let (withdraw_amount_b, _, _) = converter.token_b_rate(pool_token_amount).unwrap();

            let new_swap_token_a_amount = swap_token_a_amount - withdraw_amount_a;
            let new_swap_token_b_amount = swap_token_b_amount - withdraw_amount_b;
            let d1 = invariant.compute_d_with_exchange_rates(token_a_exchange_rate, token_b_exchange_rate, new_swap_token_a_amount, new_swap_token_b_amount).unwrap();
            let new_pool_token_supply = pool_token_supply - pool_token_amount;

            assert!(d0 / pool_token_supply <= d1 / new_pool_token_supply);
        }
    }

    #[test]
    fn test_exchange_rates_provide_better_slippage_specific() {
        let swap = StableSwap {
            initial_amp_factor: 2,
            target_amp_factor: 2,
            current_ts: 0,
            start_ramp_ts: 0,
            stop_ramp_ts: 0,
        };
        let source_amount = 5000;
        let swap_source_amount = 100000000;
        let swap_destination_amount = 200000000;
        let swap_source_exchange_rate = Fraction {
            numerator: 2,
            denominator: 1,
        };
        let swap_source_exchange_rate_too_high = Fraction {
            numerator: 4,
            denominator: 1,
        };
        let swap_destination_exchange_rate = Fraction::ONE;

        let correct_exchange_rate_amount_swapped = swap
            .swap_to_with_exchange_rates(
                source_amount,
                swap_source_amount,
                swap_destination_amount,
                swap_source_exchange_rate,
                swap_destination_exchange_rate,
                &ZERO_FEES,
            )
            .unwrap()
            .amount_swapped;

        let no_exchange_rate_amount_swapped = swap
            .swap_to(
                source_amount,
                swap_source_amount,
                swap_destination_amount,
                &ZERO_FEES,
            )
            .unwrap()
            .amount_swapped;

        let exchange_rate_too_high_amount_swapped = swap
            .swap_to_with_exchange_rates(
                source_amount,
                swap_source_amount,
                swap_destination_amount,
                swap_source_exchange_rate_too_high,
                swap_destination_exchange_rate,
                &ZERO_FEES,
            )
            .unwrap()
            .amount_swapped;

        let optimal_amount_swapped =
            mul_fraction(source_amount, swap_source_exchange_rate).unwrap();
        // Positive slippage means that the swap was better than expected.
        let slippage = |amount: u64| -> i128 {
            (amount as i128)
                .checked_sub(optimal_amount_swapped.into())
                .unwrap()
        };

        assert!(slippage(no_exchange_rate_amount_swapped) < 0);
        assert!(slippage(exchange_rate_too_high_amount_swapped) > 0);

        assert!(
            slippage(correct_exchange_rate_amount_swapped).abs()
                < slippage(no_exchange_rate_amount_swapped).abs()
        );
        assert!(
            slippage(correct_exchange_rate_amount_swapped).abs()
                < slippage(exchange_rate_too_high_amount_swapped).abs()
        );
    }

    prop_compose! {
        pub fn exchange_rate()
                        (numerator in 1..=MAX_EXCHANGE_RATE_NUMERATOR)
                        -> Fraction {
           Fraction{numerator, denominator: EXCHANGE_RATE_DENOMINATOR}
       }
    }
}
