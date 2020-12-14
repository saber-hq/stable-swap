//! Utility methods

#![cfg(feature = "program")]

use crate::error::SwapError;
use solana_sdk::pubkey::Pubkey;
#[cfg(not(target_arch = "bpf"))]
use solana_sdk::{
    account_info::AccountInfo, entrypoint::ProgramResult, instruction::Instruction,
    program_error::ProgramError,
};
#[cfg(not(target_arch = "bpf"))]
use spl_token::processor::Processor as SplProcessor;
use spl_token::{pack::Pack as TokenPack, state::Account};

/// Calculates the authority id by generating a program address.
pub fn authority_id(program_id: &Pubkey, my_info: &Pubkey, nonce: u8) -> Result<Pubkey, SwapError> {
    Pubkey::create_program_address(&[&my_info.to_bytes()[..32], &[nonce]], program_id)
        .or(Err(SwapError::InvalidProgramAddress))
}

/// Unpacks a spl_token `Account`.
pub fn unpack_token_account(data: &[u8]) -> Result<Account, SwapError> {
    TokenPack::unpack(data).map_err(|_| SwapError::ExpectedAccount)
}

/// Test program id for the swap program.
#[cfg(not(target_arch = "bpf"))]
pub const SWAP_PROGRAM_ID: Pubkey = Pubkey::new_from_array([2u8; 32]);
/// Test program id for the token program.
#[cfg(not(target_arch = "bpf"))]
pub const TOKEN_PROGRAM_ID: Pubkey = Pubkey::new_from_array([1u8; 32]);
/// Routes invokes to the token program, used for testing.
#[cfg(not(target_arch = "bpf"))]
pub fn invoke_signed<'a>(
    instruction: &Instruction,
    account_infos: &[AccountInfo<'a>],
    signers_seeds: &[&[&[u8]]],
) -> ProgramResult {
    let mut new_account_infos = vec![];

    // mimic check for token program in accounts
    if !account_infos.iter().any(|x| *x.key == TOKEN_PROGRAM_ID) {
        return Err(ProgramError::InvalidAccountData);
    }

    for meta in instruction.accounts.iter() {
        for account_info in account_infos.iter() {
            if meta.pubkey == *account_info.key {
                let mut new_account_info = account_info.clone();
                for seeds in signers_seeds.iter() {
                    let signer = Pubkey::create_program_address(&seeds, &SWAP_PROGRAM_ID).unwrap();
                    if *account_info.key == signer {
                        new_account_info.is_signer = true;
                    }
                }
                new_account_infos.push(new_account_info);
            }
        }
    }

    SplProcessor::process(
        &instruction.program_id,
        &new_account_infos,
        &instruction.data,
    )
}

#[cfg(test)]
pub mod test_utils {
    use super::*;
    use crate::{
        curve::ZERO_TS, fees::Fees, instruction::*, processor::Processor, state::SwapInfo,
    };
    use solana_sdk::{
        account::Account,
        account_info::create_is_signer_account_infos,
        clock::Clock,
        program_pack::Pack,
        pubkey::Pubkey,
        rent::Rent,
        sysvar::{id, rent},
    };
    use spl_token::{
        instruction::{approve, initialize_account, initialize_mint, mint_to},
        pack::Pack as TokenPack,
        state::{Account as SplAccount, Mint as SplMint},
    };

    /// Fees for testing
    pub const DEFAULT_TEST_FEES: Fees = Fees {
        admin_trade_fee_numerator: 1,
        admin_trade_fee_denominator: 2,
        admin_withdraw_fee_numerator: 1,
        admin_withdraw_fee_denominator: 2,
        trade_fee_numerator: 6,
        trade_fee_denominator: 100,
        withdraw_fee_numerator: 6,
        withdraw_fee_denominator: 100,
    };

    /// Default token decimals
    pub const DEFAULT_TOKEN_DECIMALS: u8 = 6;

