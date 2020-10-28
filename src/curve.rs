//! Swap calculations and curve implementations

/// Encodes all results of swapping from a source token to a destination token
pub struct SwapResult {
    /// New amount of source token
    pub new_source_amount: u64,
    /// New amount of destination token
    pub new_destination_amount: u64,
    /// Amount of destination token swapped
    pub amount_swapped: u64,
}

/// The StableSwap invariant calculator.
pub struct StableSwap {
    /// Amplification coefficient (A)
    pub amp_factor: u64,
}

impl StableSwap {
    /// Compute stable swap invariant (D)
    /// Equation:
    /// A * sum(x_i) * n**n + D = A * D * n**n + D**(n+1) / (n**n * prod(x_i))
    pub fn compute_d(&self, amount_a: u64, amount_b: u64) -> u64 {
        // XXX: Curve uses u256
        // TODO: Handle overflows
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
    /// Solve for y:
    /// y**2 + y * (sum' - (A*n**n - 1) * D / (A * n**n)) = D ** (n + 1) / (n ** (2 * n) * prod' * A)
    /// y**2 + b*y = c
    pub fn compute_y(&self, x: u64, d: u64) -> u64 {
        // XXX: Curve uses u256
        // TODO: Handle overflows
        let n_coins = 2;
        let leverage = self.amp_factor * n_coins; // A * n

        // sum' = prod' = x
        // c =  D ** (n + 1) / (n ** (2 * n) * prod' * A)
        let c = d * d * d / (x * n_coins * n_coins * leverage);
        // b = sum' - (A*n**n - 1) * D / (A * n**n)
        let b = x + d / leverage; // d is subtracted on line 82

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

    /// Compute SwapResult after an exchange
    pub fn swap_to(
        &self,
        source_amount: u64,
        swap_source_amount: u64,
        swap_destination_amount: u64,
        fee_numerator: u64,
        fee_denominator: u64,
    ) -> Option<SwapResult> {
        let y = self.compute_y(
            swap_source_amount + source_amount,
            self.compute_d(swap_source_amount, swap_destination_amount),
        );
        let dy = swap_destination_amount.checked_sub(y)?;
        let dy_fee = dy
            .checked_mul(fee_numerator)?
            .checked_div(fee_denominator)?;

        let amount_swapped = dy - dy_fee;
        let new_destination_amount = swap_destination_amount.checked_sub(amount_swapped)?;
        let new_source_amount = swap_source_amount.checked_add(source_amount)?;

        Some(SwapResult {
            new_source_amount,
            new_destination_amount,
            amount_swapped,
        })
    }
}

/// Conversions for pool tokens, how much to deposit / withdraw, along with
/// proper initialization
pub struct PoolTokenConverter {
    /// Total supply
    pub supply: u64,
    /// Token A amount
    pub token_a: u64,
    /// Token B amount
    pub token_b: u64,
}

impl PoolTokenConverter {
    /// Create a converter based on existing market information
    pub fn new(supply: u64, token_a: u64, token_b: u64) -> Self {
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
    use sim::{Model, MODEL_FEE_DENOMINATOR, MODEL_FEE_NUMERATOR};

    fn check_pool_token_a_rate(
        token_a: u64,
        token_b: u64,
        deposit: u64,
        supply: u64,
        expected: Option<u64>,
    ) {
        let calculator = PoolTokenConverter::new(supply, token_a, token_b);
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
            amp_factor: model.get_properties().amp,
        };
        let d = swap.compute_d(amount_a, amount_b);
        assert_eq!(d, model.sim_d());
        d
    }

    fn check_y(model: &Model, x: u64, d: u64) {
        let swap = StableSwap {
            amp_factor: model.get_properties().amp,
        };
        assert_eq!(swap.compute_y(x, d), model.sim_y(0, 1, x))
    }

    #[test]
    fn test_curve_math() {
        let n_coin = 2;

        let model_no_balance = Model::new(1, vec![0, 0], n_coin);
        check_d(&model_no_balance, 0, 0);

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
        let amp_factor: u64 = rng.gen_range(1, 100000);
        println!(
            "amount_a: {}, amount_b: {}, amp_factor: {}",
            amount_a, amount_b, amp_factor
        );

        let model = Model::new(amp_factor, vec![amount_a, amount_b], n_coin);
        let d = check_d(&model, amount_a, amount_b);
        check_y(&model, rng.gen_range(0, amount_a), d);
    }

    fn check_swap(
        amp_factor: u64,
        source_amount: u64,
        swap_source_amount: u64,
        swap_destination_amount: u64,
    ) {
        let n_coin = 2;
        let swap = StableSwap { amp_factor };
        let result = swap
            .swap_to(
                source_amount,
                swap_source_amount,
                swap_destination_amount,
                MODEL_FEE_NUMERATOR,
                MODEL_FEE_DENOMINATOR,
            )
            .unwrap();
        let model = Model::new(
            swap.amp_factor,
            vec![swap_source_amount, swap_destination_amount],
            n_coin,
        );

        assert_eq!(
            result.amount_swapped,
            model.sim_exchange(0, 1, source_amount)
        );
        assert_eq!(result.new_source_amount, swap_source_amount + source_amount);
        assert_eq!(
            result.new_destination_amount,
            swap_destination_amount - result.amount_swapped
        );
    }

    #[test]
    fn test_swap_calculation() {
        let source_amount: u64 = 100;
        let swap_source_amount: u64 = 1000;
        let swap_destination_amount: u64 = 50000;

        check_swap(
            1,
            source_amount,
            swap_source_amount,
            swap_destination_amount,
        );
        check_swap(
            10,
            source_amount,
            swap_source_amount,
            swap_destination_amount,
        );
        check_swap(
            100,
            source_amount,
            swap_source_amount,
            swap_destination_amount,
        );
        check_swap(
            1000,
            source_amount,
            swap_source_amount,
            swap_destination_amount,
        );
        check_swap(
            10000,
            source_amount,
            swap_source_amount,
            swap_destination_amount,
        );
    }

    #[test]
    fn test_swap_calculation_with_random_inputs() {
        let mut rng = rand::thread_rng();

        let amp_factor: u64 = rng.gen_range(1, 100000);
        let source_amount: u64 = rng.gen_range(1, 100000);
        let swap_source_amount: u64 = rng.gen_range(1, 100000);
        let swap_destination_amount: u64 = rng.gen_range(1, 100000);
        println!(
            "amp_factor: {}, source_amount: {}, swap_source_amount: {}, swap_source_amount: {}",
            amp_factor, source_amount, swap_source_amount, swap_destination_amount
        );

        check_swap(
            amp_factor,
            source_amount,
            swap_source_amount,
            swap_destination_amount,
        );
    }
}
