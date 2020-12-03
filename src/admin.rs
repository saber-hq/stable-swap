//! Module for processing admin-only instructions.

use crate::{fees::Fees, instruction::SwapInstruction, state::SwapInfo};
use solana_sdk::{account_info::AccountInfo, entrypoint::ProgramResult, pubkey::Pubkey};

/// Process admin instruction
pub fn process_admin_instruction(
    _instruction: SwapInstruction,
    _program_id: &Pubkey,
    _accounts: &[AccountInfo],
    _input: &[u8],
) -> ProgramResult {
    unimplemented!("process_admin_instruction not implemened")
}

/// Access control for admin only instructions
fn is_admin(_expected_admin_key: &Pubkey, _admin_account_info: &AccountInfo) -> ProgramResult {
    unimplemented!("is_admin not implemented")
}

/// Ramp to future a
fn ramp_a(_swap_state: &SwapInfo, _future_a: u64, _future_time: u64) -> ProgramResult {
    unimplemented!("ramp_a not implemented");
}

/// Stop ramp a
fn stop_ramp_a(_swap_state: &SwapInfo) -> ProgramResult {
    unimplemented!("stop_ramp_a not implemented");
}

/// Pause swap
fn pause(_swap_state: &SwapInfo) -> ProgramResult {
    unimplemented!("pause not implemented")
}

/// Unpause swap
fn unpause(_swap_state: &SwapInfo) -> ProgramResult {
    unimplemented!("unpause not implemented")
}

/// Set fee account a
fn set_fee_account_a(_swap_state: &SwapInfo, _new_fee_account_a: &Pubkey) -> ProgramResult {
    unimplemented!("set_fee_account_a not implemented")
}

/// Set fee account a
fn set_fee_account_b(_swap_state: &SwapInfo, _new_fee_account_b: &Pubkey) -> ProgramResult {
    unimplemented!("set_fee_account_b not implemented")
}

/// Apply new admin
fn apply_new_admin(_swap_state: &SwapInfo, _new_admin: &Pubkey) -> ProgramResult {
    unimplemented!("apply_new_admin not implemented");
}

/// Commit new admin
fn commit_new_admin(_swap_state: &SwapInfo, _new_admin: &Pubkey) -> ProgramResult {
    unimplemented!("set_new_admin not implemented");
}

/// Revert new admin
fn revert_new_admin(_swap_state: &SwapInfo, _new_admin: &Pubkey) -> ProgramResult {
    unimplemented!("revert_new_admin not implemented");
}

/// Apply new fees
fn apply_new_fees(_swap_state: &SwapInfo) -> ProgramResult {
    unimplemented!("apply_new_fees not implemented");
}

/// Commit new fees
fn commit_new_fees(_swap_state: &SwapInfo, _new_fees: Fees) -> ProgramResult {
    unimplemented!("set_new_fees not implemented");
}

/// Revert new fees
fn revert_new_fees(_swap_state: &SwapInfo) -> ProgramResult {
    unimplemented!("set_new_fees not implemented");
}
