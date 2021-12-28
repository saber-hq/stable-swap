//! Logging related helpers.

use solana_program::log::sol_log_64;
use solana_program::msg;

/// Event enum
#[derive(Debug)]
pub enum Event {
    /// Burn event
    Burn,
    /// Deposit event
    Deposit,
    /// Swap event A -> B
    SwapAToB,
    /// Swap event B -> A
    SwapBToA,
    /// Withdraw event (A)
    WithdrawA,
    /// Withdraw event (B)
    WithdrawB,
}

/// Log event
pub fn log_event(
    event: Event,
    token_a_amount: u64,
    token_b_amount: u64,
    pool_token_amount: u64,
    fee: u64,
) {
    msg!(match event {
        Event::Burn => "Event: Burn",
        Event::Deposit => "Event: Deposit",
        Event::SwapAToB => "Event: SwapAToB",
        Event::SwapBToA => "Event: SwapBToA",
        Event::WithdrawA => "Event: WithdrawA",
        Event::WithdrawB => "Event: WithdrawB",
    });

    solana_program::log::sol_log_64(
        event as u64,
        token_a_amount,
        token_b_amount,
        pool_token_amount,
        fee,
    );
}

/// Log slippage error
pub fn log_slippage_error(minimum_amount: u64, computed_amount: u64) {
    sol_log_64(0, 0, 0, minimum_amount, computed_amount);
}
