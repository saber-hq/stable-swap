#![no_main]

use arbitrary::Arbitrary;
use fuzz::{
    native_account_data::NativeAccountData,
    native_stable_swap::{NativeStableSwap, TokenType},
};
use lazy_static::lazy_static;
use libfuzzer_sys::fuzz_target;
use rand::Rng;
use solana_program::{
    account_info::AccountInfo, entrypoint::ProgramResult, instruction::Instruction,
};
use stable_swap::{
    curve::{MAX_AMP, MIN_AMP},
    fees::Fees,
    instruction::*,
};
use std::collections::HashMap;

#[derive(Debug, Arbitrary, Clone)]
enum Action {
    Swap {
        token_a_id: AccountId,
        token_b_id: AccountId,
        trade_directions: TradeDirection,
        instruction_data: SwapData,
    },
    Deposit {
        token_a_id: AccountId,
        token_b_id: AccountId,
        pool_token_id: AccountId,
        instruction_data: DepositData,
    },
    DepositOne {
        token_a_id: AccountId,
        token_b_id: AccountId,
        pool_token_id: AccountId,
        deposit_token_type: TokenType,
        instruction_data: DepositData,
    },
    Withdraw {
        token_a_id: AccountId,
        token_b_id: AccountId,
        pool_token_id: AccountId,
        instruction_data: WithdrawData,
    },
    WithdrawOne {
        token_a_id: AccountId,
        token_b_id: AccountId,
        pool_token_id: AccountId,
        withdraw_token_type: TokenType,
        instruction_data: WithdrawOneData,
    },
}
/// Helper enum to tell which direction a swap is meant to go.
#[derive(Debug, Arbitrary, Clone)]
enum TradeDirection {
    AtoB,
    BtoA,
}

/// Use u8 as an account id to simplify the address space and re-use accounts
/// more often.
type AccountId = u8;

const INITIAL_AMP_FACTOR: u64 = 100;
const INITIAL_SWAP_TOKEN_A_AMOUNT: u64 = 100_000_000_000;
const INITIAL_SWAP_TOKEN_B_AMOUNT: u64 = 100_000_000_000;

const INITIAL_USER_TOKEN_A_AMOUNT: u64 = 1_000_000_000;
const INITIAL_USER_TOKEN_B_AMOUNT: u64 = 1_000_000_000;

lazy_static! {
    static ref VERBOSE: u32 = std::env::var("FUZZ_VERBOSE")
        .map(|s| s.parse())
        .ok()
        .transpose()
        .ok()
        .flatten()
        .unwrap_or(0);
}

fuzz_target!(|actions: Vec<Action>| { run_actions(actions) });

fn run_actions(actions: Vec<Action>) {
    if *VERBOSE >= 1 {
        println!("{:#?}", actions);
    } else {
        solana_program::program_stubs::set_syscall_stubs(Box::new(NoSolLoggingStubs));
    }

    let admin_trade_fee_numerator = 25;
    let admin_trade_fee_denominator = 10000;
    let admin_withdraw_fee_numerator = 30;
    let admin_withdraw_fee_denominator = 10000;
    let trade_fee_numerator = 25;
    let trade_fee_denominator = 10000;
    let withdraw_fee_numerator = 30;
    let withdraw_fee_denominator = 10000;
    let fees = Fees {
        trade_fee_numerator,
        trade_fee_denominator,
        withdraw_fee_numerator,
        withdraw_fee_denominator,
        admin_trade_fee_numerator,
        admin_trade_fee_denominator,
        admin_withdraw_fee_numerator,
        admin_withdraw_fee_denominator,
    };

    let mut stable_swap = NativeStableSwap::new(
        INITIAL_AMP_FACTOR,
        INITIAL_SWAP_TOKEN_A_AMOUNT,
        INITIAL_SWAP_TOKEN_B_AMOUNT,
        fees,
    );

    // keep track of all accounts, including swap accounts
    let mut token_a_accounts: HashMap<AccountId, NativeAccountData> = HashMap::new();
    let mut token_b_accounts: HashMap<AccountId, NativeAccountData> = HashMap::new();
    let mut pool_accounts: HashMap<AccountId, NativeAccountData> = HashMap::new();
}

struct NoSolLoggingStubs;

impl solana_program::program_stubs::SyscallStubs for NoSolLoggingStubs {
    fn sol_log(&self, _message: &str) {}
    fn sol_invoke_signed(
        &self,
        _instruction: &Instruction,
        _account_infos: &[AccountInfo],
        _signers_seeds: &[&[&[u8]]],
    ) -> ProgramResult {
        unimplemented!()
    }
}
