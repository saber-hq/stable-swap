#![no_main]

use arbitrary::Arbitrary;
use chrono::prelude::*;
use fuzz::{
    native_account_data::NativeAccountData, native_stable_swap::NativeStableSwap,
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

#[derive(Debug, Arbitrary, Clone)]
struct SwapArgs {
    trade_direction: TradeDirection,
    instruction_data: SwapData,
}

/// Helper enum to tell which direction a swap is meant to go.
#[derive(Debug, Arbitrary, Clone)]
enum TradeDirection {
    AtoB,
    BtoA,
}

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

fuzz_target!(|argv: Vec<SwapArgs>| { run_swaps(argv) });

fn run_swaps(argv: Vec<SwapArgs>) {
    let mut rng = rand::thread_rng();
    let amp_factor = rng.gen_range(MIN_AMP..=MAX_AMP);

    if *VERBOSE >= 1 {
        println!("Amplification Coefficient: {}", amp_factor);
        if *VERBOSE >= 3 {
            println!("Swap args: {:?}", argv);
        }
    }

    let admin_trade_fee_numerator = 0;
    let admin_trade_fee_denominator = 10000;
    let admin_withdraw_fee_numerator = 0;
    let admin_withdraw_fee_denominator = 10000;
    let trade_fee_numerator = 4;
    let trade_fee_denominator = 1000;
    let withdraw_fee_numerator = 0;
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
    );

    let mut user_account = NativeAccountData::new_signer(0, system_program::id());
    let mut token_a_account =
        stable_swap.create_token_a_account(user_account.clone(), INITIAL_USER_TOKEN_A_AMOUNT);
    let mut token_b_account =
        stable_swap.create_token_b_account(user_account.clone(), INITIAL_USER_TOKEN_B_AMOUNT);

    let before_user_token_a = INITIAL_USER_TOKEN_A_AMOUNT;
    let before_user_token_b = INITIAL_USER_TOKEN_B_AMOUNT;

    for args in argv {
        run_swap(
            &args,
            &mut stable_swap,
            &mut user_account,
            &mut token_a_account,
            &mut token_b_account,
        )
    }

    let after_user_token_a = get_token_balance(&token_a_account);
    let after_user_token_b = get_token_balance(&token_b_account);

    assert!(
        after_user_token_a + after_user_token_b <= before_user_token_a + before_user_token_b,
        "before_a: {}, before_b: {}, after_a: {}, after_b: {}",
        before_user_token_a,
        before_user_token_b,
        after_user_token_a,
        after_user_token_b
    );
}

fn run_swap(
    args: &SwapArgs,
    stable_swap: &mut NativeStableSwap,
    user_account: &mut NativeAccountData,
    token_a_account: &mut NativeAccountData,
    token_b_account: &mut NativeAccountData,
) {
    if *VERBOSE >= 3 {
        println!("Current swap args: {:#?}", args);
    }

    let initial_token_a_balance = get_token_balance(token_a_account);
    let initial_token_b_balance = get_token_balance(token_b_account);

    let SwapArgs {
        trade_direction,
        instruction_data,
    } = args;

    let ix_data_with_slippage_override = SwapData {
        amount_in: instruction_data.amount_in,
        minimum_amount_out: 0,
    };

    let result = match trade_direction {
        TradeDirection::AtoB => stable_swap.swap_a_to_b(
            Utc::now().timestamp(),
            user_account,
            token_a_account,
            token_b_account,
            ix_data_with_slippage_override,
        ),
        TradeDirection::BtoA => stable_swap.swap_b_to_a(
            Utc::now().timestamp(),
            user_account,
            token_a_account,
            token_b_account,
            ix_data_with_slippage_override,
        ),
    };

    let current_token_a_balance = get_token_balance(token_a_account);
    let current_token_b_balance = get_token_balance(token_b_account);
    assert!(
        current_token_a_balance + current_token_b_balance
            <= initial_token_a_balance + initial_token_b_balance,
        "initial_token_a_balance: {}, initial_token_b_balacne:{}, current_token_a_balance: {}, current_token_b_balance: {}",
        initial_token_a_balance, initial_token_b_balance, current_token_a_balance, current_token_b_balance
    );

    result
        .map_err(|e| {
            if !(e == SwapError::CalculationFailure.into()
                || e == TokenError::InsufficientFunds.into())
            {
                println!("{:?}", e);
                Err(e).unwrap()
            }
        })
        .ok();
}
