//! Helpers for working with swaps in a fuzzing environment

use crate::native_account_data::NativeAccountData;
use crate::native_processor::do_process_instruction;
use crate::native_token;

use arbitrary::Arbitrary;
use solana_program::{
    bpf_loader, entrypoint::ProgramResult, program_pack::Pack, pubkey::Pubkey, system_program,
};
use spl_token::instruction::approve;
use stable_swap::{fees::Fees, instruction::*, state::SwapInfo};
/// Helper enum to tell which token for WithdrawOne.
#[derive(Arbitrary, Clone, Debug, PartialEq)]
pub enum TokenType {
    TokenA,
    TokenB,
}

fn create_program_account(program_id: Pubkey) -> NativeAccountData {
    let mut account_data = NativeAccountData::new(0, bpf_loader::id());
    account_data.key = program_id;
    account_data
}

pub struct NativeStableSwap {
    pub nonce: u8,
    pub initial_amp_factor: u64,
    pub target_amp_factor: u64,
    pub fees: Fees,
    pub swap_account: NativeAccountData,
    pub authority_account: NativeAccountData,
    pub pool_mint_account: NativeAccountData,
    pub pool_token_account: NativeAccountData,
    pub token_a_account: NativeAccountData,
    pub token_a_mint_account: NativeAccountData,
    pub token_b_account: NativeAccountData,
    pub token_b_mint_account: NativeAccountData,
    pub admin_account: NativeAccountData,
    pub admin_fee_a_account: NativeAccountData,
    pub admin_fee_b_account: NativeAccountData,
    pub token_program_account: NativeAccountData,
}

impl NativeStableSwap {
    pub fn new(amp_factor: u64, token_a_amount: u64, token_b_amount: u64, fees: Fees) -> Self {
        let mut user_account = NativeAccountData::new_signer(0, system_program::id());
        let mut swap_account = NativeAccountData::new(SwapInfo::LEN, stable_swap::id());
        let (authority_key, nonce) =
            Pubkey::find_program_address(&[&swap_account.key.to_bytes()[..]], &stable_swap::id());

        let mut authority_account = create_program_account(authority_key);
        let mut token_program_account = create_program_account(spl_token::id());

        let mut pool_mint_account = native_token::create_mint(&authority_account.key);
        let mut pool_token_account =
            native_token::create_token_account(&mut pool_mint_account, &user_account.key, 0);

        let mut token_a_mint_account = native_token::create_mint(&user_account.key);
        let mut admin_fee_a_account =
            native_token::create_token_account(&mut token_a_mint_account, &user_account.key, 0);
        let mut token_a_account = native_token::create_token_account(
            &mut token_a_mint_account,
            &authority_account.key,
            token_a_amount,
        );

        let mut token_b_mint_account = native_token::create_mint(&user_account.key);
        let mut admin_fee_b_account =
            native_token::create_token_account(&mut token_b_mint_account, &user_account.key, 0);
        let mut token_b_account = native_token::create_token_account(
            &mut token_b_mint_account,
            &authority_account.key,
            token_b_amount,
        );

        let init_instruction = initialize(
            &stable_swap::id(),
            &spl_token::id(),
            &swap_account.key,
            &authority_account.key,
            &user_account.key,
            &admin_fee_a_account.key,
            &admin_fee_b_account.key,
            &token_a_mint_account.key,
            &token_a_account.key,
            &token_b_mint_account.key,
            &token_b_account.key,
            &pool_mint_account.key,
            &pool_token_account.key,
            nonce,
            amp_factor,
            fees,
        )
        .unwrap();

        do_process_instruction(
            init_instruction,
            &[
                swap_account.as_account_info(),
                authority_account.as_account_info(),
                user_account.as_account_info(),
                admin_fee_a_account.as_account_info(),
                admin_fee_b_account.as_account_info(),
                token_a_mint_account.as_account_info(),
                token_a_account.as_account_info(),
                token_b_mint_account.as_account_info(),
                token_b_account.as_account_info(),
                pool_mint_account.as_account_info(),
                pool_token_account.as_account_info(),
                token_program_account.as_account_info(),
            ],
        )
        .unwrap();

        Self {
            nonce,
            initial_amp_factor: amp_factor,
            target_amp_factor: amp_factor,
            fees,
            swap_account,
            authority_account,
            pool_mint_account,
            pool_token_account,
            token_a_account,
            token_a_mint_account,
            token_b_account,
            token_b_mint_account,
            admin_account: user_account,
            admin_fee_a_account,
            admin_fee_b_account,
            token_program_account,
        }
    }

    pub fn create_pool_account(&mut self, user_account: NativeAccountData) -> NativeAccountData {
        native_token::create_token_account(&mut self.pool_mint_account, &user_account.key, 0)
    }

