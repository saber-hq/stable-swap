//! Utility methods

#[cfg(test)]
pub mod test_utils {
    use bincode::{serialize_into, serialized_size};
    use solana_sdk::{
        account::Account,
        clock::Clock,
        pubkey::Pubkey,
        sysvar::{id, Sysvar},
    };

    pub fn default_clock_account() -> Account {
        create_account(&Clock::default(), 1)
    }

    /// Create an `Account` from a `Sysvar`.
    /// TODO: Bump solana_sdk and remove this method.
    pub fn create_account<S: Sysvar>(sysvar: &S, lamports: u64) -> Account {
        let data_len = S::size_of().max(serialized_size(sysvar).unwrap() as usize);
        let mut account = Account::new(lamports, data_len, &id());
        to_account::<S>(sysvar, &mut account).unwrap();
        account
    }

    /// Serialize a `Sysvar` into an `Account`'s data.
    /// TODO: Bump solana_sdk and remove this method.
    pub fn to_account<S: Sysvar>(sysvar: &S, account: &mut Account) -> Option<()> {
        serialize_into(&mut account.data[..], sysvar).ok()
    }

    pub fn pubkey_rand() -> Pubkey {
        Pubkey::new(&rand::random::<[u8; 32]>())
    }
}
