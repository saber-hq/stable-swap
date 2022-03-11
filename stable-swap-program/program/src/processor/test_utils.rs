//! Test utility methods
#![allow(clippy::too_many_arguments)]

use crate::{curve::ZERO_TS, fees::Fees, instruction::*, processor::Processor, state::SwapInfo};
use solana_program::{
    account_info::AccountInfo, entrypoint::ProgramResult, instruction::Instruction,
    program_error::ProgramError,
};
use solana_program::{
    clock::Clock, msg, program_pack::Pack, program_stubs, pubkey::Pubkey, rent::Rent,
};
use solana_sdk::account::{create_account_for_test, create_is_signer_account_infos, Account};
use spl_token::{
    instruction::{initialize_account, initialize_mint, mint_to},
    state::{Account as SplAccount, Mint as SplMint},
};
use stable_swap_client::fraction::Fraction;

/// Test program id for the swap program.
pub static SWAP_PROGRAM_ID: Pubkey = crate::ID;

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

pub fn pubkey_rand() -> Pubkey {
    Pubkey::new_unique()
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
    pub token_a_exchange_rate_override: Fraction,
    pub token_b_exchange_rate_override: Fraction,
}

impl SwapAccountInfo {
    pub fn new(
        user_key: &Pubkey,
        amp_factor: u64,
        token_a_amount: u64,
        token_b_amount: u64,
        fees: Fees,
        token_a_exchange_rate_override: Fraction,
        token_b_exchange_rate_override: Fraction,
    ) -> Self {
        let swap_key = pubkey_rand();
        let swap_account = Account::new(0, SwapInfo::get_packed_len(), &SWAP_PROGRAM_ID);
        let (authority_key, nonce) =
            Pubkey::find_program_address(&[&swap_key.to_bytes()[..]], &SWAP_PROGRAM_ID);

        let (pool_mint_key, mut pool_mint_account) = create_mint(
            &spl_token::id(),
            &authority_key,
            DEFAULT_TOKEN_DECIMALS,
            None,
        );
        let (pool_token_key, pool_token_account) = mint_token(
            &spl_token::id(),
            &pool_mint_key,
            &mut pool_mint_account,
            &authority_key,
            user_key,
            0,
        );
        let (token_a_mint_key, mut token_a_mint_account) =
            create_mint(&spl_token::id(), user_key, DEFAULT_TOKEN_DECIMALS, None);
        let (token_a_key, token_a_account) = mint_token(
            &spl_token::id(),
            &token_a_mint_key,
            &mut token_a_mint_account,
            user_key,
            &authority_key,
            token_a_amount,
        );
        let (admin_fee_a_key, admin_fee_a_account) = mint_token(
            &spl_token::id(),
            &token_a_mint_key,
            &mut token_a_mint_account,
            user_key,
            &authority_key,
            0,
        );
        let (token_b_mint_key, mut token_b_mint_account) =
            create_mint(&spl_token::id(), user_key, DEFAULT_TOKEN_DECIMALS, None);
        let (token_b_key, token_b_account) = mint_token(
            &spl_token::id(),
            &token_b_mint_key,
            &mut token_b_mint_account,
            user_key,
            &authority_key,
            token_b_amount,
        );
        let (admin_fee_b_key, admin_fee_b_account) = mint_token(
            &spl_token::id(),
            &token_b_mint_key,
            &mut token_b_mint_account,
            user_key,
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
            token_a_exchange_rate_override,
            token_b_exchange_rate_override,
        }
    }

