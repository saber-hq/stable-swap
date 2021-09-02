//! Utilities for getting the virtual price of a pool.

use num_traits::ToPrimitive;

const PRECISION: u128 = 1_000_000_000_000;

/// An LP token's price.
#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub struct Price {
    /// Price of 1 LP token times 1 trillion.
    pub raw: u128,
}

impl From<u128> for Price {
    fn from(raw: u128) -> Price {
        Price { raw }
    }
}

impl From<Price> for u128 {
    fn from(price: Price) -> u128 {
        price.raw
    }
}

impl Price {
    /// Calculates the virtual price of a pool token.
    pub fn calculate_virtual_price(
        lp_mint_supply: u64,
        token_a_reserve: u64,
        token_b_reserve: u64,
    ) -> Option<Price> {
        let price_raw = (lp_mint_supply as u128)
            .checked_mul(PRECISION)?
            .checked_div((token_a_reserve as u128).checked_add(token_b_reserve.into())?)?;
        Some(Price { raw: price_raw })
    }

    /// Adds this [Price] with another [Price].
    pub fn checked_add(&self, v: &Self) -> Option<Self> {
        self.raw.checked_add(v.raw).map(|raw| Price { raw })
    }

    /// Multiplies this price by the token amount.
    pub fn checked_mul_tokens(&self, amount: u64) -> Option<u64> {
        self.raw
            .checked_mul(amount.into())?
            .checked_div(PRECISION)?
            .to_u64()
    }
}
