//! Utility methods

use crate::error::SwapError;
use solana_sdk::pubkey::Pubkey;

/// Calculates the authority id by generating a program address.
pub fn authority_id(program_id: &Pubkey, my_info: &Pubkey, nonce: u8) -> Result<Pubkey, SwapError> {
    Pubkey::create_program_address(&[&my_info.to_bytes()[..32], &[nonce]], program_id)
        .or(Err(SwapError::InvalidProgramAddress))
}

#[cfg(test)]
pub mod test_utils {
    use solana_sdk::{account::Account, clock::Clock, pubkey::Pubkey, sysvar::id};

    pub fn default_clock_account() -> Account {
        Account::new_data(1, &Clock::default(), &id()).unwrap()
    }

    pub fn pubkey_rand() -> Pubkey {
        Pubkey::new(&rand::random::<[u8; 32]>())
    }
}