    pub fn clock_account(ts: i64) -> Account {
        let mut clock = Clock::default();
        clock.unix_timestamp = ts;
        Account::new_data(1, &clock, &id()).unwrap()
    }

    pub fn pubkey_rand() -> Pubkey {
        Pubkey::new(&rand::random::<[u8; 32]>())
    }

    pub struct SwapAccountInfo {
        pub nonce: u8,
        pub authority_key: Pubkey,
        pub initial_amp_factor: u64,
        pub target_amp_factor: u64,
        pub swap_key: Pubkey,
        pub swap_account: Account,
        pub pool_mint_key: Pubkey,
        pub pool_mint_account: Account,
        pub pool_token_key: Pubkey,
        pub pool_token_account: Account,
        pub token_a_key: Pubkey,
        pub token_a_account: Account,
        pub token_a_mint_key: Pubkey,
        pub token_a_mint_account: Account,
        pub token_b_key: Pubkey,
        pub token_b_account: Account,
        pub token_b_mint_key: Pubkey,
        pub token_b_mint_account: Account,
        pub admin_key: Pubkey,
        pub admin_account: Account,
        pub admin_fee_a_key: Pubkey,
        pub admin_fee_a_account: Account,
        pub admin_fee_b_key: Pubkey,
        pub admin_fee_b_account: Account,
        pub fees: Fees,
    }

    impl SwapAccountInfo {
        pub fn new(
            user_key: &Pubkey,
            amp_factor: u64,
            token_a_amount: u64,
            token_b_amount: u64,
            fees: Fees,
        ) -> Self {
            let swap_key = pubkey_rand();
            let swap_account = Account::new(0, SwapInfo::get_packed_len(), &SWAP_PROGRAM_ID);
            let (authority_key, nonce) =
                Pubkey::find_program_address(&[&swap_key.to_bytes()[..]], &SWAP_PROGRAM_ID);

            let (pool_mint_key, mut pool_mint_account) =
                create_mint(&TOKEN_PROGRAM_ID, &authority_key, DEFAULT_TOKEN_DECIMALS);
            let (pool_token_key, pool_token_account) = mint_token(
                &TOKEN_PROGRAM_ID,
                &pool_mint_key,
                &mut pool_mint_account,
                &authority_key,
                &user_key,
                0,
            );
            let (token_a_mint_key, mut token_a_mint_account) =
                create_mint(&TOKEN_PROGRAM_ID, &user_key, DEFAULT_TOKEN_DECIMALS);
            let (token_a_key, token_a_account) = mint_token(
                &TOKEN_PROGRAM_ID,
                &token_a_mint_key,
                &mut token_a_mint_account,
                &user_key,
                &authority_key,
                token_a_amount,
            );
            let (admin_fee_a_key, admin_fee_a_account) = mint_token(
                &TOKEN_PROGRAM_ID,
                &token_a_mint_key,
                &mut token_a_mint_account,
                &user_key,
                &authority_key,
                0,
            );
            let (token_b_mint_key, mut token_b_mint_account) =
                create_mint(&TOKEN_PROGRAM_ID, &user_key, DEFAULT_TOKEN_DECIMALS);
            let (token_b_key, token_b_account) = mint_token(
                &TOKEN_PROGRAM_ID,
                &token_b_mint_key,
                &mut token_b_mint_account,
                &user_key,
                &authority_key,
                token_b_amount,
            );
            let (admin_fee_b_key, admin_fee_b_account) = mint_token(
                &TOKEN_PROGRAM_ID,
                &token_b_mint_key,
                &mut token_b_mint_account,
                &user_key,
                &authority_key,
                0,
            );

            let admin_account = Account::default();

            SwapAccountInfo {
                nonce,
                authority_key,
                initial_amp_factor: amp_factor,
                target_amp_factor: amp_factor,
                swap_key,
                swap_account,
                pool_mint_key,
                pool_mint_account,
                pool_token_key,
                pool_token_account,
                token_a_mint_key,
                token_a_mint_account,
                token_a_key,
                token_a_account,
                token_b_mint_key,
                token_b_mint_account,
                token_b_key,
                token_b_account,
                admin_key: admin_account.owner,
                admin_account,
                admin_fee_a_key,
                admin_fee_a_account,
                admin_fee_b_key,
                admin_fee_b_account,
                fees,
            }
        }