    pub fn initialize_swap(&mut self) -> ProgramResult {
        let intialize_result = initialize(
            &spl_token::id(),
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
            self.token_a_exchange_rate_override,
            self.token_b_exchange_rate_override,
        );
        let result = do_process_instruction(
            intialize_result?,
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
        );
        result
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
            &spl_token::id(),
            &self.token_a_mint_key,
            &mut self.token_a_mint_account,
            mint_owner,
            account_owner,
            a_amount,
        );
        let (token_b_key, token_b_account) = mint_token(
            &spl_token::id(),
            &self.token_b_mint_key,
            &mut self.token_b_mint_account,
            mint_owner,
            account_owner,
            b_amount,
        );
        let (pool_key, pool_account) = mint_token(
            &spl_token::id(),
            &self.pool_mint_key,
            &mut self.pool_mint_account,
            &self.authority_key,
            account_owner,
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
        user_source_account: &mut Account,
        swap_source_key: &Pubkey,
        swap_destination_key: &Pubkey,
        user_destination_key: &Pubkey,
        user_destination_account: &mut Account,
        amount_in: u64,
        minimum_amount_out: u64,
    ) -> ProgramResult {
        let admin_destination_key = self.get_admin_fee_key(swap_destination_key);
        let mut admin_destination_account =
            self.get_admin_fee_account(&admin_destination_key).clone();
        let mut swap_source_account = self.get_token_account(swap_source_key).clone();
        let mut swap_destination_account = self.get_token_account(swap_destination_key).clone();

        // perform the swap
        do_process_instruction_at_time(
            swap(
                &spl_token::id(),
                &self.swap_key,
                &self.authority_key,
                user_key,
                user_source_key,
                swap_source_key,
                swap_destination_key,
                user_destination_key,
                &admin_destination_key,
                amount_in,
                minimum_amount_out,
            )
            .unwrap(),
            vec![
                &mut self.swap_account,
                &mut Account::default(),
                &mut Account::default(),
                user_source_account,
                &mut swap_source_account,
                &mut swap_destination_account,
                user_destination_account,
                &mut admin_destination_account,
                &mut Account::default(),
            ],
            ZERO_TS,
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
        depositor_token_a_account: &mut Account,
        depositor_token_b_key: &Pubkey,
        depositor_token_b_account: &mut Account,
        depositor_pool_key: &Pubkey,
        depositor_pool_account: &mut Account,
        amount_a: u64,
        amount_b: u64,
        min_mint_amount: u64,
    ) -> ProgramResult {
        // perform deposit
        do_process_instruction_at_time(
            deposit(
                &spl_token::id(),
                &self.swap_key,
                &self.authority_key,
                depositor_key,
                depositor_token_a_key,
                depositor_token_b_key,
                &self.token_a_key,
                &self.token_b_key,
                &self.pool_mint_key,
                depositor_pool_key,
                amount_a,
                amount_b,
                min_mint_amount,
            )
            .unwrap(),
            vec![
                &mut self.swap_account,
                &mut Account::default(),
                &mut Account::default(),
                depositor_token_a_account,
                depositor_token_b_account,
                &mut self.token_a_account,
                &mut self.token_b_account,
                &mut self.pool_mint_account,
                depositor_pool_account,
                &mut Account::default(),
            ],
            ZERO_TS,
        )
    }

    pub fn withdraw(
        &mut self,
        user_key: &Pubkey,
        pool_key: &Pubkey,
        pool_account: &mut Account,
        token_a_key: &Pubkey,
        token_a_account: &mut Account,
        token_b_key: &Pubkey,
        token_b_account: &mut Account,
        pool_amount: u64,
        minimum_a_amount: u64,
        minimum_b_amount: u64,
    ) -> ProgramResult {
        // perform withdraw
        do_process_instruction(
            withdraw(
                &spl_token::id(),
                &self.swap_key,
                &self.authority_key,
                user_key,
                &self.pool_mint_key,
                pool_key,
                &self.token_a_key,
                &self.token_b_key,
                token_a_key,
                token_b_key,
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
                &mut Account::default(),
                &mut self.pool_mint_account,
                pool_account,
                &mut self.token_a_account,
                &mut self.token_b_account,
                token_a_account,
                token_b_account,
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
        pool_account: &mut Account,
        dest_token_key: &Pubkey,
        dest_token_account: &mut Account,
        pool_amount: u64,
        minimum_amount: u64,
    ) -> ProgramResult {
        // perform withdraw_one
        do_process_instruction_at_time(
            withdraw_one(
                &spl_token::id(),
                &self.swap_key,
                &self.authority_key,
                user_key,
                &self.pool_mint_key,
                pool_key,
                &self.token_a_key,
                &self.token_b_key,
                dest_token_key,
                &self.admin_fee_a_key,
                pool_amount,
                minimum_amount,
            )
            .unwrap(),
            vec![
                &mut self.swap_account,
                &mut Account::default(),
                &mut Account::default(),
                &mut self.pool_mint_account,
                pool_account,
                &mut self.token_a_account,
                &mut self.token_b_account,
                dest_token_account,
                &mut self.admin_fee_a_account,
                &mut Account::default(),
            ],
            ZERO_TS,
        )
    }

    /** Admin functions **/

    pub fn ramp_a(&mut self, target_amp: u64, current_ts: i64, stop_ramp_ts: i64) -> ProgramResult {
        do_process_instruction_at_time(
            ramp_a(&self.swap_key, &self.admin_key, target_amp, stop_ramp_ts).unwrap(),
            vec![&mut self.swap_account, &mut self.admin_account],
            current_ts,
        )
    }

    pub fn stop_ramp_a(&mut self, current_ts: i64) -> ProgramResult {
        do_process_instruction_at_time(
            stop_ramp_a(&self.swap_key, &self.admin_key).unwrap(),
            vec![&mut self.swap_account, &mut self.admin_account],
            current_ts,
        )
    }

    pub fn pause(&mut self) -> ProgramResult {
        do_process_instruction(
            pause(&self.swap_key, &self.admin_key).unwrap(),
            vec![&mut self.swap_account, &mut self.admin_account],
        )
    }

    pub fn unpause(&mut self) -> ProgramResult {
        do_process_instruction(
            unpause(&self.swap_key, &self.admin_key).unwrap(),
            vec![&mut self.swap_account, &mut self.admin_account],
        )
    }

    pub fn set_admin_fee_account(
        &mut self,
        new_admin_fee_key: &Pubkey,
        new_admin_fee_account: &Account,
    ) -> ProgramResult {
        do_process_instruction(
            set_fee_account(&self.swap_key, &self.admin_key, new_admin_fee_key).unwrap(),
            vec![
                &mut self.swap_account,
                &mut self.admin_account,
                &mut new_admin_fee_account.clone(),
            ],
        )
    }

    pub fn apply_new_admin(&mut self, current_ts: i64) -> ProgramResult {
        do_process_instruction_at_time(
            apply_new_admin(&self.swap_key, &self.admin_key).unwrap(),
            vec![&mut self.swap_account, &mut self.admin_account],
            current_ts,
        )
    }

    pub fn commit_new_admin(&mut self, new_admin_key: &Pubkey, current_ts: i64) -> ProgramResult {
        do_process_instruction_at_time(
            commit_new_admin(&self.swap_key, &self.admin_key, new_admin_key).unwrap(),
            vec![
                &mut self.swap_account,
                &mut self.admin_account,
                &mut Account::default(),
            ],
            current_ts,
        )
    }

    pub fn set_new_fees(&mut self, new_fees: Fees) -> ProgramResult {
        do_process_instruction(
            set_new_fees(&self.swap_key, &self.admin_key, new_fees).unwrap(),
            vec![&mut self.swap_account, &mut self.admin_account],
        )
    }

    pub fn set_token_a_exchange_rate_override(
        &mut self,
        exchange_rate_override: Fraction,
    ) -> ProgramResult {
        do_process_instruction(
            set_token_a_exchange_rate_override(
                &self.swap_key,
                &self.admin_key,
                exchange_rate_override,
            )
            .unwrap(),
            vec![&mut self.swap_account, &mut self.admin_account],
        )
    }

    pub fn set_token_b_exchange_rate_override(
        &mut self,
        exchange_rate_override: Fraction,
    ) -> ProgramResult {
        do_process_instruction(
            set_token_b_exchange_rate_override(
                &self.swap_key,
                &self.admin_key,
                exchange_rate_override,
            )
            .unwrap(),
            vec![&mut self.swap_account, &mut self.admin_account],
        )
    }
}

struct TestSyscallStubs {
    unix_timestamp: Option<i64>,
}
impl program_stubs::SyscallStubs for TestSyscallStubs {
    fn sol_get_clock_sysvar(&self, var_addr: *mut u8) -> u64 {
        let clock: Option<i64> = self.unix_timestamp;
        unsafe {
            *(var_addr as *mut _ as *mut Clock) = Clock {
                unix_timestamp: clock.unwrap(),
                ..Clock::default()
            };
        }
        solana_program::entrypoint::SUCCESS
    }

    fn sol_invoke_signed(
        &self,
        instruction: &Instruction,
        account_infos: &[AccountInfo],
        signers_seeds: &[&[&[u8]]],
    ) -> ProgramResult {
        msg!("TestSyscallStubs::sol_invoke_signed()");

        let mut new_account_infos = vec![];

        // mimic check for token program in accounts
        if !account_infos.iter().any(|x| *x.key == spl_token::id()) {
            return Err(ProgramError::InvalidAccountData);
        }

        for meta in instruction.accounts.iter() {
            for account_info in account_infos.iter() {
                if meta.pubkey == *account_info.key {
                    let mut new_account_info = account_info.clone();
                    for seeds in signers_seeds.iter() {
                        let signer =
                            Pubkey::create_program_address(seeds, &SWAP_PROGRAM_ID).unwrap();
                        if *account_info.key == signer {
                            new_account_info.is_signer = true;
                        }
                    }
                    new_account_infos.push(new_account_info);
                }
            }
        }

        spl_token::processor::Processor::process(
            &instruction.program_id,
            &new_account_infos,
            &instruction.data,
        )
    }
}

fn test_syscall_stubs(unix_timestamp: Option<i64>) {
    // only one test may run at a time
    program_stubs::set_syscall_stubs(Box::new(TestSyscallStubs { unix_timestamp }));
}

pub fn do_process_instruction(
    instruction: Instruction,
    accounts: Vec<&mut Account>,
) -> ProgramResult {
    do_process_instruction_maybe_at_time(instruction, accounts, None)
}

pub fn do_process_instruction_at_time(
    instruction: Instruction,
    accounts: Vec<&mut Account>,
    current_ts: i64,
) -> ProgramResult {
    do_process_instruction_maybe_at_time(instruction, accounts, Some(current_ts))
}

fn do_process_instruction_maybe_at_time(
    instruction: Instruction,
    accounts: Vec<&mut Account>,
    current_ts: Option<i64>,
) -> ProgramResult {
    test_syscall_stubs(current_ts);

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
        spl_token::processor::Processor::process(
            &instruction.program_id,
            &account_infos,
            &instruction.data,
        )
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
    mint_account: &mut Account,
    mint_authority_key: &Pubkey,
    account_owner_key: &Pubkey,
    amount: u64,
) -> (Pubkey, Account) {
    let account_key = pubkey_rand();
    let mut account_account = Account::new(
        account_minimum_balance(),
        SplAccount::get_packed_len(),
        program_id,
    );
    let mut mint_authority_account = Account::default();
    let mut rent_sysvar_account = create_account_for_test(&Rent::free());

    do_process_instruction(
        initialize_account(program_id, &account_key, mint_key, account_owner_key).unwrap(),
        vec![
            &mut account_account,
            mint_account,
            &mut mint_authority_account,
            &mut rent_sysvar_account,
        ],
    )
    .unwrap();

    if amount > 0 {
        do_process_instruction(
            mint_to(
                program_id,
                mint_key,
                &account_key,
                mint_authority_key,
                &[],
                amount,
            )
            .unwrap(),
            vec![
                mint_account,
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
    freeze_authority: Option<&Pubkey>,
) -> (Pubkey, Account) {
    let mint_key = pubkey_rand();
    let mut mint_account = Account::new(
        mint_minimum_balance(),
        SplMint::get_packed_len(),
        program_id,
    );
    let mut rent_sysvar_account = create_account_for_test(&Rent::free());

    do_process_instruction(
        initialize_mint(
            program_id,
            &mint_key,
            authority_key,
            freeze_authority,
            decimals,
        )
        .unwrap(),
        vec![&mut mint_account, &mut rent_sysvar_account],
    )
    .unwrap();

    (mint_key, mint_account)
}
