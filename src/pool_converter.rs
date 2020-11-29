//! Conversions for pool tokens
use crate::bn::U256;

/// Converter to determine how much to deposit / withdraw, along with
/// proper initialization
pub struct Converter {
    /// Total supply
    pub supply: U256,
    /// Token A amount
    pub token_a: U256,
    /// Token B amount
    pub token_b: U256,
}

impl Converter {
    /// A tokens for pool tokens
    pub fn token_a_rate(&self, pool_tokens: U256) -> Option<U256> {
        pool_tokens
            .checked_mul(self.token_a)?
            .checked_div(self.supply)
    }

    /// B tokens for pool tokens
    pub fn token_b_rate(&self, pool_tokens: U256) -> Option<U256> {
        pool_tokens
            .checked_mul(self.token_b)?
            .checked_div(self.supply)
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
        expected: Option<U256>,
    ) {
        let calculator = Converter {
            supply,
            token_a,
            token_b,
        };
        assert_eq!(calculator.token_a_rate(deposit), expected);
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