        pub fn initialize_swap(&mut self) -> ProgramResult {
            do_process_instruction(
                initialize(
                    &SWAP_PROGRAM_ID,
                    &TOKEN_PROGRAM_ID,
                    &self.swap_key,
                    &self.authority_key,
                    &self.admin_key,
                    &self.admin_fee_a_key,
                    &self.admin_fee_b_key,
                    &self.token_a_mint_key,
                    &self.token_a_key,
                    &self.token_b_mint_key,
                    &self.token_b_key,
                    &self.pool_mint_key,
                    &self.pool_token_key,
                    self.nonce,
                    self.initial_amp_factor,
                    self.fees,
                )
                .unwrap(),
                vec![
                    &mut self.swap_account,
                    &mut Account::default(),
                    &mut self.admin_account,
                    &mut self.admin_fee_a_account,
                    &mut self.admin_fee_b_account,
                    &mut self.token_a_mint_account,
                    &mut self.token_a_account,
                    &mut self.token_b_mint_account,
                    &mut self.token_b_account,
                    &mut self.pool_mint_account,
                    &mut self.pool_token_account,
                    &mut Account::default(),
                ],
            )
        }

        pub fn setup_token_accounts(
            &mut self,
            mint_owner: &Pubkey,
            account_owner: &Pubkey,
            a_amount: u64,
            b_amount: u64,
            pool_amount: u64,
        ) -> (Pubkey, Account, Pubkey, Account, Pubkey, Account) {
            let (token_a_key, token_a_account) = mint_token(
                &TOKEN_PROGRAM_ID,
                &self.token_a_mint_key,
                &mut self.token_a_mint_account,
                &mint_owner,
                &account_owner,
                a_amount,
            );
            let (token_b_key, token_b_account) = mint_token(
                &TOKEN_PROGRAM_ID,
                &self.token_b_mint_key,
                &mut self.token_b_mint_account,
                &mint_owner,
                &account_owner,
                b_amount,
            );
            let (pool_key, pool_account) = mint_token(
                &TOKEN_PROGRAM_ID,
                &self.pool_mint_key,
                &mut self.pool_mint_account,
                &self.authority_key,
                &account_owner,
                pool_amount,
            );
            (
                token_a_key,
                token_a_account,
                token_b_key,
                token_b_account,
                pool_key,
                pool_account,
            )
        }

        fn get_admin_fee_key(&self, account_key: &Pubkey) -> Pubkey {
            if *account_key == self.token_a_key {
                return self.admin_fee_a_key;
            } else if *account_key == self.token_b_key {
                return self.admin_fee_b_key;
            }
            panic!("Could not find matching admin fee account");
        }

        fn get_admin_fee_account(&self, account_key: &Pubkey) -> &Account {
            if *account_key == self.admin_fee_a_key {
                return &self.admin_fee_a_account;
            } else if *account_key == self.admin_fee_b_key {
                return &self.admin_fee_b_account;
            }
            panic!("Could not find matching admin fee account");
        }

        fn set_admin_fee_account_(&mut self, account_key: &Pubkey, account: Account) {
            if *account_key == self.admin_fee_a_key {
                self.admin_fee_a_account = account;
                return;
            } else if *account_key == self.admin_fee_b_key {
                self.admin_fee_b_account = account;
                return;
            }
            panic!("Could not find matching admin fee account");
        }

        fn get_token_account(&self, account_key: &Pubkey) -> &Account {
            if *account_key == self.token_a_key {
                return &self.token_a_account;
            } else if *account_key == self.token_b_key {
                return &self.token_b_account;
            }
            panic!("Could not find matching swap token account");
        }

