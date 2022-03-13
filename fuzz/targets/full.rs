#![no_main]

use arbitrary::Arbitrary;
use chrono::prelude::*;
use fuzz::{
    native_account_data::NativeAccountData,
    native_stable_swap::{get_swap_state, NativeStableSwap, TokenType},
    native_token::{get_mint_supply, get_token_balance},
};
use lazy_static::lazy_static;
use libfuzzer_sys::fuzz_target;
use rand::Rng;
use solana_program::system_program;
use spl_token::error::TokenError;
use stable_swap::{
    curve::{StableSwap, MAX_AMP, MIN_AMP},
    error::SwapError,
    fees::Fees,
    fraction::Fraction,
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
        token_id: AccountId,
        pool_token_id: AccountId,
        withdraw_token_type: TokenType,
        instruction_data: WithdrawOneData,
    },
    RampA {
        instruction_data: RampAData,
    },
    StopRampA,
}
/// Helper enum to tell which direction a swap is meant to go.
#[derive(Debug, Arbitrary, Clone)]
enum TradeDirection {
    AtoB,
    BtoA,
}

/// Use u128 as an account id to simplify the address space.
type AccountId = u128;

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
    let mut rng = rand::thread_rng();
    let amp_factor = rng.gen_range(MIN_AMP..=MAX_AMP);

    if *VERBOSE >= 1 {
        println!("Amplification Coefficient: {}", amp_factor);
        if *VERBOSE >= 3 {
            println!("Actions: {:?}", actions);
        }
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

    let mut stable_swap = NativeStableSwap::new(
        Utc::now().timestamp(),
        amp_factor,
        INITIAL_SWAP_TOKEN_A_AMOUNT,
        INITIAL_SWAP_TOKEN_B_AMOUNT,
        fees,
        Fraction::UNDEFINED,
        Fraction::UNDEFINED,
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
                token_id,
                pool_token_id,
                withdraw_token_type,
                ..
            } => match withdraw_token_type {
                TokenType::TokenA => (Some(token_id), None, Some(pool_token_id)),
                TokenType::TokenB => (None, Some(token_id), Some(pool_token_id)),
            },
            _ => (None, None, None),
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
            &action,
            &mut stable_swap,
            &mut token_a_accounts,
            &mut token_b_accounts,
            &mut pool_accounts,
        )
    }

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
    assert_eq!(before_total_token_a, after_total_token_a);

    let after_total_token_b = token_b_accounts
        .values()
        .map(|account_pair| {
            let (_, token_account) = account_pair;
            get_token_balance(token_account)
        })
        .sum::<u64>()
        + get_token_balance(&stable_swap.token_b_account)
        + get_token_balance(&stable_swap.admin_fee_b_account);
    assert_eq!(before_total_token_b, after_total_token_b);
}

fn get_total_token_a_amount(actions: &[Action]) -> u64 {
    let mut token_a_ids = HashSet::new();
    for action in actions.iter() {
        match action {
            Action::Swap { token_a_id, .. } => token_a_ids.insert(token_a_id),
            Action::Deposit { token_a_id, .. } => token_a_ids.insert(token_a_id),
            Action::Withdraw { token_a_id, .. } => token_a_ids.insert(token_a_id),
            Action::WithdrawOne {
                token_id,
                pool_token_id: _,
                withdraw_token_type,
                ..
            } => match withdraw_token_type {
                TokenType::TokenA => token_a_ids.insert(token_id),
                _ => false,
            },
            Action::RampA { .. } => false,
            Action::StopRampA => false,
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
            Action::WithdrawOne {
                token_id,
                pool_token_id: _,
                withdraw_token_type,
                ..
            } => match withdraw_token_type {
                TokenType::TokenB => token_b_ids.insert(token_id),
                _ => false,
            },
            Action::RampA { .. } => false,
            Action::StopRampA => false,
        };
    }
    (token_b_ids.len() as u64) * INITIAL_USER_TOKEN_B_AMOUNT
}

