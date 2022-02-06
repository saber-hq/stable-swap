//! Checks for processing instructions.

use anchor_lang::prelude::*;

use super::logging::log_slippage_error;
use crate::{
    error::SwapError,
    processor::utils,
    state::{SwapInfo, SwapTokenInfo},
};
use solana_program::{
    account_info::AccountInfo, entrypoint::ProgramResult, program_error::ProgramError,
    pubkey::Pubkey,
};
use vipers::{assert_keys_eq, assert_keys_neq, invariant};

/// Checks if the reserve of the swap is the given key.
fn check_reserves_match(token: &SwapTokenInfo, reserves_info_key: &Pubkey) -> ProgramResult {
    if token.index == 0 {
        assert_keys_eq!(
            reserves_info_key,
            token.reserves,
            SwapError::IncorrectSwapAccount,
            "Reserves A"
        );
    } else if token.index == 1 {
        assert_keys_eq!(
            reserves_info_key,
            token.reserves,
            SwapError::IncorrectSwapAccount,
            "Reserves B"
        );
    } else {
        assert_keys_eq!(
            reserves_info_key,
            token.reserves,
            SwapError::IncorrectSwapAccount,
            "Reserves",
        );
    }
    Ok(())
}

/// Access control for admin only instructions
pub fn check_has_admin_signer(
    expected_admin_key: &Pubkey,
    admin_account_info: &AccountInfo,
) -> ProgramResult {
    assert_keys_eq!(
        expected_admin_key,
        admin_account_info.key,
        SwapError::Unauthorized,
        "Admin signer",
    );
    invariant!(
        admin_account_info.is_signer,
        ProgramError::MissingRequiredSignature
    );
    Ok(())
}

pub fn check_deposit_token_accounts(
    token: &SwapTokenInfo,
    source_key: &Pubkey,
    reserves_info_key: &Pubkey,
) -> ProgramResult {
    match token.index {
        0 => {
            assert_keys_neq!(
                source_key,
                token.reserves,
                SwapError::InvalidInput,
                "Source account cannot be one of swap's token accounts for token A",
            );
        }
        1 => {
            assert_keys_neq!(
                source_key,
                token.reserves,
                SwapError::InvalidInput,
                "Source account cannot be one of swap's token accounts for token B",
            );
        }
        _ => {
            assert_keys_neq!(
                source_key,
                token.reserves,
                SwapError::InvalidInput,
                "Source account cannot be one of swap's token accounts",
            );
        }
    };
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
        SwapError::InvalidAdmin,
        "Admin fee dest",
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
        SwapError::InvalidProgramAddress,
        "Swap authority",
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
        SwapError::IncorrectSwapAccount,
        "Incorrect destination, expected",
    );
    assert_keys_eq!(
        admin_destination_info_key,
        token.admin_fees,
        SwapError::InvalidAdmin,
        "Admin fee",
    );
    Ok(())
}