        fn set_token_account(&mut self, account_key: &Pubkey, account: Account) {
            if *account_key == self.token_a_key {
                self.token_a_account = account;
                return;
            } else if *account_key == self.token_b_key {
                self.token_b_account = account;
                return;
            }
            panic!("Could not find matching swap token account");
        }

        pub fn swap(
            &mut self,
            user_key: &Pubkey,
            user_source_key: &Pubkey,
            mut user_source_account: &mut Account,
            swap_source_key: &Pubkey,
            swap_destination_key: &Pubkey,
            user_destination_key: &Pubkey,
            mut user_destination_account: &mut Account,
            amount_in: u64,
            minimum_amount_out: u64,
        ) -> ProgramResult {
            // approve moving from user source account
            do_process_instruction(
                approve(
                    &TOKEN_PROGRAM_ID,
                    &user_source_key,
                    &self.authority_key,
                    &user_key,
                    &[],
                    amount_in,
                )
                .unwrap(),
                vec![
                    &mut user_source_account,
                    &mut Account::default(),
                    &mut Account::default(),
                ],
            )
            .unwrap();

            let admin_destination_key = self.get_admin_fee_key(swap_destination_key);
            let mut admin_destination_account =
                self.get_admin_fee_account(&admin_destination_key).clone();
            let mut swap_source_account = self.get_token_account(swap_source_key).clone();
            let mut swap_destination_account = self.get_token_account(swap_destination_key).clone();

            // perform the swap
            do_process_instruction(
                swap(
                    &SWAP_PROGRAM_ID,
                    &TOKEN_PROGRAM_ID,
                    &self.swap_key,
                    &self.authority_key,
                    &user_source_key,
                    &swap_source_key,
                    &swap_destination_key,
                    &user_destination_key,
                    &admin_destination_key,
                    amount_in,
                    minimum_amount_out,
                )
                .unwrap(),
                vec![
                    &mut self.swap_account,
                    &mut Account::default(),
                    &mut user_source_account,
                    &mut swap_source_account,
                    &mut swap_destination_account,
                    &mut user_destination_account,
                    &mut admin_destination_account,
                    &mut Account::default(),
                    &mut clock_account(ZERO_TS),
                ],
            )?;

            self.set_admin_fee_account_(&admin_destination_key, admin_destination_account);
            self.set_token_account(swap_source_key, swap_source_account);
            self.set_token_account(swap_destination_key, swap_destination_account);

            Ok(())
        }

        pub fn deposit(
            &mut self,
            depositor_key: &Pubkey,
            depositor_token_a_key: &Pubkey,
            mut depositor_token_a_account: &mut Account,
            depositor_token_b_key: &Pubkey,
            mut depositor_token_b_account: &mut Account,
            depositor_pool_key: &Pubkey,
            mut depositor_pool_account: &mut Account,
            amount_a: u64,
            amount_b: u64,
            min_mint_amount: u64,
        ) -> ProgramResult {
            do_process_instruction(
                approve(
                    &TOKEN_PROGRAM_ID,
                    &depositor_token_a_key,
                    &self.authority_key,
                    &depositor_key,
                    &[],
                    amount_a,
                )
                .unwrap(),
                vec![
                    &mut depositor_token_a_account,
                    &mut Account::default(),
                    &mut Account::default(),
                ],
            )
            .unwrap();

            do_process_instruction(
                approve(
                    &TOKEN_PROGRAM_ID,
                    &depositor_token_b_key,
                    &self.authority_key,
                    &depositor_key,
                    &[],
                    amount_b,
                )
                .unwrap(),
                vec![
                    &mut depositor_token_b_account,
                    &mut Account::default(),
                    &mut Account::default(),
                ],
            )
            .unwrap();

            // perform deposit
            do_process_instruction(
                deposit(
                    &SWAP_PROGRAM_ID,
                    &TOKEN_PROGRAM_ID,
                    &self.swap_key,
                    &self.authority_key,
                    &depositor_token_a_key,
                    &depositor_token_b_key,
                    &self.token_a_key,
                    &self.token_b_key,
                    &self.pool_mint_key,
                    &depositor_pool_key,
                    amount_a,
                    amount_b,
                    min_mint_amount,
                )
                .unwrap(),
                vec![
                    &mut self.swap_account,
                    &mut Account::default(),
                    &mut depositor_token_a_account,
                    &mut depositor_token_b_account,
                    &mut self.token_a_account,
                    &mut self.token_b_account,
                    &mut self.pool_mint_account,
                    &mut depositor_pool_account,
                    &mut Account::default(),
                    &mut clock_account(ZERO_TS),
                ],
            )
        }

