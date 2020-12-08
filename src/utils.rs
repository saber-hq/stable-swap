//! Utility methods

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
