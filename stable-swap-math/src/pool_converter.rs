//! Conversions for pool tokens
use crate::math::FeeCalculator;
use num_traits::ToPrimitive;
use stable_swap_client::fees::Fees;

/// Converter to determine how much to deposit / withdraw, along with
/// proper initialization
pub struct PoolTokenConverter<'a> {
    /// Total supply
    pub supply: u64,
    /// Token A amount
    pub token_a: u64,
    /// Token B amount
    pub token_b: u64,
    /// Fees
    pub fees: &'a Fees,
}

impl PoolTokenConverter<'_> {
    /// A tokens for pool tokens
    pub fn token_a_rate(&self, pool_tokens: u64) -> Option<(u64, u64, u64)> {
        let amount = (pool_tokens as u128)
            .checked_mul(self.token_a as u128)?
            .checked_div(self.supply as u128)?
            .to_u64()?;
        let fee = self.fees.withdraw_fee(amount)?;
        let admin_fee = self.fees.admin_withdraw_fee(fee)?;

        Some((amount.checked_sub(fee)?, fee, admin_fee))
    }

    /// B tokens for pool tokens
    pub fn token_b_rate(&self, pool_tokens: u64) -> Option<(u64, u64, u64)> {
        let amount = (pool_tokens as u128)
            .checked_mul(self.token_b as u128)?
            .checked_div(self.supply as u128)?
            .to_u64()?;
        let fee = self.fees.withdraw_fee(amount)?;
        let admin_fee = self.fees.admin_withdraw_fee(fee)?;

        Some((amount.checked_sub(fee)?, fee, admin_fee))
    }

    /// Calculates the number of LP tokens that correspond to an amount of token A.
    /// This does not take withdraw fees into account.
    pub fn lp_tokens_for_a_excluding_fees(&self, token_a_amount: u64) -> Option<u64> {
        (token_a_amount as u128)
            .checked_mul(self.supply as u128)?
            .checked_div(self.token_a as u128)?
            .to_u64()
    }

    /// Calculates the number of LP tokens that correspond to an amount of token B.
    /// This does not take withdraw fees into account.
    pub fn lp_tokens_for_b_excluding_fees(&self, token_b_amount: u64) -> Option<u64> {
        (token_b_amount as u128)
            .checked_mul(self.supply as u128)?
            .checked_div(self.token_b as u128)?
            .to_u64()
    }
}

#[cfg(test)]
#[allow(clippy::unwrap_used, clippy::integer_arithmetic)]
mod tests {

    use crate::curve;

    use super::*;

    fn check_pool_token_a_rate(
        token_a: u64,
        token_b: u64,
        deposit: u64,
        supply: u64,
        expected_before_fees: Option<u64>,
    ) {
        let fees = Fees {
            admin_trade_fee_numerator: 0,
            admin_trade_fee_denominator: 1,
            admin_withdraw_fee_numerator: 1,
            admin_withdraw_fee_denominator: 2,
            trade_fee_numerator: 0,
            trade_fee_denominator: 1,
            withdraw_fee_numerator: 1,
            withdraw_fee_denominator: 2,
        };
        let calculator = PoolTokenConverter {
            supply,
            token_a,
            token_b,
            fees: &fees,
        };
        let expected_result = if let Some(expected_before_fees) = expected_before_fees {
            let expected_fees = fees.withdraw_fee(expected_before_fees).unwrap();
            let expected_admin_fees = fees.admin_withdraw_fee(expected_fees).unwrap();
            let expected_amount = expected_before_fees - expected_fees;
            Some((expected_amount, expected_fees, expected_admin_fees))
        } else {
            None
        };
        assert_eq!(calculator.token_a_rate(deposit), expected_result);
        assert_eq!(calculator.supply, supply);
    }

    #[test]
    fn issued_tokens() {
        check_pool_token_a_rate(2, 50, 5, 10, Some(1));
        check_pool_token_a_rate(10, 10, 5, 10, Some(5));
        check_pool_token_a_rate(5, 100, 5, 10, Some(2));
        check_pool_token_a_rate(5, curve::MAX_TOKENS_IN, 5, 10, Some(2));
    }
}