        pub fn withdraw(
            &mut self,
            user_key: &Pubkey,
            pool_key: &Pubkey,
            mut pool_account: &mut Account,
            token_a_key: &Pubkey,
            mut token_a_account: &mut Account,
            token_b_key: &Pubkey,
            mut token_b_account: &mut Account,
            pool_amount: u64,
            minimum_a_amount: u64,
            minimum_b_amount: u64,
        ) -> ProgramResult {
            // approve swap program to take out pool tokens
            do_process_instruction(
                approve(
                    &TOKEN_PROGRAM_ID,
                    &pool_key,
                    &self.authority_key,
                    &user_key,
                    &[],
                    pool_amount,
                )
                .unwrap(),
                vec![
                    &mut pool_account,
                    &mut Account::default(),
                    &mut Account::default(),
                ],
            )
            .unwrap();

            // perform withraw
            do_process_instruction(
                withdraw(
                    &SWAP_PROGRAM_ID,
                    &TOKEN_PROGRAM_ID,
                    &self.swap_key,
                    &self.authority_key,
                    &self.pool_mint_key,
                    &pool_key,
                    &self.token_a_key,
                    &self.token_b_key,
                    &token_a_key,
                    &token_b_key,
                    &self.admin_fee_a_key,
                    &self.admin_fee_b_key,
                    pool_amount,
                    minimum_a_amount,
                    minimum_b_amount,
                )
                .unwrap(),
                vec![
                    &mut self.swap_account,
                    &mut Account::default(),
                    &mut self.pool_mint_account,
                    &mut pool_account,
                    &mut self.token_a_account,
                    &mut self.token_b_account,
                    &mut token_a_account,
                    &mut token_b_account,
                    &mut self.admin_fee_a_account,
                    &mut self.admin_fee_b_account,
                    &mut Account::default(),
                ],
            )?;

            Ok(())
        }

        pub fn withdraw_one(
            &mut self,
            user_key: &Pubkey,
            pool_key: &Pubkey,
            mut pool_account: &mut Account,
            dest_token_key: &Pubkey,
            mut dest_token_account: &mut Account,
            pool_amount: u64,
            minimum_amount: u64,
        ) -> ProgramResult {
            // approve swap program to take out pool tokens
            do_process_instruction(
                approve(
                    &TOKEN_PROGRAM_ID,
                    &pool_key,
                    &self.authority_key,
                    &user_key,
                    &[],
                    pool_amount,
                )
                .unwrap(),
                vec![
                    &mut pool_account,
                    &mut Account::default(),
                    &mut Account::default(),
                ],
            )
            .unwrap();

            // perform withraw_one
            do_process_instruction(
                withdraw_one(
                    &SWAP_PROGRAM_ID,
                    &TOKEN_PROGRAM_ID,
                    &self.swap_key,
                    &self.authority_key,
                    &self.pool_mint_key,
                    &pool_key,
                    &self.token_a_key,
                    &self.token_b_key,
                    &dest_token_key,
                    &self.admin_fee_a_key,
                    pool_amount,
                    minimum_amount,
                )
                .unwrap(),
                vec![
                    &mut self.swap_account,
                    &mut Account::default(),
                    &mut self.pool_mint_account,
                    &mut pool_account,
                    &mut self.token_a_account,
                    &mut self.token_b_account,
                    &mut dest_token_account,
                    &mut self.admin_fee_a_account,
                    &mut Account::default(),
                    &mut clock_account(ZERO_TS),
                ],
            )
        }

