//! Instruction builders and invokers for StableSwap instructions.

use crate::*;
use anchor_lang::{prelude::*, solana_program};

/// Creates and invokes a [stable_swap_client::instruction::initialize] instruction.
///
/// # Arguments
///
/// See [stable_swap_client::instruction::InitializeData].
///
/// * `nonce` - The nonce used to generate the swap_authority.
/// * `amp_factor` - Amplification factor.
/// * `fees` - Initial fees.
pub fn initialize<'a, 'b, 'c, 'info>(
    ctx: CpiContext<'a, 'b, 'c, 'info, Initialize<'info>>,
    nonce: u8,
    amp_factor: u64,
    fees: stable_swap_client::fees::Fees,
) -> ProgramResult {
    let ix = stable_swap_client::instruction::initialize(
        // token program ID is verified by the stable swap program
        ctx.accounts.token_program.key,
        ctx.accounts.swap.key,
        ctx.accounts.swap_authority.key,
        ctx.accounts.admin.key,
        ctx.accounts.token_a.fees.key,
        ctx.accounts.token_b.fees.key,
        ctx.accounts.token_a.mint.key,
        ctx.accounts.token_a.reserve.key,
        ctx.accounts.token_b.mint.key,
        ctx.accounts.token_b.reserve.key,
        ctx.accounts.pool_mint.key,
        ctx.accounts.output_lp.key,
        nonce,
        amp_factor,
        fees,
    )?;
    solana_program::program::invoke_signed(
        &ix,
        &[
            ctx.program,
            ctx.accounts.swap,
            ctx.accounts.swap_authority,
            ctx.accounts.admin,
            ctx.accounts.token_a.fees,
            ctx.accounts.token_b.fees,
            ctx.accounts.token_a.mint,
            ctx.accounts.token_a.reserve,
            ctx.accounts.token_b.mint,
            ctx.accounts.token_b.reserve,
            ctx.accounts.pool_mint,
            ctx.accounts.output_lp,
            ctx.accounts.token_program,
        ],
        ctx.signer_seeds,
    )
}

/// Creates and invokes a [stable_swap_client::instruction::deposit] instruction.
///
/// # Arguments
///
/// See [stable_swap_client::instruction::DepositData].
///
/// * `token_a_amount` - Amount of tokens of [`Deposit::input_a`] to deposit.
/// * `token_b_amount` - Amount of tokens of [`Deposit::input_b`] to deposit.
/// * `min_mint_amount` - Minimum amount of LP tokens to mint.
pub fn deposit<'a, 'b, 'c, 'info>(
    ctx: CpiContext<'a, 'b, 'c, 'info, Deposit<'info>>,
    token_a_amount: u64,
    token_b_amount: u64,
    min_mint_amount: u64,
) -> ProgramResult {
    let ix = stable_swap_client::instruction::deposit(
        // token program ID is verified by the stable swap program
        ctx.accounts.user.token_program.key,
        ctx.accounts.user.swap.key,
        ctx.accounts.user.swap_authority.key,
        ctx.accounts.user.user_authority.key,
        ctx.accounts.input_a.user.key,
        ctx.accounts.input_b.user.key,
        ctx.accounts.input_a.reserve.key,
        ctx.accounts.input_b.reserve.key,
        ctx.accounts.pool_mint.key,
        ctx.accounts.output_lp.key,
        token_a_amount,
        token_b_amount,
        min_mint_amount,
    )?;
    solana_program::program::invoke_signed(
        &ix,
        &[
            ctx.program,
            ctx.accounts.user.token_program,
            ctx.accounts.user.swap,
            ctx.accounts.user.swap_authority,
            ctx.accounts.user.user_authority,
            // deposit
            ctx.accounts.input_a.user,
            ctx.accounts.input_b.user,
            ctx.accounts.input_a.reserve,
            ctx.accounts.input_b.reserve,
            ctx.accounts.pool_mint,
            ctx.accounts.output_lp,
        ],
        ctx.signer_seeds,
    )
}

