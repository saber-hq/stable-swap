#![no_main]

use arbitrary::Arbitrary;
use chrono::prelude::*;
use fuzz::{
    native_account_data::NativeAccountData,
    native_stable_swap::{NativeStableSwap, TokenType},
    native_token::get_token_balance,
};
use lazy_static::lazy_static;
use libfuzzer_sys::fuzz_target;
use rand::Rng;
use solana_program::system_program;
use spl_token::error::TokenError;
use stable_swap::{
    curve::{MAX_AMP, MIN_AMP},
    error::SwapError,
    fees::Fees,
    instruction::*,
};
use std::collections::{HashMap, HashSet};

#[derive(Debug, Arbitrary, Clone)]
enum Action {
    Swap {
        token_a_id: AccountId,
        token_b_id: AccountId,
        trade_direction: TradeDirection,
        instruction_data: SwapData,
    },
    Deposit {
        token_a_id: AccountId,
        token_b_id: AccountId,
        pool_token_id: AccountId,
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
        admin_trade_fee_numerator,
        admin_trade_fee_denominator,
        admin_withdraw_fee_numerator,
        admin_withdraw_fee_denominator,
        trade_fee_numerator,
        trade_fee_denominator,
        withdraw_fee_numerator,
        withdraw_fee_denominator,
    };

    let mut rng = rand::thread_rng();
    let amp_factor = rng.gen_range(MIN_AMP, MAX_AMP);
    println!("Amplification Coefficient: {}", amp_factor);

    let mut stable_swap = NativeStableSwap::new(
        amp_factor,
        INITIAL_SWAP_TOKEN_A_AMOUNT,
        INITIAL_SWAP_TOKEN_B_AMOUNT,
        fees,
    );

    // keep track of all accounts, including swap accounts
    // mapping of AccountId => (signing account, token account)
    let mut token_a_accounts: HashMap<AccountId, (NativeAccountData, NativeAccountData)> =
        HashMap::new();
    let mut token_b_accounts: HashMap<AccountId, (NativeAccountData, NativeAccountData)> =
        HashMap::new();
    let mut pool_accounts: HashMap<AccountId, (NativeAccountData, NativeAccountData)> =
        HashMap::new();

    // add all the pool and token accounts that will be needed
    for action in &actions {
        let (token_a_id, token_b_id, pool_token_id) = match action.clone() {
            Action::Swap {
                token_a_id,
                token_b_id,
                ..
            } => (Some(token_a_id), Some(token_b_id), None),
            Action::Deposit {
                token_a_id,
                token_b_id,
                pool_token_id,
                ..
            } => (Some(token_a_id), Some(token_b_id), Some(pool_token_id)),
            Action::Withdraw {
                token_a_id,
                token_b_id,
                pool_token_id,
                ..
            } => (Some(token_a_id), Some(token_b_id), Some(pool_token_id)),
            Action::WithdrawOne {
                token_a_id,
                token_b_id,
                pool_token_id,
                ..
            } => (Some(token_a_id), Some(token_b_id), Some(pool_token_id)),
        };

        let signing_account = NativeAccountData::new_signer(0, system_program::id());
        if let Some(token_a_id) = token_a_id {
            let account_pairs = (
                signing_account.clone(),
                stable_swap
                    .create_token_a_account(signing_account.clone(), INITIAL_USER_TOKEN_A_AMOUNT),
            );
            token_a_accounts
                .entry(token_a_id)
                .or_insert_with(|| account_pairs);
        }
        if let Some(token_b_id) = token_b_id {
            let account_pairs = (
                signing_account.clone(),
                stable_swap
                    .create_token_b_account(signing_account.clone(), INITIAL_USER_TOKEN_B_AMOUNT),
            );
            token_b_accounts
                .entry(token_b_id)
                .or_insert_with(|| account_pairs);
        }
        if let Some(pool_token_id) = pool_token_id {
            let account_pairs = (
                signing_account.clone(),
                stable_swap.create_pool_account(signing_account.clone()),
            );
            pool_accounts
                .entry(pool_token_id)
                .or_insert_with(|| account_pairs);
        }
    }

    // to ensure that we never create or remove base tokens
    let before_total_token_a = INITIAL_SWAP_TOKEN_A_AMOUNT + get_total_token_a_amount(&actions);
    let before_total_token_b = INITIAL_SWAP_TOKEN_B_AMOUNT + get_total_token_b_amount(&actions);

    for action in actions {
        run_action(
            action,
            &mut stable_swap,
            &mut token_a_accounts,
            &mut token_b_accounts,
            &mut pool_accounts,
        )
    }

    const EPSILON: f64 = 1e-5;
    // check total token a and b amounts
    let after_total_token_a = token_a_accounts
        .values()
        .map(|account_pair| {
            let (_, token_account) = account_pair;
            get_token_balance(token_account)
        })
        .sum::<u64>()
        + get_token_balance(&stable_swap.token_a_account)
        + get_token_balance(&stable_swap.admin_fee_a_account);
    let diff = (before_total_token_a as f64 - after_total_token_a as f64).abs();
    assert!(
        (diff / before_total_token_a as f64) < EPSILON,
        "before_total_token_a: {}, after_total_token_a: {}",
        before_total_token_a,
        after_total_token_a
    );

    let after_total_token_b = token_b_accounts
        .values()
        .map(|account_pair| {
            let (_, token_account) = account_pair;
            get_token_balance(token_account)
        })
        .sum::<u64>()
        + get_token_balance(&stable_swap.token_b_account)
        + get_token_balance(&stable_swap.admin_fee_b_account);
    let diff = (before_total_token_b as f64 - after_total_token_b as f64).abs();
    assert!(
        (diff / before_total_token_b as f64) < EPSILON,
        "before_total_token_b: {}, after_total_token_b: {}",
        before_total_token_b,
        after_total_token_b
    );
}

