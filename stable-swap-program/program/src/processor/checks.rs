//! Checks for processing instructions.

use crate::{
    error::SwapError,
    processor::utils,
    state::{SwapInfo, SwapTokenInfo},
};
use anchor_lang::prelude::*;

use solana_program::{
    account_info::AccountInfo, entrypoint::ProgramResult, program_error::ProgramError,
    pubkey::Pubkey,
};
use vipers::assert_keys_eq;

use super::logging::log_slippage_error;

/// Checks if the reserve of the swap is the given key.
fn check_reserves_match(token: &SwapTokenInfo, reserves_info_key: &Pubkey) -> ProgramResult {
    check_token_keys_equal!(
        token,
        *reserves_info_key,
        token.reserves,
        "Reserves",
        SwapError::IncorrectSwapAccount
    );
    Ok(())
}

/// Access control for admin only instructions
pub fn check_has_admin_signer(
    expected_admin_key: &Pubkey,
    admin_account_info: &AccountInfo,
) -> ProgramResult {
    check_keys_equal!(
        *expected_admin_key,
        *admin_account_info.key,
        "Admin signer",
        SwapError::Unauthorized
    );
    if !admin_account_info.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    Ok(())
}

pub fn check_deposit_token_accounts(
    token: &SwapTokenInfo,
    source_key: &Pubkey,
    reserves_info_key: &Pubkey,
) -> ProgramResult {
    check_token_keys_not_equal!(
        token,
        *source_key,
        token.reserves,
        "Source account cannot be swap token account of token",
        SwapError::InvalidInput
    );
    check_reserves_match(token, reserves_info_key)?;
    Ok(())
}

pub fn check_can_withdraw_token(
    rate: Option<(u64, u64, u64)>,
    minimum_token_amount: u64,
) -> Result<(u64, u64, u64), ProgramError> {
    let (amount, fee, admin_fee) = rate.ok_or(SwapError::CalculationFailure)?;
    if amount < minimum_token_amount {
        log_slippage_error(minimum_token_amount, amount);
        return Err(SwapError::ExceededSlippage.into());
    }

    Ok((amount, fee, admin_fee))
}

/// Checks that the withdraw token accounts are correct.
pub fn check_withdraw_token_accounts(
    token: &SwapTokenInfo,
    reserves_info_key: &Pubkey,
    admin_fee_dest_key: &Pubkey,
) -> ProgramResult {
    check_reserves_match(token, reserves_info_key)?;
    assert_keys_eq!(
        admin_fee_dest_key,
        token.admin_fees,
        SwapError::InvalidAdmin
    );
    Ok(())
}

pub fn check_swap_authority(
    token_swap: &SwapInfo,
    swap_info_key: &Pubkey,
    program_id: &Pubkey,
    swap_authority_key: &Pubkey,
) -> ProgramResult {
    let swap_authority = utils::authority_id(program_id, swap_info_key, token_swap.nonce)?;
    assert_keys_eq!(
        swap_authority_key,
        swap_authority,
        SwapError::InvalidProgramAddress
    );
    Ok(())
}

/// Checks that the destination of the swap has the correct accounts.
pub fn check_swap_token_destination_accounts(
    token: &SwapTokenInfo,
    swap_destination_info_key: &Pubkey,
    admin_destination_info_key: &Pubkey,
) -> ProgramResult {
    assert_keys_eq!(
        swap_destination_info_key,
        token.reserves,
        SwapError::IncorrectSwapAccount
    );
    assert_keys_eq!(
        admin_destination_info_key,
        token.admin_fees,
        SwapError::InvalidAdmin
    );
    Ok(())
}
