//! Swap calculations and curve implementations

/// Initial amount of pool tokens for swap contract, hard-coded to something
/// "sensible" given a maximum of u64.
/// Note that on Ethereum, Uniswap uses the geometric mean of all provided
/// input amounts, and Balancer uses 100 * 10 ^ 18.
pub const INITIAL_SWAP_POOL_AMOUNT: u64 = 1_000_000_000;

/// Encodes all results of swapping from a source token to a destination token
// pub struct SwapResult {
//     /// New amount of source token
//     pub new_source_amount: u64,
//     /// New amount of destination token
//     pub new_destination_amount: u64,
//     /// Amount of destination token swapped
//     pub amount_swapped: u64,
// }

// impl SwapResult {
//     /// SwapResult for swap from one currency into another, given pool information
//     /// and fee
//     pub fn swap_to(
//         source_amount: u64,
//         swap_source_amount: u64,
//         swap_destination_amount: u64,
//         fee_numerator: u64,
//         fee_denominator: u64,
//     ) -> Option<SwapResult> {
//         let invariant = swap_source_amount.checked_mul(swap_destination_amount)?;
//
//         // debit the fee to calculate the amount swapped
//         let fee = source_amount
//             .checked_mul(fee_numerator)?
//             .checked_div(fee_denominator)?;
//         let new_source_amount_less_fee = swap_source_amount
//             .checked_add(source_amount)?
//             .checked_sub(fee)?;
//         let new_destination_amount = invariant.checked_div(new_source_amount_less_fee)?;
//         let amount_swapped = swap_destination_amount.checked_sub(new_destination_amount)?;
//
//         // actually add the whole amount coming in
//         let new_source_amount = swap_source_amount.checked_add(source_amount)?;
//         Some(SwapResult {
//             new_source_amount,
//             new_destination_amount,
//             amount_swapped,
//         })
//     }
// }

/// The StableSwap invariant calculator.
pub struct StableSwap {
    /// Amplification coefficient (A)
    pub amp_factor: u64,
}

impl StableSwap {
    /// Compute stable swap invariant
    pub fn compute_d(&self, amount_a: u64, amount_b: u64) -> u64 {
        // XXX: Curve uses u256
        let n_coins: u64 = 2; // n
        let sum_x = amount_a + amount_b; // sum(x_i), a.k.a S
        if sum_x == 0 {
            0
        } else {
            let mut d_prev: u64;
            let mut d = sum_x;
            let leverage = self.amp_factor * n_coins; // A * n

            // Newton's method to approximate D
            for _ in 0..64 {
                let mut d_p = d;
                d_p = d_p * d / (amount_a * n_coins);
                d_p = d_p * d / (amount_b * n_coins);
                d_prev = d;
                d = (leverage * sum_x + d_p * n_coins) * d
                    / ((leverage - 1) * d + (n_coins + 1) * d_p);
                // Equality with the precision of 1
                if d > d_p {
                    if d - d_prev <= 1 {
                        break;
                    }
                } else if d_prev - d <= 1 {
                    break;
                }
            }

            d
        }
    }

    /// Compute swap amount `y` in proportion to `x`
    pub fn compute_y(&self, x: u64, d: u64) -> u64 {
        // XXX: Curve uses u256
        let n_coins = 2;
        let leverage = self.amp_factor * n_coins; // A * n

        // c =  D ** (n + 1) / (n ** (2 * n) * prod' * A)
        let c = d * d * d / (x * n_coins * n_coins * leverage);
        // b = sum' - (A*n**n - 1) * D / (A * n**n)
        let b = x + d / leverage; // - d

        // Solve for y by approximating: y**2 + b*y = c
        let mut y_prev: u64;
        let mut y = d;
        for _ in 0..64 {
            y_prev = y;
            y = (y * y + c) / (2 * y + b - d);
            if y > y_prev {
                if y - y_prev <= 1 {
                    break;
                }
            } else if y_prev - y <= 1 {
                break;
            }
        }

        y
    }
}

/// Conversions for pool tokens, how much to deposit / withdraw, along with
/// proper initialization
pub struct PoolTokenConverter {
    /// Total supply
    pub supply: u64, // TODO: Remove
    /// Token A amount
    pub token_a: u64,
    /// Token B amount
    pub token_b: u64,
}

impl PoolTokenConverter {
    /// Create a converter based on existing market information
    pub fn new_existing(supply: u64, token_a: u64, token_b: u64) -> Self {
        Self {
            supply,
            token_a,
            token_b,
        }
    }

