//! Conversions for pool tokens
use crate::{bn::U256, fees::Fees};

/// Converter to determine how much to deposit / withdraw, along with
/// proper initialization
pub struct Converter<'a> {
    /// Total supply
    pub supply: U256,
    /// Token A amount
    pub token_a: U256,
    /// Token B amount
    pub token_b: U256,
    /// Fees
    pub fees: &'a Fees,
}

impl Converter<'_> {
    /// A tokens for pool tokens
    pub fn token_a_rate(&self, pool_tokens: U256) -> Option<(U256, U256)> {
        let amount = pool_tokens
            .checked_mul(self.token_a)?
            .checked_div(self.supply)?;
        let fee = self.fees.withdraw_fee(amount)?;
        let admin_fee = self.fees.admin_withdraw_fee(fee)?;

        Some((amount.checked_sub(fee)?, admin_fee))
    }

    /// B tokens for pool tokens
    pub fn token_b_rate(&self, pool_tokens: U256) -> Option<(U256, U256)> {
        let amount = pool_tokens
            .checked_mul(self.token_b)?
            .checked_div(self.supply)?;
        let fee = self.fees.withdraw_fee(amount)?;
        let admin_fee = self.fees.admin_withdraw_fee(fee)?;

        Some((amount.checked_sub(fee)?, admin_fee))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn check_pool_token_a_rate(
        token_a: U256,
        token_b: U256,
        deposit: U256,
        supply: U256,
        expected_before_fees: Option<U256>,
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
        let calculator = Converter {
            supply,
            token_a,
            token_b,
            fees: &fees,
        };
        let expected_result = if expected_before_fees.is_some() {
            let expected_fees = fees.withdraw_fee(expected_before_fees.unwrap()).unwrap();
            let expected_admin_fees = fees.admin_withdraw_fee(expected_fees).unwrap();
            let expected_amount = expected_before_fees.unwrap() - expected_fees;
            Some((expected_amount, expected_admin_fees))
        } else {
            None
        };
        assert_eq!(calculator.token_a_rate(deposit), expected_result);
        assert_eq!(calculator.supply, supply);
    }

    #[test]
    fn issued_tokens() {
        check_pool_token_a_rate(2.into(), 50.into(), 5.into(), 10.into(), Some(1.into()));
        check_pool_token_a_rate(10.into(), 10.into(), 5.into(), 10.into(), Some(5.into()));
        check_pool_token_a_rate(5.into(), 100.into(), 5.into(), 10.into(), Some(2.into()));
        check_pool_token_a_rate(5.into(), U256::MAX, 5.into(), 10.into(), Some(2.into()));
        check_pool_token_a_rate(U256::MAX, U256::MAX, 5.into(), 10.into(), None);
    }
}