    pub fn create_token_a_account(
        &mut self,
        user_account: NativeAccountData,
        amount: u64,
    ) -> NativeAccountData {
        native_token::create_token_account(
            &mut self.token_a_mint_account,
            &user_account.key,
            amount,
        )
    }

    pub fn create_token_b_account(
        &mut self,
        user_account: NativeAccountData,
        amount: u64,
    ) -> NativeAccountData {
        native_token::create_token_account(
            &mut self.token_b_mint_account,
            &user_account.key,
            amount,
        )
    }

    pub fn swap_a_to_b(
        &mut self,
        current_ts: i64,
        user_account: &mut NativeAccountData,
        token_a_account: &mut NativeAccountData,
        token_b_account: &mut NativeAccountData,
        instruction_data: SwapData,
    ) -> ProgramResult {
        do_process_instruction(
            approve(
                &self.token_program_account.key,
                &token_a_account.key,
                &self.authority_account.key,
                &user_account.key,
                &[],
                instruction_data.amount_in,
            )
            .unwrap(),
            &[
                token_a_account.as_account_info(),
                self.authority_account.as_account_info(),
                user_account.as_account_info(),
            ],
        )
        .unwrap();

        let swap_instruction = swap(
            &stable_swap::id(),
            &spl_token::id(),
            &self.swap_account.key,
            &self.authority_account.key,
            &token_a_account.key,
            &self.token_a_account.key,
            &self.token_b_account.key,
            &token_b_account.key,
            &self.admin_fee_b_account.key,
            instruction_data.amount_in,
            instruction_data.minimum_amount_out,
        )
        .unwrap();

        do_process_instruction(
            swap_instruction,
            &[
                self.swap_account.as_account_info(),
                self.authority_account.as_account_info(),
                token_a_account.as_account_info(),
                self.token_a_account.as_account_info(),
                self.token_b_account.as_account_info(),
                token_b_account.as_account_info(),
                self.admin_fee_b_account.as_account_info(),
                self.token_program_account.as_account_info(),
                NativeAccountData::new_clock(current_ts).as_account_info(),
            ],
        )
    }

    pub fn swap_b_to_a(
        &mut self,
        current_ts: i64,
        user_account: &mut NativeAccountData,
        token_a_account: &mut NativeAccountData,
        token_b_account: &mut NativeAccountData,
        instruction_data: SwapData,
    ) -> ProgramResult {
        do_process_instruction(
            approve(
                &self.token_program_account.key,
                &token_b_account.key,
                &self.authority_account.key,
                &user_account.key,
                &[],
                instruction_data.amount_in,
            )
            .unwrap(),
            &[
                token_b_account.as_account_info(),
                self.authority_account.as_account_info(),
                user_account.as_account_info(),
            ],
        )
        .unwrap();

        let swap_instruction = swap(
            &stable_swap::id(),
            &spl_token::id(),
            &self.swap_account.key,
            &self.authority_account.key,
            &token_b_account.key,
            &self.token_b_account.key,
            &self.token_a_account.key,
            &token_a_account.key,
            &self.admin_fee_a_account.key,
            instruction_data.amount_in,
            instruction_data.minimum_amount_out,
        )
        .unwrap();

        do_process_instruction(
            swap_instruction,
            &[
                self.swap_account.as_account_info(),
                self.authority_account.as_account_info(),
                token_b_account.as_account_info(),
                self.token_b_account.as_account_info(),
                self.token_a_account.as_account_info(),
                token_a_account.as_account_info(),
                self.admin_fee_a_account.as_account_info(),
                self.token_program_account.as_account_info(),
                NativeAccountData::new_clock(current_ts).as_account_info(),
            ],
        )
    }

    pub fn deposit(
        &mut self,
        current_ts: i64,
        user_account: &mut NativeAccountData,
        token_a_account: &mut NativeAccountData,
        token_b_account: &mut NativeAccountData,
        pool_token_account: &mut NativeAccountData,
        instruction_data: DepositData,
    ) -> ProgramResult {
        do_process_instruction(
            approve(
                &self.token_program_account.key,
                &token_a_account.key,
                &self.authority_account.key,
                &user_account.key,
                &[],
                instruction_data.token_a_amount,
            )
            .unwrap(),
            &[
                token_a_account.as_account_info(),
                self.authority_account.as_account_info(),
                user_account.as_account_info(),
            ],
        )
        .unwrap();

        do_process_instruction(
            approve(
                &self.token_program_account.key,
                &token_b_account.key,
                &self.authority_account.key,
                &user_account.key,
                &[],
                instruction_data.token_b_amount,
            )
            .unwrap(),
            &[
                token_b_account.as_account_info(),
                self.authority_account.as_account_info(),
                user_account.as_account_info(),
            ],
        )
        .unwrap();

        let deposit_instruction = deposit(
            &stable_swap::id(),
            &spl_token::id(),
            &self.swap_account.key,
            &self.authority_account.key,
            &token_a_account.key,
            &token_b_account.key,
            &self.token_a_account.key,
            &self.token_b_account.key,
            &self.pool_mint_account.key,
            &pool_token_account.key,
            instruction_data.token_a_amount,
            instruction_data.token_b_amount,
            instruction_data.min_mint_amount,
        )
        .unwrap();

        do_process_instruction(
            deposit_instruction,
            &[
                self.swap_account.as_account_info(),
                self.authority_account.as_account_info(),
                token_a_account.as_account_info(),
                token_b_account.as_account_info(),
                self.token_a_account.as_account_info(),
                self.token_b_account.as_account_info(),
                self.pool_mint_account.as_account_info(),
                pool_token_account.as_account_info(),
                self.token_program_account.as_account_info(),
                NativeAccountData::new_clock(current_ts).as_account_info(),
            ],
        )
    }

