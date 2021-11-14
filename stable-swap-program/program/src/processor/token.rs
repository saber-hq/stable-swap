//! Token helpers

use solana_program::{
    account_info::AccountInfo, program::invoke_signed, program_error::ProgramError, pubkey::Pubkey,
};

/// Issue a spl_token `Burn` instruction.
pub fn burn<'a>(
    token_program: AccountInfo<'a>,
    burn_account: AccountInfo<'a>,
    mint: AccountInfo<'a>,
    user_authority: AccountInfo<'a>,
    amount: u64,
) -> Result<(), ProgramError> {
    let ix = spl_token::instruction::burn(
        token_program.key,
        burn_account.key,
        mint.key,
        user_authority.key,
        &[],
        amount,
    )?;
    solana_program::program::invoke(&ix, &[token_program, burn_account, mint, user_authority])
}

/// Issue a spl_token `MintTo` instruction.
pub fn mint_to<'a>(
    swap: &Pubkey,
    token_program: AccountInfo<'a>,
    mint: AccountInfo<'a>,
    destination: AccountInfo<'a>,
    authority: AccountInfo<'a>,
    nonce: u8,
    amount: u64,
) -> Result<(), ProgramError> {
    let swap_bytes = swap.to_bytes();
    let authority_signature_seeds = [&swap_bytes[..32], &[nonce]];
    let signers = &[&authority_signature_seeds[..]];
    let ix = spl_token::instruction::mint_to(
        token_program.key,
        mint.key,
        destination.key,
        authority.key,
        &[],
        amount,
    )?;

    invoke_signed(&ix, &[mint, destination, authority, token_program], signers)
}

/// Issue a spl_token `Transfer` instruction signed by the authority.
pub fn transfer_as_swap<'a>(
    swap: &Pubkey,
    token_program: AccountInfo<'a>,
    source: AccountInfo<'a>,
    destination: AccountInfo<'a>,
    program_authority: AccountInfo<'a>,
    nonce: u8,
    amount: u64,
) -> Result<(), ProgramError> {
    let swap_bytes = swap.to_bytes();
    let authority_signature_seeds = [&swap_bytes[..32], &[nonce]];
    let signers = &[&authority_signature_seeds[..]];
    let ix = spl_token::instruction::transfer(
        token_program.key,
        source.key,
        destination.key,
        program_authority.key,
        &[],
        amount,
    )?;

    invoke_signed(
        &ix,
        &[token_program, source, destination, program_authority],
        signers,
    )
}

/// Issue a spl_token `Transfer` instruction as the user.
pub fn transfer_as_user<'a>(
    token_program: AccountInfo<'a>,
    source: AccountInfo<'a>,
    destination: AccountInfo<'a>,
    user_authority: AccountInfo<'a>,
    amount: u64,
) -> Result<(), ProgramError> {
    let ix = spl_token::instruction::transfer(
        token_program.key,
        source.key,
        destination.key,
        user_authority.key,
        &[],
        amount,
    )?;
    solana_program::program::invoke(&ix, &[token_program, source, destination, user_authority])
}
