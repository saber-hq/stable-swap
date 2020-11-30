//! Module for processing admin-only instructions.

use crate::{error::SwapError, fees::Fees, state::SwapInfo};
use solana_sdk::{account_info::AccountInfo, entrypoint::ProgramResult, pubkey::Pubkey};

/// Process admin instruction
pub fn process_admin_instruction() -> ProgramResult {
    unimplemented!("process_admin_instruction not implemented");
}

/// Access control for admin only instructions
fn is_admin(expected_admin_key: &Pubkey, admin_account_info: &AccountInfo) -> ProgramResult {
    if expected_admin_key != admin_account_info.key {
        return Err(SwapError::Unauthorized.into());
    }
    if !admin_account_info.is_signer {
        return Err(SwapError::Unauthorized.into());
    }
    Ok(())
}

/// Ramp to future a
fn ramp_a(_swap_state: &SwapInfo, _future_a: u64, _future_time: u64) -> ProgramResult {
    unimplemented!("ramp_a not implemented");
}

/// Stop ramp a
fn stop_ramp_a(_swap_state: &SwapInfo) -> ProgramResult {
    unimplemented!("stop_ramp_a not implemented");
}

/// Set new admin
fn set_new_admin(_swap_state: &SwapInfo, _new_admin: &Pubkey) -> ProgramResult {
    unimplemented!("set_new_admin not implemented");
}

/// Set new fees
fn set_new_fees(_swap_state: &SwapInfo, _new_fees: Fees) -> ProgramResult {
    unimplemented!("set_new_fees not implemented");
}

/// Pause swap
fn pause(_swap_state: &SwapInfo) -> ProgramResult {
    unimplemented!("pause not implemented")
}

/// Unpause swap
fn unpause(_swap_state: &SwapInfo) -> ProgramResult {
    unimplemented!("unpause not implemented")
}