fn get_total_token_a_amount(actions: &[Action]) -> u64 {
    let mut token_a_ids = HashSet::new();
    for action in actions.iter() {
        match action {
            Action::Swap { token_a_id, .. } => token_a_ids.insert(token_a_id),
            Action::Deposit { token_a_id, .. } => token_a_ids.insert(token_a_id),
            Action::Withdraw { token_a_id, .. } => token_a_ids.insert(token_a_id),
            Action::WithdrawOne { token_a_id, .. } => token_a_ids.insert(token_a_id),
        };
    }
    (token_a_ids.len() as u64) * INITIAL_USER_TOKEN_A_AMOUNT
}

fn get_total_token_b_amount(actions: &[Action]) -> u64 {
    let mut token_b_ids = HashSet::new();
    for action in actions.iter() {
        match action {
            Action::Swap { token_b_id, .. } => token_b_ids.insert(token_b_id),
            Action::Deposit { token_b_id, .. } => token_b_ids.insert(token_b_id),
            Action::Withdraw { token_b_id, .. } => token_b_ids.insert(token_b_id),
            Action::WithdrawOne { token_b_id, .. } => token_b_ids.insert(token_b_id),
        };
    }
    (token_b_ids.len() as u64) * INITIAL_USER_TOKEN_B_AMOUNT
}

fn run_action(
    action: Action,
    stable_swap: &mut NativeStableSwap,
    token_a_accounts: &mut HashMap<AccountId, (NativeAccountData, NativeAccountData)>,
    token_b_accounts: &mut HashMap<AccountId, (NativeAccountData, NativeAccountData)>,
    pool_accounts: &mut HashMap<AccountId, (NativeAccountData, NativeAccountData)>,
) {
    let result = match action {
        Action::Swap {
            token_a_id,
            token_b_id,
            trade_direction,
            instruction_data,
        } => {
            let token_a_account_pair = token_a_accounts.get_mut(&token_a_id).unwrap();
            let token_b_account_pair = token_b_accounts.get_mut(&token_b_id).unwrap();
            match trade_direction {
                TradeDirection::AtoB => stable_swap.swap_a_to_b(
                    Utc::now().timestamp(),
                    &mut token_a_account_pair.0,
                    &mut token_a_account_pair.1,
                    &mut token_b_account_pair.1,
                    instruction_data,
                ),
                TradeDirection::BtoA => stable_swap.swap_b_to_a(
                    Utc::now().timestamp(),
                    &mut token_b_account_pair.0,
                    &mut token_a_account_pair.1,
                    &mut token_b_account_pair.1,
                    instruction_data,
                ),
            }
        }
        Action::Deposit {
            token_a_id,
            token_b_id,
            pool_token_id,
            instruction_data,
        } => {
            let token_a_account_pair = token_a_accounts.get_mut(&token_a_id).unwrap();
            let token_b_account_pair = token_b_accounts.get_mut(&token_b_id).unwrap();
            let pool_token_account_pair = pool_accounts.get_mut(&pool_token_id).unwrap();
            stable_swap.deposit(
                Utc::now().timestamp(),
                &mut token_a_account_pair.0,
                &mut token_a_account_pair.1,
                &mut token_b_account_pair.0,
                &mut token_b_account_pair.1,
                &mut pool_token_account_pair.1,
                instruction_data,
            )
        }
        Action::Withdraw {
            token_a_id,
            token_b_id,
            pool_token_id,
            instruction_data,
        } => {
            let token_a_account_pair = token_a_accounts.get_mut(&token_a_id).unwrap();
            let token_b_account_pair = token_b_accounts.get_mut(&token_b_id).unwrap();
            let pool_token_account_pair = pool_accounts.get_mut(&pool_token_id).unwrap();
            stable_swap.withdraw(
                &mut pool_token_account_pair.0,
                &mut token_a_account_pair.1,
                &mut token_b_account_pair.1,
                &mut pool_token_account_pair.1,
                instruction_data,
            )
        }
        Action::WithdrawOne {
            token_a_id,
            token_b_id,
            pool_token_id,
            withdraw_token_type,
            instruction_data,
        } => {
            let token_a_account_pair = token_a_accounts.get_mut(&token_a_id).unwrap();
            let token_b_account_pair = token_b_accounts.get_mut(&token_b_id).unwrap();
            let pool_token_account_pair = pool_accounts.get_mut(&pool_token_id).unwrap();
            match withdraw_token_type {
                TokenType::TokenA => stable_swap.withdraw_one(
                    Utc::now().timestamp(),
                    &mut pool_token_account_pair.0,
                    &mut token_a_account_pair.1,
                    &mut pool_token_account_pair.1,
                    TokenType::TokenA,
                    instruction_data,
                ),
                TokenType::TokenB => stable_swap.withdraw_one(
                    Utc::now().timestamp(),
                    &mut pool_token_account_pair.0,
                    &mut token_b_account_pair.1,
                    &mut pool_token_account_pair.1,
                    TokenType::TokenB,
                    instruction_data,
                ),
            }
        }
    };
    result
        .map_err(|e| {
            if !(e == SwapError::CalculationFailure.into()
                || e == SwapError::ConversionFailure.into()
                || e == SwapError::ExceededSlippage.into()
                || e == TokenError::InsufficientFunds.into())
            {
                Err(e).unwrap()
            }
        })
        .ok();
}
