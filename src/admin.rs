//! Module for processing admin-only instructions.

#![cfg(feature = "program")]

use crate::{
    fees::Fees,
    instruction::{AdminInstruction, RampAData},
};
#[cfg(target_arch = "bpf")]
use solana_sdk::info;
use solana_sdk::{account_info::AccountInfo, entrypoint::ProgramResult, info, pubkey::Pubkey};

/// Process admin instruction
pub fn process_admin_instruction(
    instruction: &AdminInstruction,
    program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    match *instruction {
        AdminInstruction::RampA(RampAData {
            future_amp,
            future_time,
        }) => {
            info!("Instruction : RampA");
            ramp_a(program_id, future_amp, future_time, accounts)
        }
        AdminInstruction::StopRampA => {
            info!("Instruction: StopRampA");
            stop_ramp_a(program_id, accounts)
        }
        AdminInstruction::Pause => {
            info!("Instruction: Pause");
            pause(program_id, accounts)
        }
        AdminInstruction::Unpause => {
            info!("Instruction: Unpause");
            unpause(program_id, accounts)
        }
        AdminInstruction::SetFeeAccountA => {
            info!("Instruction: SetFeeAccountA");
            set_fee_account_a(program_id, accounts)
        }
        AdminInstruction::SetFeeAccountB => {
            info!("Instruction: SetFeeAccountB");
            set_fee_account_b(program_id, accounts)
        }
        AdminInstruction::ApplyNewAdmin => {
            info!("Instruction: ApplyNewAdmin");
            apply_new_admin(program_id, accounts)
        }
        AdminInstruction::CommitNewAdmin => {
            info!("Instruction: CommitNewAdmin");
            commit_new_admin(program_id, accounts)
        }
        AdminInstruction::RevertNewAdmin => {
            info!("Instruction: RevertNewAdmin");
            revert_new_admin(program_id, accounts)
        }
        AdminInstruction::ApplyNewFees => {
            info!("Instruction: ApplyNewFees");
            apply_new_fees(program_id, accounts)
        }
        AdminInstruction::CommitNewFees(fees) => {
            info!("Instruction: CommitNewAdmin");
            commit_new_fees(program_id, fees, accounts)
        }
        AdminInstruction::RevertNewFees => {
            info!("Instruction: ReverNewFees");
            revert_new_fees(program_id, accounts)
        }
    }
}

/// Access control for admin only instructions
fn _is_admin(_expected_admin_key: &Pubkey, _admin_account_info: &AccountInfo) -> ProgramResult {
    unimplemented!("is_admin not implemented")
}

/// Ramp to future a
fn ramp_a(
    _program_id: &Pubkey,
    _future_a: u64,
    _future_time: u64,
    _account: &[AccountInfo],
) -> ProgramResult {
    unimplemented!("ramp_a not implemented");
}

/// Stop ramp a
fn stop_ramp_a(_program_id: &Pubkey, _accounts: &[AccountInfo]) -> ProgramResult {
    unimplemented!("stop_ramp_a not implemented");
}

/// Pause swap
fn pause(_program_id: &Pubkey, _accounts: &[AccountInfo]) -> ProgramResult {
    unimplemented!("pause not implemented")
}

/// Unpause swap
fn unpause(_program_id: &Pubkey, _accounts: &[AccountInfo]) -> ProgramResult {
    unimplemented!("unpause not implemented")
}

/// Set fee account a
fn set_fee_account_a(_program_id: &Pubkey, _accounts: &[AccountInfo]) -> ProgramResult {
    unimplemented!("set_fee_account_a not implemented")
}

/// Set fee account a
fn set_fee_account_b(_program_id: &Pubkey, _accounts: &[AccountInfo]) -> ProgramResult {
    unimplemented!("set_fee_account_b not implemented")
}

/// Apply new admin
fn apply_new_admin(_program_id: &Pubkey, _accounts: &[AccountInfo]) -> ProgramResult {
    unimplemented!("apply_new_admin not implemented");
}

/// Commit new admin
fn commit_new_admin(_program_id: &Pubkey, _accounts: &[AccountInfo]) -> ProgramResult {
    unimplemented!("set_new_admin not implemented");
}

/// Revert new admin
fn revert_new_admin(_program_id: &Pubkey, _accounts: &[AccountInfo]) -> ProgramResult {
    unimplemented!("revert_new_admin not implemented");
}

/// Apply new fees
fn apply_new_fees(_program_id: &Pubkey, _accounts: &[AccountInfo]) -> ProgramResult {
    unimplemented!("apply_new_fees not implemented");
}

/// Commit new fees
fn commit_new_fees(
    _program_id: &Pubkey,
    _new_fees: Fees,
    _accounts: &[AccountInfo],
) -> ProgramResult {
    unimplemented!("set_new_fees not implemented");
}

/// Revert new fees
fn revert_new_fees(_program_id: &Pubkey, _accounts: &[AccountInfo]) -> ProgramResult {
    unimplemented!("set_new_fees not implemented");
}