        /** Admin functions **/

        pub fn ramp_a(
            &mut self,
            target_amp: u64,
            current_ts: i64,
            stop_ramp_ts: i64,
        ) -> ProgramResult {
            do_process_instruction(
                ramp_a(
                    &SWAP_PROGRAM_ID,
                    &self.swap_key,
                    &self.authority_key,
                    &self.admin_key,
                    target_amp,
                    stop_ramp_ts,
                )
                .unwrap(),
                vec![
                    &mut self.swap_account,
                    &mut Account::default(),
                    &mut self.admin_account,
                    &mut clock_account(current_ts),
                ],
            )
        }

        pub fn stop_ramp_a(&mut self, current_ts: i64) -> ProgramResult {
            do_process_instruction(
                stop_ramp_a(
                    &SWAP_PROGRAM_ID,
                    &self.swap_key,
                    &self.authority_key,
                    &self.admin_key,
                )
                .unwrap(),
                vec![
                    &mut self.swap_account,
                    &mut Account::default(),
                    &mut self.admin_account,
                    &mut clock_account(current_ts),
                ],
            )
        }

        pub fn pause(&mut self) -> ProgramResult {
            do_process_instruction(
                pause(
                    &SWAP_PROGRAM_ID,
                    &self.swap_key,
                    &self.authority_key,
                    &self.admin_key,
                )
                .unwrap(),
                vec![
                    &mut self.swap_account,
                    &mut Account::default(),
                    &mut self.admin_account,
                ],
            )
        }

        pub fn unpause(&mut self) -> ProgramResult {
            do_process_instruction(
                unpause(
                    &SWAP_PROGRAM_ID,
                    &self.swap_key,
                    &self.authority_key,
                    &self.admin_key,
                )
                .unwrap(),
                vec![
                    &mut self.swap_account,
                    &mut Account::default(),
                    &mut self.admin_account,
                ],
            )
        }

        pub fn set_admin_fee_account(
            &mut self,
            new_admin_fee_key: &Pubkey,
            new_admin_fee_account: &Account,
        ) -> ProgramResult {
            do_process_instruction(
                set_fee_account(
                    &SWAP_PROGRAM_ID,
                    &self.swap_key,
                    &self.authority_key,
                    &self.admin_key,
                    new_admin_fee_key,
                )
                .unwrap(),
                vec![
                    &mut self.swap_account,
                    &mut Account::default(),
                    &mut self.admin_account,
                    &mut new_admin_fee_account.clone(),
                ],
            )
        }

        pub fn apply_new_admin(&mut self, current_ts: i64) -> ProgramResult {
            do_process_instruction(
                apply_new_admin(
                    &SWAP_PROGRAM_ID,
                    &self.swap_key,
                    &self.authority_key,
                    &self.admin_key,
                )
                .unwrap(),
                vec![
                    &mut self.swap_account,
                    &mut Account::default(),
                    &mut self.admin_account,
                    &mut clock_account(current_ts),
                ],
            )
        }

        pub fn commit_new_admin(
            &mut self,
            new_admin_key: &Pubkey,
            current_ts: i64,
        ) -> ProgramResult {
            do_process_instruction(
                commit_new_admin(
                    &SWAP_PROGRAM_ID,
                    &self.swap_key,
                    &self.authority_key,
                    &self.admin_key,
                    new_admin_key,
                )
                .unwrap(),
                vec![
                    &mut self.swap_account,
                    &mut Account::default(),
                    &mut self.admin_account,
                    &mut Account::default(),
                    &mut clock_account(current_ts),
                ],
            )
        }