    pub fn withdraw(
        &mut self,
        user_account: &mut NativeAccountData,
        token_a_account: &mut NativeAccountData,
        token_b_account: &mut NativeAccountData,
        pool_token_account: &mut NativeAccountData,
        instruction_data: WithdrawData,
    ) -> ProgramResult {
        do_process_instruction(
            approve(
                &self.token_program_account.key,
                &pool_token_account.key,
                &self.authority_account.key,
                &user_account.key,
                &[],
                instruction_data.pool_token_amount,
            )
            .unwrap(),
            &[
                pool_token_account.as_account_info(),
                self.authority_account.as_account_info(),
                user_account.as_account_info(),
            ],
        )
        .unwrap();

        let withdraw_instruction = withdraw(
            &stable_swap::id(),
            &spl_token::id(),
            &self.swap_account.key,
            &self.authority_account.key,
            &self.pool_mint_account.key,
            &pool_token_account.key,
            &self.token_a_account.key,
            &self.token_b_account.key,
            &token_a_account.key,
            &token_b_account.key,
            &self.admin_fee_a_account.key,
            &self.admin_fee_a_account.key,
            instruction_data.pool_token_amount,
            instruction_data.minimum_token_a_amount,
            instruction_data.minimum_token_b_amount,
        )
        .unwrap();

        do_process_instruction(
            withdraw_instruction,
            &[
                self.swap_account.as_account_info(),
                self.authority_account.as_account_info(),
                self.pool_mint_account.as_account_info(),
                pool_token_account.as_account_info(),
                self.token_a_account.as_account_info(),
                self.token_b_account.as_account_info(),
                token_a_account.as_account_info(),
                token_b_account.as_account_info(),
                self.admin_fee_a_account.as_account_info(),
                self.admin_fee_b_account.as_account_info(),
                self.token_program_account.as_account_info(),
            ],
        )
    }

    pub fn withdraw_one(
        &mut self,
        current_ts: i64,
        user_account: &mut NativeAccountData,
        token_account: &mut NativeAccountData,
        pool_token_account: &mut NativeAccountData,
        token_type: TokenType,
        instruction_data: WithdrawOneData,
    ) -> ProgramResult {
        do_process_instruction(
            approve(
                &self.token_program_account.key,
                &pool_token_account.key,
                &self.authority_account.key,
                &user_account.key,
                &[],
                instruction_data.pool_token_amount,
            )
            .unwrap(),
            &[
                pool_token_account.as_account_info(),
                self.authority_account.as_account_info(),
                user_account.as_account_info(),
            ],
        )
        .unwrap();

        let mut swap_base_token_account = if token_type == TokenType::TokenA {
            self.token_a_account.clone()
        } else {
            self.token_b_account.clone()
        };
        let mut swap_quote_token_account = if token_type == TokenType::TokenA {
            self.token_b_account.clone()
        } else {
            self.token_a_account.clone()
        };
        let mut admin_fee_destination_account = if token_type == TokenType::TokenA {
            self.admin_fee_a_account.clone()
        } else {
            self.admin_fee_b_account.clone()
        };

        let withdraw_one_instruction = withdraw_one(
            &stable_swap::id(),
            &spl_token::id(),
            &self.swap_account.key,
            &self.authority_account.key,
            &self.pool_mint_account.key,
            &pool_token_account.key,
            &swap_base_token_account.key,
            &swap_quote_token_account.key,
            &token_account.key,
            &admin_fee_destination_account.key,
            instruction_data.pool_token_amount,
            instruction_data.minimum_token_amount,
        )
        .unwrap();

        do_process_instruction(
            withdraw_one_instruction,
            &[
                self.swap_account.as_account_info(),
                self.authority_account.as_account_info(),
                self.pool_mint_account.as_account_info(),
                pool_token_account.as_account_info(),
                swap_base_token_account.as_account_info(),
                swap_quote_token_account.as_account_info(),
                token_account.as_account_info(),
                admin_fee_destination_account.as_account_info(),
                self.token_program_account.as_account_info(),
                NativeAccountData::new_clock(current_ts).as_account_info(),
            ],
        )
    }
}
