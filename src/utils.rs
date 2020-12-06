//! Utility methods

#[cfg(test)]
pub mod test_utils {
    use solana_sdk::pubkey::Pubkey;

    pub fn pubkey_rand() -> Pubkey {
        Pubkey::new(&rand::random::<[u8; 32]>())
    }
}