fn run_action(
    action: &Action,
    stable_swap: &mut NativeStableSwap,
    token_a_accounts: &mut HashMap<AccountId, (NativeAccountData, NativeAccountData)>,
    token_b_accounts: &mut HashMap<AccountId, (NativeAccountData, NativeAccountData)>,
    pool_accounts: &mut HashMap<AccountId, (NativeAccountData, NativeAccountData)>,
) {
    if *VERBOSE >= 3 {
        println!("Current action: {:#?}", action);
    }

    let initial_mint_supply = get_mint_supply(&stable_swap.pool_mint_account);
    let initial_swap_state = get_swap_state(&stable_swap.swap_account);
    let initial_token_a_balance = get_token_balance(&stable_swap.token_a_account);
    let initial_token_b_balance = get_token_balance(&stable_swap.token_b_account);

    let initial_invariant = StableSwap::new(
        initial_swap_state.initial_amp_factor,
        initial_swap_state.target_amp_factor,
        Utc::now().timestamp(),
        initial_swap_state.start_ramp_ts,
        initial_swap_state.stop_ramp_ts,
    );

    let result = match action {
        Action::Swap {
            token_a_id,
            token_b_id,
            trade_direction,
            instruction_data,
        } => {
            let token_a_account_pair = token_a_accounts.get_mut(token_a_id).unwrap();
            let token_b_account_pair = token_b_accounts.get_mut(token_b_id).unwrap();
            match trade_direction {
                TradeDirection::AtoB => stable_swap.swap_a_to_b(
                    Utc::now().timestamp(),
                    &mut token_a_account_pair.0,
                    &mut token_a_account_pair.1,
                    &mut token_b_account_pair.1,
                    *instruction_data,
                ),
                TradeDirection::BtoA => stable_swap.swap_b_to_a(
                    Utc::now().timestamp(),
                    &mut token_b_account_pair.0,
                    &mut token_a_account_pair.1,
                    &mut token_b_account_pair.1,
                    *instruction_data,
                ),
            }
        }
        Action::Deposit {
            token_a_id,
            token_b_id,
            pool_token_id,
            instruction_data,
        } => {
            let token_a_account_pair = token_a_accounts.get_mut(token_a_id).unwrap();
            let token_b_account_pair = token_b_accounts.get_mut(token_b_id).unwrap();
            let pool_token_account_pair = pool_accounts.get_mut(pool_token_id).unwrap();
            stable_swap.deposit(
                Utc::now().timestamp(),
                &mut token_a_account_pair.0,
                &mut token_a_account_pair.1,
                &mut token_b_account_pair.1,
                &mut pool_token_account_pair.1,
                *instruction_data,
            )
        }
        Action::Withdraw {
            token_a_id,
            token_b_id,
            pool_token_id,
            instruction_data,
        } => {
            let token_a_account_pair = token_a_accounts.get_mut(token_a_id).unwrap();
            let token_b_account_pair = token_b_accounts.get_mut(token_b_id).unwrap();
            let pool_token_account_pair = pool_accounts.get_mut(pool_token_id).unwrap();
            stable_swap.withdraw(
                Utc::now().timestamp(),
                &mut pool_token_account_pair.0,
                &mut token_a_account_pair.1,
                &mut token_b_account_pair.1,
                &mut pool_token_account_pair.1,
                *instruction_data,
            )
        }
        Action::WithdrawOne {
            token_id,
            pool_token_id,
            withdraw_token_type,
            instruction_data,
        } => {
            let pool_token_account_pair = pool_accounts.get_mut(pool_token_id).unwrap();
            match withdraw_token_type {
                TokenType::TokenA => {
                    let token_account_pair = token_a_accounts.get_mut(token_id).unwrap();

                    stable_swap.withdraw_one(
                        Utc::now().timestamp(),
                        &mut pool_token_account_pair.0,
                        &mut token_account_pair.1,
                        &mut pool_token_account_pair.1,
                        TokenType::TokenA,
                        *instruction_data,
                    )
                }
                TokenType::TokenB => {
                    let token_account_pair = token_b_accounts.get_mut(token_id).unwrap();

                    stable_swap.withdraw_one(
                        Utc::now().timestamp(),
                        &mut pool_token_account_pair.0,
                        &mut token_account_pair.1,
                        &mut pool_token_account_pair.1,
                        TokenType::TokenB,
                        *instruction_data,
                    )
                }
            }
        }
        Action::RampA { instruction_data } => {
            stable_swap.ramp_a(Utc::now().timestamp(), *instruction_data)
        }
        Action::StopRampA => stable_swap.stop_ramp_a(Utc::now().timestamp()),
    };

    let current_mint_supply = get_mint_supply(&stable_swap.pool_mint_account);
    let current_swap_state = get_swap_state(&stable_swap.swap_account);
    let current_token_a_balance = get_token_balance(&stable_swap.token_a_account);
    let current_token_b_balance = get_token_balance(&stable_swap.token_b_account);

    let current_invariant = StableSwap::new(
        current_swap_state.initial_amp_factor,
        current_swap_state.target_amp_factor,
        Utc::now().timestamp(),
        current_swap_state.start_ramp_ts,
        current_swap_state.stop_ramp_ts,
    );

    // Assert virtual price does not decrease
    let initial_amp_factor = initial_invariant.compute_amp_factor().unwrap();
    let d_0 = initial_invariant
        .compute_d(initial_token_a_balance, initial_token_b_balance)
        .unwrap();
    let current_amp_factor = current_invariant.compute_amp_factor().unwrap();
    let d_1 = current_invariant
        .compute_d(current_token_a_balance, current_token_b_balance)
        .unwrap();
    assert!(
        d_1 / current_mint_supply >= d_0 / initial_mint_supply,
        "d0: {}, initial_lp_supply: {}, initial_A: {}, initial_a_balance: {}, initial_b_balance: {}\n \
         d1: {}, current_lp_supply: {}, current_A: {}, current_a_balance: {}, current_b_balance: {}",
        d_0,
        initial_mint_supply,
        initial_amp_factor,
        initial_token_a_balance,
        initial_token_b_balance,
        d_1,
        current_mint_supply,
        current_amp_factor,
        current_token_a_balance,
        current_token_b_balance,
    );

    // XXX: This is soo ugly, refactor this!
    match action {
        Action::RampA {
            instruction_data: _,
        } => {
            result
                .map_err(|e| {
                    if !(e == SwapError::InvalidInput.into()
                        || e == SwapError::CalculationFailure.into()
                        || e == SwapError::RampLocked.into()
                        || e == SwapError::InsufficientRampTime.into())
                    {
                        Err(e).unwrap()
                    }
                })
                .ok();
        }
        _ => {
            result
                .map_err(|e| {
                    if !(e == SwapError::CalculationFailure.into()
                        || e == SwapError::ConversionFailure.into()
                        || e == SwapError::ExceededSlippage.into()
                        || e == TokenError::InsufficientFunds.into()
                        || e == TokenError::OwnerMismatch.into())
                    {
                        Err(e).unwrap()
                    }
                })
                .ok();
        }
    }
}
