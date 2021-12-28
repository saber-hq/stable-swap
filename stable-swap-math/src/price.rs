//! Utilities for getting the virtual price of a pool.

use crate::bn::U192;

/// A Saber swap.
#[derive(Copy, Clone, Default, Debug, PartialEq, Eq)]
pub struct SaberSwap {
    /// Initial amp factor.
    pub initial_amp_factor: u64,
    /// Target amp factor.
    pub target_amp_factor: u64,
    /// Current timestmap.
    pub current_ts: i64,
    /// Start ramp timestamp.
    pub start_ramp_ts: i64,
    /// Stop ramp timestamp.
    pub stop_ramp_ts: i64,

    /// Total supply of LP tokens.
    pub lp_mint_supply: u64,
    /// Amount of token A.
    pub token_a_reserve: u64,
    /// Amount of token B.
    pub token_b_reserve: u64,
}

impl SaberSwap {
    /// Calculates the amount of pool tokens represented by the given amount of scaled cash
    pub fn calculate_pool_tokens_from_virtual_amount(&self, virtual_amount: u64) -> Option<u64> {
        U192::from(virtual_amount)
            .checked_mul(self.lp_mint_supply.into())?
            .checked_div(self.compute_d()?)?
            .to_u64()
    }

    /// Calculates the virtual price of the given amount of pool tokens.
    pub fn calculate_virtual_price_of_pool_tokens(&self, pool_token_amount: u64) -> Option<u64> {
        self.compute_d()?
            .checked_mul(pool_token_amount.into())?
            .checked_div(self.lp_mint_supply.into())?
            .to_u64()
    }

    /// Computes D, which is the virtual price times the total supply of the pool.
    pub fn compute_d(&self) -> Option<U192> {
        let calculator = crate::curve::StableSwap::new(
            self.initial_amp_factor,
            self.target_amp_factor,
            self.current_ts,
            self.start_ramp_ts,
            self.stop_ramp_ts,
        );
        calculator.compute_d(self.token_a_reserve, self.token_b_reserve)
    }
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use proptest::prelude::*;

    use super::SaberSwap;

    prop_compose! {
        fn arb_swap_unsafe()(
            token_a_reserve in 1_u64..=u64::MAX,
            token_b_reserve in 1_u64..=u64::MAX,
            lp_mint_supply in 1_u64..=u64::MAX
        ) -> SaberSwap {
            SaberSwap {
                initial_amp_factor: 1,
                target_amp_factor: 1,
                current_ts: 1,
                start_ramp_ts: 1,
                stop_ramp_ts: 1,

                lp_mint_supply,
                token_a_reserve,
                token_b_reserve
            }
        }
    }

    prop_compose! {
        #[allow(clippy::integer_arithmetic)]
        fn arb_token_amount(decimals: u8)(
            amount in 1_u64..=(u64::MAX / 10u64.pow(decimals.into())),
        ) -> u64 {
            amount
        }
    }

    prop_compose! {
        fn arb_swap_reserves()(
            decimals in 0_u8..=19_u8,
            swap in arb_swap_unsafe()
        ) (
            token_a_reserve in arb_token_amount(decimals),
            token_b_reserve in arb_token_amount(decimals),
            swap in Just(swap)
        ) -> SaberSwap {
            SaberSwap {
                token_a_reserve,
                token_b_reserve,
                ..swap
            }
        }
    }

    prop_compose! {
        fn arb_swap()(
            swap in arb_swap_reserves()
        ) (
            // targeting a maximum virtual price of 4
            // anything higher than this is a bit ridiculous
            lp_mint_supply in 1_u64.max((swap.token_a_reserve.min(swap.token_b_reserve)) / 4)..=(swap.token_a_reserve.checked_add(swap.token_b_reserve).unwrap_or(u64::MAX)),
            swap in Just(swap)
        ) -> SaberSwap {
            SaberSwap {
                lp_mint_supply,
                ..swap
            }
        }
    }

    proptest! {
      #[test]
      fn test_invertible(
          swap in arb_swap(),
          amount in 0_u64..=u64::MAX
      ) {
        let maybe_virt = swap.calculate_virtual_price_of_pool_tokens(amount);
        if maybe_virt.is_none() {
            // ignore virt calculation failures, since they won't be used in production
            return Ok(());
        }
        let virt = maybe_virt.unwrap();
        if virt == 0 {
            // this case doesn't matter because it's a noop.
            return Ok(());
        }

        let result_lp = swap.calculate_pool_tokens_from_virtual_amount(virt).unwrap();

        // tokens should never be created.
        prop_assert!(result_lp <= amount);

        // these numbers should be very close to each other.
        prop_assert!(1.0_f64 - (result_lp as f64) / (amount as f64) < 0.001_f64);
      }
    }
}
