#![no_main]
use arbitrary::{Arbitrary};
use libfuzzer_sys::fuzz_target;
use stable_swap::{fees::Fees, instruction::*};

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
        deposit_type: DepositTokenType,
        instruction_data: DepositData,
    },
    Withdraw {
        pool_token_id: AccountId,
        instruction_data: WithdrawData,
    },
    WithdrawOne {
        pool_token_id: AccountId,
        instruction_data: WithdrawOneData,
    },
}

/// Helper enum to tell which token to deposit for DepositOne.
#[derive(Debug, Arbitrary, Clone)]
enum DepositTokenType {
    TokenA,
    TokenB,
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

const INITIAL_SWAP_TOKEN_A_AMOUNT: u64 = 100_000_000_000;
const INITIAL_SWAP_TOKEN_B_AMOUNT: u64 = 300_000_000_000;

const INITIAL_USER_TOKEN_A_AMOUNT: u64 = 1_000_000_000;
const INITIAL_USER_TOKEN_B_AMOUNT: u64 = 3_000_000_000;

fuzz_target!(|actions: Vec<Action>| { run_actions(actions) });

fn run_actions(actions: Vec<Action>) {
    // TODO
}
