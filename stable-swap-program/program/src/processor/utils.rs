//! Utility methods

use crate::error::SwapError;
use solana_program::program_pack::Pack;
use solana_program::pubkey::Pubkey;
use spl_token::state::{Account, Mint};

/// Calculates the authority id by generating a program address.
pub fn authority_id(program_id: &Pubkey, my_info: &Pubkey, nonce: u8) -> Result<Pubkey, SwapError> {
    Pubkey::create_program_address(&[&my_info.to_bytes()[..32], &[nonce]], program_id)
        .or(Err(SwapError::InvalidProgramAddress))
}

/// Unpacks a spl_token `Account`.
pub fn unpack_token_account(data: &[u8]) -> Result<Account, SwapError> {
    Account::unpack(data).map_err(|_| SwapError::ExpectedAccount)
}

/// Unpacks a spl_token `Mint`.
pub fn unpack_mint(data: &[u8]) -> Result<Mint, SwapError> {
    Mint::unpack(data).map_err(|_| SwapError::ExpectedMint)
}
