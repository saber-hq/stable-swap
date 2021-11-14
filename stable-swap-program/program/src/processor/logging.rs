//! Logging related helpers.

use solana_program::msg;
use solana_program::pubkey::Pubkey;

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
    timestamp: i64,
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
    msg!("Timestamp: {}", timestamp);
}

pub fn log_keys_mismatch(msg: &str, left: Pubkey, right: Pubkey) {
    msg!(msg);
    msg!("Left:");
    left.log();
    msg!("Right:");
    right.log();
}

pub fn log_keys_mismatch_optional(msg: &str, left: Option<Pubkey>, right: Option<Pubkey>) {
    msg!(msg);
    msg!("Left:");
    if let Some(left_inner) = left {
        left_inner.log();
    } else {
        msg!("left: missing");
    }
    msg!("Right:");
    if let Some(right_inner) = right {
        right_inner.log();
    } else {
        msg!("right: missing");
    }
}

/// Log slippage error
pub fn log_slippage_error(minimum_amount: u64, computed_amount: u64) {
    msg!(0, 0, 0, minimum_amount, computed_amount);
}