/// Creates and invokes a [stable_swap_client::instruction::swap] instruction.
///
/// # Arguments
///
/// See [stable_swap_client::instruction::SwapData].
///
/// * `amount_in` - Amount of [`Swap::input`] tokens to swap.
/// * `minimum_amount_out` - Minimum amount of [`Swap::output`] tokens to receive.
pub fn swap<'a, 'b, 'c, 'info>(
    ctx: CpiContext<'a, 'b, 'c, 'info, Swap<'info>>,
    amount_in: u64,
    minimum_amount_out: u64,
) -> ProgramResult {
    let ix = stable_swap_client::instruction::swap(
        ctx.accounts.user.token_program.key,
        ctx.accounts.user.swap.key,
        ctx.accounts.user.swap_authority.key,
        ctx.accounts.user.user_authority.key,
        ctx.accounts.input.user.key,
        ctx.accounts.input.reserve.key,
        ctx.accounts.output.user_token.reserve.key,
        ctx.accounts.output.user_token.user.key,
        ctx.accounts.output.fees.key,
        amount_in,
        minimum_amount_out,
    )?;
    solana_program::program::invoke_signed(
        &ix,
        &[
            ctx.program,
            ctx.accounts.user.token_program,
            ctx.accounts.user.swap,
            ctx.accounts.user.swap_authority,
            ctx.accounts.user.user_authority,
            // swap
            ctx.accounts.input.user,
            ctx.accounts.input.reserve,
            ctx.accounts.output.user_token.reserve,
            ctx.accounts.output.user_token.user,
            ctx.accounts.output.fees,
        ],
        ctx.signer_seeds,
    )
}

/// Creates and invokes a [stable_swap_client::instruction::withdraw_one] instruction.
///
/// # Arguments
///
/// See [stable_swap_client::instruction::WithdrawOneData].
///
/// * `pool_token_amount` - Amount of LP tokens to withdraw.
/// * `minimum_token_amount` - Minimum amount of tokens of [`WithdrawOne::output`] to withdraw.
pub fn withdraw_one<'a, 'b, 'c, 'info>(
    ctx: CpiContext<'a, 'b, 'c, 'info, WithdrawOne<'info>>,
    pool_token_amount: u64,
    minimum_token_amount: u64,
) -> ProgramResult {
    let ix = stable_swap_client::instruction::withdraw_one(
        ctx.accounts.user.token_program.key,
        ctx.accounts.user.swap.key,
        ctx.accounts.user.swap_authority.key,
        ctx.accounts.user.user_authority.key,
        ctx.accounts.pool_mint.key,
        ctx.accounts.input_lp.key,
        ctx.accounts.output.user_token.reserve.key,
        ctx.accounts.quote_reserves.key,
        ctx.accounts.output.user_token.user.key,
        ctx.accounts.output.fees.key,
        pool_token_amount,
        minimum_token_amount,
    )?;
    solana_program::program::invoke_signed(
        &ix,
        &[
            ctx.program,
            ctx.accounts.user.token_program,
            ctx.accounts.user.swap,
            ctx.accounts.user.swap_authority,
            ctx.accounts.user.user_authority,
            // withdraw_one
            ctx.accounts.pool_mint,
            ctx.accounts.input_lp,
            ctx.accounts.output.user_token.reserve,
            ctx.accounts.quote_reserves,
            ctx.accounts.output.user_token.user,
            ctx.accounts.output.fees,
        ],
        ctx.signer_seeds,
    )
}

/// Creates and invokes a [stable_swap_client::instruction::withdraw] instruction.
///
/// # Arguments
///
/// See [stable_swap_client::instruction::WithdrawData].
///
/// * `pool_token_amount` - Amount of LP tokens to withdraw.
/// * `minimum_token_a_amount` - Minimum amount of tokens of [`Withdraw::output_a`] to withdraw.
/// * `minimum_token_b_amount` - Minimum amount of tokens of [`Withdraw::output_b`] to withdraw.
pub fn withdraw<'a, 'b, 'c, 'info>(
    ctx: CpiContext<'a, 'b, 'c, 'info, Withdraw<'info>>,
    pool_token_amount: u64,
    minimum_token_a_amount: u64,
    minimum_token_b_amount: u64,
) -> ProgramResult {
    let ix = stable_swap_client::instruction::withdraw(
        // token program ID is verified by the stable swap program
        ctx.accounts.user.token_program.key,
        ctx.accounts.user.swap.key,
        ctx.accounts.user.swap_authority.key,
        ctx.accounts.user.user_authority.key,
        // accounts
        ctx.accounts.pool_mint.key,
        ctx.accounts.input_lp.key,
        ctx.accounts.output_a.user_token.reserve.key,
        ctx.accounts.output_b.user_token.reserve.key,
        ctx.accounts.output_a.user_token.user.key,
        ctx.accounts.output_b.user_token.user.key,
        ctx.accounts.output_a.fees.key,
        ctx.accounts.output_b.fees.key,
        pool_token_amount,
        minimum_token_a_amount,
        minimum_token_b_amount,
    )?;
    solana_program::program::invoke_signed(&ix, &ctx.to_account_infos(), ctx.signer_seeds)
}

