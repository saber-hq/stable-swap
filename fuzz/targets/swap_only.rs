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
    // error::SwapError,
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
    let trade_fee_numerator = 0;
    let trade_fee_denominator = 10000;
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
        stable_swap.create_token_b_account(user_account.clone(), INITIAL_SWAP_TOKEN_B_AMOUNT);
    let mut pool_token_account = stable_swap.create_pool_account(user_account.clone());

    // to ensure that we never create or remove base tokens
    let before_total_token_a = INITIAL_SWAP_TOKEN_A_AMOUNT;
    let before_total_token_b = INITIAL_SWAP_TOKEN_B_AMOUNT;

    for args in argv {
        run_swap(
            &args,
            &mut stable_swap,
            &mut user_account,
            &mut token_a_account,
            &mut token_b_account,
            &mut pool_token_account,
        )
    }
}

fn run_swap(
    args: &SwapArgs,
    stable_swap: &mut NativeStableSwap,
    user_account: &mut NativeAccountData,
    token_a_account: &mut NativeAccountData,
    token_b_account: &mut NativeAccountData,
    pool_account: &mut NativeAccountData,
) {
    if *VERBOSE >= 3 {
        println!("Current swap args: {:#?}", args);
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

    let SwapArgs {
        trade_direction,
        instruction_data,
    } = args;

    let result = match trade_direction {
        TradeDirection::AtoB => stable_swap.swap_a_to_b(
            Utc::now().timestamp(),
            user_account,
            token_a_account,
            token_b_account,
            *instruction_data,
        ),
        TradeDirection::BtoA => stable_swap.swap_b_to_a(
            Utc::now().timestamp(),
            user_account,
            token_a_account,
            token_b_account,
            *instruction_data,
        ),
    };

    // let current_mint_supply = get_mint_supply(&stable_swap.pool_mint_account);
    // let current_swap_state = get_swap_state(&stable_swap.swap_account);
    // let current_token_a_balance = get_token_balance(&stable_swap.token_a_account);
    // let current_token_b_balance = get_token_balance(&stable_swap.token_b_account);

    // let current_invariant = StableSwap::new(
    //     current_swap_state.initial_amp_factor,
    //     current_swap_state.target_amp_factor,
    //     Utc::now().timestamp(),
    //     current_swap_state.start_ramp_ts,
    //     current_swap_state.stop_ramp_ts,
    // );

    // // Assert virtual price does not decrease
    // let initial_amp_factor = initial_invariant.compute_amp_factor().unwrap();
    // let d_0 = initial_invariant
    //     .compute_d(initial_token_a_balance, initial_token_b_balance)
    //     .unwrap();
    // let current_amp_factor = current_invariant.compute_amp_factor().unwrap();
    // let d_1 = current_invariant
    //     .compute_d(current_token_a_balance, current_token_b_balance)
    //     .unwrap();
    // assert!(
    //     d_1 / current_mint_supply >= d_0 / initial_mint_supply,
    //     "d0: {}, initial_lp_supply: {}, initial_A: {}, initial_a_balance: {}, initial_b_balance: {}\n \
    //      d1: {}, current_lp_supply: {}, current_A: {}, current_a_balance: {}, current_b_balance: {}",
    //     d_0,
    //     initial_mint_supply,
    //     initial_amp_factor,
    //     initial_token_a_balance,
    //     initial_token_b_balance,
    //     d_1,
    //     current_mint_supply,
    //     current_amp_factor,
    //     current_token_a_balance,
    //     current_token_b_balance,
    // );

    // // XXX: This is soo ugly, refactor this!
    // match action {
    //     Action::RampA {
    //         instruction_data: _,
    //     } => {
    //         result
    //             .map_err(|e| {
    //                 if !(e == SwapError::InvalidInput.into()
    //                     || e == SwapError::CalculationFailure.into()
    //                     || e == SwapError::RampLocked.into()
    //                     || e == SwapError::InsufficientRampTime.into())
    //                 {
    //                     Err(e).unwrap()
    //                 }
    //             })
    //             .ok();
    //     }
    //     _ => {
    //         result
    //             .map_err(|e| {
    //                 if !(e == SwapError::CalculationFailure.into()
    //                     || e == SwapError::ConversionFailure.into()
    //                     || e == SwapError::ExceededSlippage.into()
    //                     || e == TokenError::InsufficientFunds.into()
    //                     || e == TokenError::OwnerMismatch.into())
    //                 {
    //                     Err(e).unwrap()
    //                 }
    //             })
    //             .ok();
    //     }
    // }
}
