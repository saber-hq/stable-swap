//! Swap calculations and curve invariant implementation

use crate::{bn::U192, math::FeeCalculator};
use num_traits::ToPrimitive;
use stable_swap_client::{
    fees::Fees,
    solana_program::{clock::Clock, sysvar::Sysvar},
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
    type Error = anyhow::Error;

    fn try_from(info: &SwapInfo) -> anyhow::Result<Self> {
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

    /// Compute the amplification coefficient (A)
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

    /// Compute stable swap invariant (D)
    /// Equation:
    /// A * sum(x_i) * n**n + D = A * D * n**n + D**(n+1) / (n**n * prod(x_i))
    pub fn compute_d(&self, amount_a: u64, amount_b: u64) -> Option<U192> {
        let sum_x = amount_a.checked_add(amount_b)?; // sum(x_i), a.k.a S
        if sum_x == 0 {
            Some(0.into())
        } else {
            let amp_factor = self.compute_amp_factor()?;
            let amount_a_times_coins = amount_a.checked_mul(N_COINS.into())?;
            let amount_b_times_coins = amount_b.checked_mul(N_COINS.into())?;

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

    /// Compute the amount of pool tokens to mint after a deposit
    pub fn compute_mint_amount_for_deposit(
        &self,
        deposit_amount_a: u64,
        deposit_amount_b: u64,
        swap_amount_a: u64,
        swap_amount_b: u64,
        pool_token_supply: u64,
        fees: &Fees,
    ) -> Option<u64> {
        // Initial invariant
        let d_0 = self.compute_d(swap_amount_a, swap_amount_b)?;
        let old_balances = [swap_amount_a, swap_amount_b];
        let mut new_balances = [
            swap_amount_a.checked_add(deposit_amount_a)?,
            swap_amount_b.checked_add(deposit_amount_b)?,
        ];
        // Invariant after change
        let d_1 = self.compute_d(new_balances[0], new_balances[1])?;
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

            let d_2 = self.compute_d(new_balances[0], new_balances[1])?;
            U192::from(pool_token_supply)
                .checked_mul(d_2.checked_sub(d_0)?)?
                .checked_div(d_0)?
                .to_u64()
        }
    }

    /// Compute swap amount `y` in proportion to `x`
    /// Solve for y:
    /// y**2 + y * (sum' - (A*n**n - 1) * D / (A * n**n)) = D ** (n + 1) / (n ** (2 * n) * prod' * A)
    /// y**2 + b*y = c
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

    /// Compute swap amount `y` in proportion to `x`
    pub fn compute_y(&self, x: u64, d: U192) -> Option<u64> {
        self.compute_y_raw(x, d)?.to_u64()
    }

    /// Calculate withdrawal amount when withdrawing only one type of token
    /// Calculation:
    /// 1. Get current D
    /// 2. Solve Eqn against y_i for D - _token_amount
    pub fn compute_withdraw_one(
        &self,
        pool_token_amount: u64,
        pool_token_supply: u64,
        swap_base_amount: u64,  // Same denomination of token to be withdrawn
        swap_quote_amount: u64, // Counter denomination of token to be withdrawn
        fees: &Fees,
    ) -> Option<(u64, u64)> {
        let d_0 = self.compute_d(swap_base_amount, swap_quote_amount)?;
        let d_1 = d_0.checked_sub(
            U192::from(pool_token_amount)
                .checked_mul(d_0)?
                .checked_div(pool_token_supply.into())?,
        )?;
        let new_y = self.compute_y(swap_quote_amount, d_1)?;

        // expected_base_amount = swap_base_amount * d_1 / d_0 - new_y;
        let expected_base_amount = U192::from(swap_base_amount)
            .checked_mul(d_1)?
            .checked_div(d_0)?
            .to_u64()?
            .checked_sub(new_y)?;
        // expected_quote_amount = swap_quote_amount - swap_quote_amount * d_1 / d_0;
        let expected_quote_amount = swap_quote_amount.checked_sub(
            U192::from(swap_quote_amount)
                .checked_mul(d_1)?
                .checked_div(d_0)?
                .to_u64()?,
        )?;
        // new_base_amount = swap_base_amount - expected_base_amount * fee / fee_denominator;
        let new_base_amount = swap_base_amount
            .checked_sub(fees.normalized_trade_fee(N_COINS, expected_base_amount)?)?;
        // new_quote_amount = swap_quote_amount - expected_quote_amount * fee / fee_denominator;
        let new_quote_amount = swap_quote_amount
            .checked_sub(fees.normalized_trade_fee(N_COINS, expected_quote_amount)?)?;
        let dy = new_base_amount
            .checked_sub(self.compute_y(new_quote_amount, d_1)?)?
            .checked_sub(1)?; // Withdraw less to account for rounding errors
        let dy_0 = swap_base_amount.checked_sub(new_y)?;

        Some((dy, dy_0.checked_sub(dy)?))
    }

    /// Compute SwapResult after an exchange
    pub fn swap_to(
        &self,
        source_amount: u64,
        swap_source_amount: u64,
        swap_destination_amount: u64,
        fees: &Fees,
    ) -> Option<SwapResult> {
        let y = self.compute_y(
            swap_source_amount.checked_add(source_amount)?,
            self.compute_d(swap_source_amount, swap_destination_amount)?,
        )?;
        let dy = swap_destination_amount.checked_sub(y)?;
        let dy_fee = fees.trade_fee(dy)?;
        let admin_fee = fees.admin_trade_fee(dy_fee)?;

        let amount_swapped = dy.checked_sub(dy_fee)?;
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
            amp_factor in MIN_AMP..MAX_AMP,
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

        assert_eq!(
            result.amount_swapped,
            model.sim_exchange(0, 1, source_amount.into())
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
            amp_factor in MIN_AMP..MAX_AMP,
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
            amp_factor in MIN_AMP..MAX_AMP,
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
            amp_factor in MIN_AMP..MAX_AMP,
            deposit_amount_a in 0..MAX_TOKENS_IN,
            deposit_amount_b in 0..MAX_TOKENS_IN,
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
            amp_factor in MIN_AMP..MAX_AMP,
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
            amp_factor in MIN_AMP..MAX_AMP,
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
}