/// Creates and invokes a [stable_swap_client::instruction::ramp_a] instruction.
///
/// # Arguments
///
/// See [stable_swap_client::instruction::RampAData].
///
/// * `target_amp` - Target amplification factor to ramp to.
/// * `stop_ramp_ts` - Timestamp when ramp up/down should stop.
pub fn ramp_a<'a, 'b, 'c, 'info>(
    ctx: CpiContext<'a, 'b, 'c, 'info, AdminUserContext<'info>>,
    target_amp: u64,
    stop_ramp_ts: i64,
) -> ProgramResult {
    let ix = stable_swap_client::instruction::ramp_a(
        ctx.accounts.swap.key,
        ctx.accounts.admin.key,
        target_amp,
        stop_ramp_ts,
    )?;
    solana_program::program::invoke_signed(&ix, &ctx.to_account_infos(), ctx.signer_seeds)
}

/// Creates and invokes a [stable_swap_client::instruction::stop_ramp_a] instruction.
pub fn stop_ramp_a<'a, 'b, 'c, 'info>(
    ctx: CpiContext<'a, 'b, 'c, 'info, AdminUserContext<'info>>,
) -> ProgramResult {
    let ix = stable_swap_client::instruction::stop_ramp_a(
        ctx.accounts.swap.key,
        ctx.accounts.admin.key,
    )?;
    solana_program::program::invoke_signed(&ix, &ctx.to_account_infos(), ctx.signer_seeds)
}

/// Creates and invokes a [stable_swap_client::instruction::pause] instruction.
pub fn pause<'a, 'b, 'c, 'info>(
    ctx: CpiContext<'a, 'b, 'c, 'info, AdminUserContext<'info>>,
) -> ProgramResult {
    let ix = stable_swap_client::instruction::pause(ctx.accounts.swap.key, ctx.accounts.admin.key)?;
    solana_program::program::invoke_signed(&ix, &ctx.to_account_infos(), ctx.signer_seeds)
}

/// Creates and invokes a [stable_swap_client::instruction::unpause] instruction.
pub fn unpause<'a, 'b, 'c, 'info>(
    ctx: CpiContext<'a, 'b, 'c, 'info, AdminUserContext<'info>>,
) -> ProgramResult {
    let ix =
        stable_swap_client::instruction::unpause(ctx.accounts.swap.key, ctx.accounts.admin.key)?;
    solana_program::program::invoke_signed(&ix, &ctx.to_account_infos(), ctx.signer_seeds)
}

/// Creates and invokes a [stable_swap_client::instruction::apply_new_admin] instruction.
pub fn apply_new_admin<'a, 'b, 'c, 'info>(
    ctx: CpiContext<'a, 'b, 'c, 'info, AdminUserContext<'info>>,
) -> ProgramResult {
    let ix = stable_swap_client::instruction::apply_new_admin(
        ctx.accounts.swap.key,
        ctx.accounts.admin.key,
    )?;
    solana_program::program::invoke_signed(&ix, &ctx.to_account_infos(), ctx.signer_seeds)
}

/// Creates and invokes a [stable_swap_client::instruction::commit_new_admin] instruction
///
/// # Arguments
///
/// * `new_admin` - Public key of the new admin.
pub fn commit_new_admin<'a, 'b, 'c, 'info>(
    ctx: CpiContext<'a, 'b, 'c, 'info, CommitNewAdmin<'info>>,
) -> ProgramResult {
    let admin_ctx = &ctx.accounts.admin_ctx;
    let ix = stable_swap_client::instruction::commit_new_admin(
        admin_ctx.swap.key,
        admin_ctx.admin.key,
        ctx.accounts.new_admin.key,
    )?;
    solana_program::program::invoke_signed(&ix, &ctx.to_account_infos(), ctx.signer_seeds)
}

/// Creates and invokes a [stable_swap_client::instruction::set_fee_account] instruction.
pub fn set_fee_account<'a, 'b, 'c, 'info>(
    ctx: CpiContext<'a, 'b, 'c, 'info, SetFeeAccount<'info>>,
) -> ProgramResult {
    let ix = stable_swap_client::instruction::set_fee_account(
        ctx.accounts.admin_ctx.swap.key,
        ctx.accounts.admin_ctx.admin.key,
        ctx.accounts.fee_account.to_account_info().key,
    )?;
    solana_program::program::invoke_signed(&ix, &ctx.to_account_infos(), ctx.signer_seeds)
}

/// Creates and invokes a [stable_swap_client::instruction::set_new_fees] instruction.
///
/// # Arguments
///
/// * `fees` - new [`stable_swap_client::fees::Fees`].
pub fn set_new_fees<'a, 'b, 'c, 'info>(
    ctx: CpiContext<'a, 'b, 'c, 'info, AdminUserContext<'info>>,
    fees: stable_swap_client::fees::Fees,
) -> ProgramResult {
    let ix = stable_swap_client::instruction::set_new_fees(
        ctx.accounts.swap.key,
        ctx.accounts.admin.key,
        fees,
    )?;
    solana_program::program::invoke_signed(&ix, &ctx.to_account_infos(), ctx.signer_seeds)
}