        pub fn set_new_fees(&mut self, new_fees: Fees) -> ProgramResult {
            do_process_instruction(
                set_new_fees(
                    &SWAP_PROGRAM_ID,
                    &self.swap_key,
                    &self.authority_key,
                    &self.admin_key,
                    new_fees,
                )
                .unwrap(),
                vec![
                    &mut self.swap_account,
                    &mut Account::default(),
                    &mut self.admin_account,
                ],
            )
        }
    }

    pub fn do_process_instruction(
        instruction: Instruction,
        accounts: Vec<&mut Account>,
    ) -> ProgramResult {
        // approximate the logic in the actual runtime which runs the instruction
        // and only updates accounts if the instruction is successful
        let mut account_clones = accounts.iter().map(|x| (*x).clone()).collect::<Vec<_>>();
        let mut meta = instruction
            .accounts
            .iter()
            .zip(account_clones.iter_mut())
            .map(|(account_meta, account)| (&account_meta.pubkey, account_meta.is_signer, account))
            .collect::<Vec<_>>();
        let mut account_infos = create_is_signer_account_infos(&mut meta);
        let res = if instruction.program_id == SWAP_PROGRAM_ID {
            Processor::process(&instruction.program_id, &account_infos, &instruction.data)
        } else {
            SplProcessor::process(&instruction.program_id, &account_infos, &instruction.data)
        };

        if res.is_ok() {
            let mut account_metas = instruction
                .accounts
                .iter()
                .zip(accounts)
                .map(|(account_meta, account)| (&account_meta.pubkey, account))
                .collect::<Vec<_>>();
            for account_info in account_infos.iter_mut() {
                for account_meta in account_metas.iter_mut() {
                    if account_info.key == account_meta.0 {
                        let account = &mut account_meta.1;
                        account.owner = *account_info.owner;
                        account.lamports = **account_info.lamports.borrow();
                        account.data = account_info.data.borrow().to_vec();
                    }
                }
            }
        }
        res
    }

    fn mint_minimum_balance() -> u64 {
        Rent::default().minimum_balance(SplMint::get_packed_len())
    }

    fn account_minimum_balance() -> u64 {
        Rent::default().minimum_balance(SplAccount::get_packed_len())
    }

    pub fn mint_token(
        program_id: &Pubkey,
        mint_key: &Pubkey,
        mut mint_account: &mut Account,
        mint_authority_key: &Pubkey,
        account_owner_key: &Pubkey,
        amount: u64,
    ) -> (Pubkey, Account) {
        let account_key = pubkey_rand();
        let mut account_account = Account::new(
            account_minimum_balance(),
            SplAccount::get_packed_len(),
            &program_id,
        );
        let mut mint_authority_account = Account::default();
        let mut rent_sysvar_account = rent::create_account(1, &Rent::free());

        do_process_instruction(
            initialize_account(&program_id, &account_key, &mint_key, account_owner_key).unwrap(),
            vec![
                &mut account_account,
                &mut mint_account,
                &mut mint_authority_account,
                &mut rent_sysvar_account,
            ],
        )
        .unwrap();

        if amount > 0 {
            do_process_instruction(
                mint_to(
                    &program_id,
                    &mint_key,
                    &account_key,
                    &mint_authority_key,
                    &[],
                    amount,
                )
                .unwrap(),
                vec![
                    &mut mint_account,
                    &mut account_account,
                    &mut mint_authority_account,
                ],
            )
            .unwrap();
        }

        (account_key, account_account)
    }

    pub fn create_mint(
        program_id: &Pubkey,
        authority_key: &Pubkey,
        decimals: u8,
    ) -> (Pubkey, Account) {
        let mint_key = pubkey_rand();
        let mut mint_account = Account::new(
            mint_minimum_balance(),
            SplMint::get_packed_len(),
            &program_id,
        );
        let mut rent_sysvar_account = rent::create_account(1, &Rent::free());

        do_process_instruction(
            initialize_mint(&program_id, &mint_key, authority_key, None, decimals).unwrap(),
            vec![&mut mint_account, &mut rent_sysvar_account],
        )
        .unwrap();

        (mint_key, mint_account)
    }
}
