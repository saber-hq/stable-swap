use solana_sdk::{
    account::Account,
    account_info::AccountInfo,
    clock::{Clock, Epoch},
    pubkey::Pubkey,
    sysvar,
};

#[derive(Clone)]
pub struct NativeAccountData {
    pub key: Pubkey,
    pub lamports: u64,
    pub data: Vec<u8>,
    pub program_id: Pubkey,
    pub is_signer: bool,
}

impl NativeAccountData {
    pub fn new(size: usize, program_id: Pubkey) -> Self {
        Self {
            key: Pubkey::new_unique(),
            lamports: 0,
            data: vec![0; size],
            program_id,
            is_signer: false,
        }
    }

    pub fn new_clock(current_ts: i64) -> Self {
        let mut clock = Clock::default();
        clock.unix_timestamp = current_ts;
        let clock_account = Account::new_data(1, &clock, &sysvar::id()).unwrap();
        Self {
            key: Pubkey::new_unique(),
            lamports: clock_account.lamports,
            data: clock_account.data,
            program_id: clock_account.owner,
            is_signer: false,
        }
    }

    pub fn new_from_account_info(account_info: &AccountInfo) -> Self {
        Self {
            key: *account_info.key,
            lamports: **account_info.lamports.borrow(),
            data: account_info.data.borrow().to_vec(),
            program_id: *account_info.owner,
            is_signer: account_info.is_signer,
        }
    }

    pub fn as_account_info(&mut self) -> AccountInfo {
        AccountInfo::new(
            &self.key,
            self.is_signer,
            false,
            &mut self.lamports,
            &mut self.data[..],
            &self.program_id,
            false,
            Epoch::default(),
        )
    }
}
