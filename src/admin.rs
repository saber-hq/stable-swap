//! Module for processing admin-only instructions.

#![cfg(feature = "program")]

use crate::{
    bn::U256,
    curve::{StableSwap, MAX_AMP, MIN_AMP, MIN_RAMP_DURATION},
    error::SwapError,
    fees::Fees,
    instruction::{AdminInstruction, RampAData},
    state::SwapInfo,
    utils,
};
use solana_sdk::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    info,
    program_error::ProgramError,
    program_pack::Pack,
    pubkey::Pubkey,
    sysvar::{clock::Clock, Sysvar},
};

/// Process admin instruction
pub fn process_admin_instruction(
    instruction: &AdminInstruction,
    program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    match *instruction {
        AdminInstruction::RampA(RampAData {
            target_amp,
            stop_ramp_ts,
        }) => {
            info!("Instruction : RampA");
            ramp_a(program_id, target_amp, stop_ramp_ts, accounts)
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
fn is_admin(expected_admin_key: &Pubkey, admin_account_info: &AccountInfo) -> ProgramResult {
    if expected_admin_key != admin_account_info.key {
        return Err(SwapError::Unauthorized.into());
    }
    if !admin_account_info.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    Ok(())
}

/// Ramp to future a
fn ramp_a(
    program_id: &Pubkey,
    target_amp: u64,
    stop_ramp_ts: i64,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let swap_info = next_account_info(account_info_iter)?;
    let authority_info = next_account_info(account_info_iter)?;
    let admin_info = next_account_info(account_info_iter)?;
    let clock_sysvar_info = next_account_info(account_info_iter)?;

    if target_amp < MIN_AMP || target_amp > MAX_AMP {
        return Err(SwapError::InvalidInput.into());
    }
    let mut token_swap = SwapInfo::unpack(&swap_info.data.borrow())?;
    is_admin(&token_swap.admin_key, admin_info)?;
    if *authority_info.key != utils::authority_id(program_id, swap_info.key, token_swap.nonce)? {
        return Err(SwapError::InvalidProgramAddress.into());
    }

    let clock = Clock::from_account_info(clock_sysvar_info)?;
    let ramp_lock_ts = token_swap
        .start_ramp_ts
        .checked_add(MIN_RAMP_DURATION)
        .ok_or(SwapError::CalculationFailure)?;
    if clock.unix_timestamp < ramp_lock_ts {
        return Err(SwapError::RampLocked.into());
    }
    let min_ramp_ts = clock
        .unix_timestamp
        .checked_add(MIN_RAMP_DURATION)
        .ok_or(SwapError::CalculationFailure)?;
    if stop_ramp_ts < min_ramp_ts {
        return Err(SwapError::InsufficientRampTime.into());
    }

    const MAX_A_CHANGE: u64 = 10;
    let invariant = StableSwap::new(
        token_swap.initial_amp_factor,
        token_swap.target_amp_factor,
        clock.unix_timestamp,
        token_swap.start_ramp_ts,
        token_swap.stop_ramp_ts,
    );
    let current_amp = U256::to_u64(
        invariant
            .compute_amp_factor()
            .ok_or(SwapError::CalculationFailure)?,
    )?;
    if target_amp < current_amp {
        if current_amp > target_amp * MAX_A_CHANGE {
            // target_amp too low
            return Err(SwapError::InvalidInput.into());
        }
    } else if target_amp > current_amp * MAX_A_CHANGE {
        // target_amp too high
        return Err(SwapError::InvalidInput.into());
    }

    token_swap.initial_amp_factor = current_amp;
    token_swap.target_amp_factor = target_amp;
    token_swap.start_ramp_ts = clock.unix_timestamp;
    token_swap.stop_ramp_ts = stop_ramp_ts;
    SwapInfo::pack(token_swap, &mut swap_info.data.borrow_mut())?;
    Ok(())
}

/// Stop ramp a
fn stop_ramp_a(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let swap_info = next_account_info(account_info_iter)?;
    let authority_info = next_account_info(account_info_iter)?;
    let admin_info = next_account_info(account_info_iter)?;
    let clock_sysvar_info = next_account_info(account_info_iter)?;

    let mut token_swap = SwapInfo::unpack(&swap_info.data.borrow())?;
    is_admin(&token_swap.admin_key, admin_info)?;
    if *authority_info.key != utils::authority_id(program_id, swap_info.key, token_swap.nonce)? {
        return Err(SwapError::InvalidProgramAddress.into());
    }

    let clock = Clock::from_account_info(clock_sysvar_info)?;
    let invariant = StableSwap::new(
        token_swap.initial_amp_factor,
        token_swap.target_amp_factor,
        clock.unix_timestamp,
        token_swap.start_ramp_ts,
        token_swap.stop_ramp_ts,
    );
    let current_amp = U256::to_u64(
        invariant
            .compute_amp_factor()
            .ok_or(SwapError::CalculationFailure)?,
    )?;

    token_swap.initial_amp_factor = current_amp;
    token_swap.target_amp_factor = current_amp;
    token_swap.start_ramp_ts = clock.unix_timestamp;
    token_swap.stop_ramp_ts = clock.unix_timestamp;
    // now (current_ts < stop_ramp_ts) is always False, compute_amp_factor should return target_amp
    SwapInfo::pack(token_swap, &mut swap_info.data.borrow_mut())?;
    Ok(())
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
fn set_fee_account_a(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let swap_info = next_account_info(account_info_iter)?;
    let authority_info = next_account_info(account_info_iter)?;
    let admin_info = next_account_info(account_info_iter)?;
    let new_fee_account_a_info = next_account_info(account_info_iter)?;

    let mut token_swap = SwapInfo::unpack(&swap_info.data.borrow())?;
    is_admin(&token_swap.admin_key, admin_info)?;
    if *authority_info.key != utils::authority_id(program_id, swap_info.key, token_swap.nonce)? {
        return Err(SwapError::InvalidProgramAddress.into());
    }
    let new_admin_fee_account_a =
        utils::unpack_token_account(&new_fee_account_a_info.data.borrow())?;
    if new_admin_fee_account_a.mint != token_swap.token_a_mint {
        return Err(SwapError::InvalidAdmin.into());
    }

    token_swap.admin_fee_account_a = *new_fee_account_a_info.key;
    SwapInfo::pack(token_swap, &mut swap_info.data.borrow_mut())?;
    Ok(())
}

/// Set fee account a
fn set_fee_account_b(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let swap_info = next_account_info(account_info_iter)?;
    let authority_info = next_account_info(account_info_iter)?;
    let admin_info = next_account_info(account_info_iter)?;
    let new_fee_account_b_info = next_account_info(account_info_iter)?;

    let mut token_swap = SwapInfo::unpack(&swap_info.data.borrow())?;
    is_admin(&token_swap.admin_key, admin_info)?;
    if *authority_info.key != utils::authority_id(program_id, swap_info.key, token_swap.nonce)? {
        return Err(SwapError::InvalidProgramAddress.into());
    }
    let new_admin_fee_account_b =
        utils::unpack_token_account(&new_fee_account_b_info.data.borrow())?;
    if new_admin_fee_account_b.mint != token_swap.token_b_mint {
        return Err(SwapError::InvalidAdmin.into());
    }

    token_swap.admin_fee_account_b = *new_fee_account_b_info.key;
    SwapInfo::pack(token_swap, &mut swap_info.data.borrow_mut())?;
    Ok(())
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        curve::ZERO_TS,
        utils::{test_utils::*, TOKEN_PROGRAM_ID},
    };
    use solana_sdk::clock::Epoch;

    const DEFAULT_TOKEN_A_AMOUNT: u64 = 1_000_000_000;
    const DEFAULT_TOKEN_B_AMOUNT: u64 = 1_000_000_000;
    const DEFAULT_POOL_TOKEN_AMOUNT: u64 = 0;

    #[test]
    fn test_is_admin() {
        let admin_key = pubkey_rand();
        let admin_owner = pubkey_rand();
        let mut lamports = 0;
        let mut admin_account_data = vec![];
        let mut admin_account_info = AccountInfo::new(
            &admin_key,
            true,
            false,
            &mut lamports,
            &mut admin_account_data,
            &admin_owner,
            false,
            Epoch::default(),
        );

        // Correct admin
        assert_eq!(Ok(()), is_admin(&admin_key, &admin_account_info));

        // Unauthorized account
        let fake_admin_key = pubkey_rand();
        let mut fake_admin_account = admin_account_info.clone();
        fake_admin_account.key = &fake_admin_key;
        assert_eq!(
            Err(SwapError::Unauthorized.into()),
            is_admin(&admin_key, &fake_admin_account)
        );

        // Admin did not sign
        admin_account_info.is_signer = false;
        assert_eq!(
            Err(ProgramError::MissingRequiredSignature),
            is_admin(&admin_key, &admin_account_info)
        );
    }

    #[test]
    fn test_ramp_a() {
        let user_key = pubkey_rand();
        let amp_factor = MIN_AMP * 100;
        let mut accounts = SwapAccountInfo::new(
            &user_key,
            amp_factor,
            DEFAULT_TOKEN_A_AMOUNT,
            DEFAULT_TOKEN_B_AMOUNT,
            DEFAULT_TEST_FEES,
        );

        // swap not initialized
        {
            assert_eq!(
                Err(ProgramError::UninitializedAccount),
                accounts.ramp_a(MIN_AMP, ZERO_TS, MIN_RAMP_DURATION)
            );
        }

        accounts.initialize_swap().unwrap();

        // Invalid target amp
        {
            let stop_ramp_ts = MIN_RAMP_DURATION;
            let target_amp = 0;
            assert_eq!(
                Err(SwapError::InvalidInput.into()),
                accounts.ramp_a(target_amp, ZERO_TS, stop_ramp_ts)
            );
            let target_amp = MAX_AMP + 1;
            assert_eq!(
                Err(SwapError::InvalidInput.into()),
                accounts.ramp_a(target_amp, ZERO_TS, stop_ramp_ts)
            );
        }

        // wrong nonce for authority_key
        {
            let old_authority = accounts.authority_key;
            let (bad_authority_key, _nonce) = Pubkey::find_program_address(
                &[&accounts.swap_key.to_bytes()[..]],
                &TOKEN_PROGRAM_ID,
            );
            accounts.authority_key = bad_authority_key;
            assert_eq!(
                Err(SwapError::InvalidProgramAddress.into()),
                accounts.ramp_a(MIN_AMP, ZERO_TS, MIN_RAMP_DURATION)
            );
            accounts.authority_key = old_authority;
        }

        // Unauthorized account
        {
            let old_admin_key = accounts.admin_key;
            let fake_admin_key = pubkey_rand();
            accounts.admin_key = fake_admin_key;
            assert_eq!(
                Err(SwapError::Unauthorized.into()),
                accounts.ramp_a(MIN_AMP, ZERO_TS, MIN_RAMP_DURATION)
            );
            accounts.admin_key = old_admin_key;
        }

        // ramp locked
        {
            assert_eq!(
                Err(SwapError::RampLocked.into()),
                accounts.ramp_a(MIN_AMP, ZERO_TS, MIN_RAMP_DURATION / 2)
            );
        }

        // insufficient ramp time
        {
            assert_eq!(
                Err(SwapError::InsufficientRampTime.into()),
                accounts.ramp_a(amp_factor, MIN_RAMP_DURATION, ZERO_TS)
            );
        }

        // invalid amp targets
        {
            // amp target too low
            assert_eq!(
                Err(SwapError::InvalidInput.into()),
                accounts.ramp_a(MIN_AMP, MIN_RAMP_DURATION, MIN_RAMP_DURATION * 2)
            );
            // amp target too high
            assert_eq!(
                Err(SwapError::InvalidInput.into()),
                accounts.ramp_a(MAX_AMP, MIN_RAMP_DURATION, MIN_RAMP_DURATION * 2)
            );
        }

        // valid ramp
        {
            let target_amp = MIN_AMP * 200;
            let current_ts = MIN_RAMP_DURATION;
            let stop_ramp_ts = MIN_RAMP_DURATION * 2;
            accounts
                .ramp_a(target_amp, current_ts, stop_ramp_ts)
                .unwrap();

            let swap_info = SwapInfo::unpack(&accounts.swap_account.data).unwrap();
            assert_eq!(swap_info.initial_amp_factor, amp_factor);
            assert_eq!(swap_info.target_amp_factor, target_amp);
            assert_eq!(swap_info.start_ramp_ts, current_ts);
            assert_eq!(swap_info.stop_ramp_ts, stop_ramp_ts);
        }
    }

    #[test]
    fn test_stop_ramp_a() {
        let user_key = pubkey_rand();
        let amp_factor = MIN_AMP * 100;
        let mut accounts = SwapAccountInfo::new(
            &user_key,
            amp_factor,
            DEFAULT_TOKEN_A_AMOUNT,
            DEFAULT_TOKEN_B_AMOUNT,
            DEFAULT_TEST_FEES,
        );

        // swap not initialized
        {
            assert_eq!(
                Err(ProgramError::UninitializedAccount),
                accounts.ramp_a(MIN_AMP, ZERO_TS, MIN_RAMP_DURATION)
            );
        }

        accounts.initialize_swap().unwrap();

        // wrong nonce for authority_key
        {
            let old_authority = accounts.authority_key;
            let (bad_authority_key, _nonce) = Pubkey::find_program_address(
                &[&accounts.swap_key.to_bytes()[..]],
                &TOKEN_PROGRAM_ID,
            );
            accounts.authority_key = bad_authority_key;
            assert_eq!(
                Err(SwapError::InvalidProgramAddress.into()),
                accounts.stop_ramp_a(ZERO_TS)
            );
            accounts.authority_key = old_authority;
        }

        // unauthorized account
        {
            let old_admin_key = accounts.admin_key;
            let fake_admin_key = pubkey_rand();
            accounts.admin_key = fake_admin_key;
            assert_eq!(
                Err(SwapError::Unauthorized.into()),
                accounts.stop_ramp_a(ZERO_TS)
            );
            accounts.admin_key = old_admin_key;
        }

        // valid call
        {
            let expected_ts = MIN_RAMP_DURATION;
            accounts.stop_ramp_a(expected_ts).unwrap();

            let swap_info = SwapInfo::unpack(&accounts.swap_account.data).unwrap();
            assert_eq!(swap_info.initial_amp_factor, amp_factor);
            assert_eq!(swap_info.target_amp_factor, amp_factor);
            assert_eq!(swap_info.start_ramp_ts, expected_ts);
            assert_eq!(swap_info.stop_ramp_ts, expected_ts);
        }
    }

    #[test]
    fn test_set_fee_account_a() {
        let user_key = pubkey_rand();
        let owner_key = pubkey_rand();
        let amp_factor = MIN_AMP * 100;
        let mut accounts = SwapAccountInfo::new(
            &user_key,
            amp_factor,
            DEFAULT_TOKEN_A_AMOUNT,
            DEFAULT_TOKEN_B_AMOUNT,
            DEFAULT_TEST_FEES,
        );
        let (
            admin_fee_key_a,
            admin_fee_account_a,
            wrong_admin_fee_key,
            wrong_admin_fee_account,
            _pool_key,
            _pool_account,
        ) = accounts.setup_token_accounts(
            &user_key,
            &owner_key,
            DEFAULT_TOKEN_A_AMOUNT,
            DEFAULT_TOKEN_B_AMOUNT,
            DEFAULT_POOL_TOKEN_AMOUNT,
        );

        // swap not initialized
        {
            assert_eq!(
                Err(ProgramError::UninitializedAccount),
                accounts.set_admin_fee_account_a(&admin_fee_key_a, &admin_fee_account_a)
            );
        }

        accounts.initialize_swap().unwrap();

        // wrong nonce for authority_key
        {
            let old_authority = accounts.authority_key;
            let (bad_authority_key, _nonce) = Pubkey::find_program_address(
                &[&accounts.swap_key.to_bytes()[..]],
                &TOKEN_PROGRAM_ID,
            );
            accounts.authority_key = bad_authority_key;
            assert_eq!(
                Err(SwapError::InvalidProgramAddress.into()),
                accounts.set_admin_fee_account_a(&admin_fee_key_a, &admin_fee_account_a)
            );
            accounts.authority_key = old_authority;
        }

        // unauthorized account
        {
            let old_admin_key = accounts.admin_key;
            let fake_admin_key = pubkey_rand();
            accounts.admin_key = fake_admin_key;
            assert_eq!(
                Err(SwapError::Unauthorized.into()),
                accounts.set_admin_fee_account_a(&admin_fee_key_a, &admin_fee_account_a)
            );
            accounts.admin_key = old_admin_key;
        }

        // wrong admin account
        {
            assert_eq!(
                Err(SwapError::InvalidAdmin.into()),
                accounts.set_admin_fee_account_a(&wrong_admin_fee_key, &wrong_admin_fee_account)
            );
        }

        // valid call
        {
            accounts
                .set_admin_fee_account_a(&admin_fee_key_a, &admin_fee_account_a)
                .unwrap();

            let swap_info = SwapInfo::unpack(&accounts.swap_account.data).unwrap();
            assert_eq!(swap_info.admin_fee_account_a, admin_fee_key_a);
        }
    }

    #[test]
    fn test_set_fee_account_b() {
        let user_key = pubkey_rand();
        let owner_key = pubkey_rand();
        let amp_factor = MIN_AMP * 100;
        let mut accounts = SwapAccountInfo::new(
            &user_key,
            amp_factor,
            DEFAULT_TOKEN_A_AMOUNT,
            DEFAULT_TOKEN_B_AMOUNT,
            DEFAULT_TEST_FEES,
        );
        let (
            wrong_admin_fee_key,
            wrong_admin_fee_account,
            admin_fee_key_b,
            admin_fee_account_b,
            _pool_key,
            _pool_account,
        ) = accounts.setup_token_accounts(
            &user_key,
            &owner_key,
            DEFAULT_TOKEN_A_AMOUNT,
            DEFAULT_TOKEN_B_AMOUNT,
            DEFAULT_POOL_TOKEN_AMOUNT,
        );

        // swap not initialized
        {
            assert_eq!(
                Err(ProgramError::UninitializedAccount),
                accounts.set_admin_fee_account_b(&admin_fee_key_b, &admin_fee_account_b)
            );
        }

        accounts.initialize_swap().unwrap();

        // wrong nonce for authority_key
        {
            let old_authority = accounts.authority_key;
            let (bad_authority_key, _nonce) = Pubkey::find_program_address(
                &[&accounts.swap_key.to_bytes()[..]],
                &TOKEN_PROGRAM_ID,
            );
            accounts.authority_key = bad_authority_key;
            assert_eq!(
                Err(SwapError::InvalidProgramAddress.into()),
                accounts.set_admin_fee_account_b(&admin_fee_key_b, &admin_fee_account_b)
            );
            accounts.authority_key = old_authority;
        }

        // unauthorized account
        {
            let old_admin_key = accounts.admin_key;
            let fake_admin_key = pubkey_rand();
            accounts.admin_key = fake_admin_key;
            assert_eq!(
                Err(SwapError::Unauthorized.into()),
                accounts.set_admin_fee_account_b(&admin_fee_key_b, &admin_fee_account_b)
            );
            accounts.admin_key = old_admin_key;
        }

        // wrong admin account
        {
            assert_eq!(
                Err(SwapError::InvalidAdmin.into()),
                accounts.set_admin_fee_account_b(&wrong_admin_fee_key, &wrong_admin_fee_account)
            );
        }

        // valid call
        {
            accounts
                .set_admin_fee_account_b(&admin_fee_key_b, &admin_fee_account_b)
                .unwrap();

            let swap_info = SwapInfo::unpack(&accounts.swap_account.data).unwrap();
            assert_eq!(swap_info.admin_fee_account_b, admin_fee_key_b);
        }
    }
}