    /// Create a converter for a new pool token, no supply present yet.
    /// According to Uniswap, the geometric mean protects the pool creator
    /// in case the initial ratio is off the market.
    pub fn new_pool(token_a: u64, token_b: u64) -> Self {
        let supply = INITIAL_SWAP_POOL_AMOUNT;
        Self {
            supply,
            token_a,
            token_b,
        }
    }

    /// A tokens for pool tokens
    pub fn token_a_rate(&self, pool_tokens: u64) -> Option<u64> {
        pool_tokens
            .checked_mul(self.token_a)?
            .checked_div(self.supply)
    }

    /// B tokens for pool tokens
    pub fn token_b_rate(&self, pool_tokens: u64) -> Option<u64> {
        pool_tokens
            .checked_mul(self.token_b)?
            .checked_div(self.supply)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rand::Rng;
    use sim::Model;

    #[test]
    fn initial_pool_amount() {
        let token_converter = PoolTokenConverter::new_pool(1, 5);
        assert_eq!(token_converter.supply, INITIAL_SWAP_POOL_AMOUNT);
    }

    fn check_pool_token_a_rate(
        token_a: u64,
        token_b: u64,
        deposit: u64,
        supply: u64,
        expected: Option<u64>,
    ) {
        let calculator = PoolTokenConverter::new_existing(supply, token_a, token_b);
        assert_eq!(calculator.token_a_rate(deposit), expected);
    }

    #[test]
    fn issued_tokens() {
        check_pool_token_a_rate(2, 50, 5, 10, Some(1));
        check_pool_token_a_rate(10, 10, 5, 10, Some(5));
        check_pool_token_a_rate(5, 100, 5, 10, Some(2));
        check_pool_token_a_rate(5, u64::MAX, 5, 10, Some(2));
        check_pool_token_a_rate(u64::MAX, u64::MAX, 5, 10, None);
    }

    fn check_d(model: &Model, amount_a: u64, amount_b: u64) -> u64 {
        let swap = StableSwap {
            amp_factor: model.get_properties().A,
        };
        let d = swap.compute_d(amount_a, amount_b);
        assert_eq!(d, model.sim_d());
        d
    }

    fn check_y(model: &Model, x: u64, d: u64) {
        let swap = StableSwap {
            amp_factor: model.get_properties().A,
        };
        assert_eq!(swap.compute_y(x, d), model.sim_y(0, 1, x))
    }

    #[test]
    fn test_curve_math() {
        let n_coin = 2;
        let amount_a = 100000;
        let amount_b = 100000;
        let model_a1 = Model::new(1, vec![amount_a, amount_b], n_coin);
        let d = check_d(&model_a1, amount_a, amount_b);
        check_y(&model_a1, 1, d);
        check_y(&model_a1, 1000, d);
        check_y(&model_a1, amount_a, d);

        let model_a100 = Model::new(100, vec![amount_a, amount_b], n_coin);
        let d = check_d(&model_a100, amount_a, amount_b);
        check_y(&model_a100, 1, d);
        check_y(&model_a100, 1000, d);
        check_y(&model_a100, amount_a, d);

        let model_a1000 = Model::new(1000, vec![amount_a, amount_b], n_coin);
        let d = check_d(&model_a1000, amount_a, amount_b);
        check_y(&model_a1000, 1, d);
        check_y(&model_a1000, 1000, d);
        check_y(&model_a1000, amount_a, d);
    }

    #[test]
    fn test_curve_math_with_random_inputs() {
        let mut rng = rand::thread_rng();

        let n_coin = 2;
        let amount_a: u64 = rng.gen_range(1, 100000);
        let amount_b: u64 = rng.gen_range(1, 100000);
        let amp_factor: u64 = rng.gen_range(1, 5000);
        let model = Model::new(amp_factor, vec![amount_a, amount_b], n_coin);
        let d = check_d(&model, amount_a, amount_b);
        check_y(&model, rng.gen_range(0, amount_a), d);
    }

    // #[test]
    // fn swap_calculation() {
    //     // calculation on https://github.com/solana-labs/solana-program-library/issues/341
    //     let swap_source_amount: u64 = 1000;
    //     let swap_destination_amount: u64 = 50000;
    //     let fee_numerator: u64 = 1;
    //     let fee_denominator: u64 = 100;
    //     let source_amount: u64 = 100;
    //     let result = SwapResult::swap_to(
    //         source_amount,
    //         swap_source_amount,
    //         swap_destination_amount,
    //         fee_numerator,
    //         fee_denominator,
    //     )
    //     .unwrap();
    //     assert_eq!(result.new_source_amount, 1100);
    //     assert_eq!(result.amount_swapped, 4505);
    //     assert_eq!(result.new_destination_amount, 45495);
    // }
}
