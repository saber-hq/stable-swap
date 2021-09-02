//! Anchor-compatible SDK for the StableSwap program.
#![deny(missing_docs)]
#![allow(clippy::nonstandard_macro_braces)]

use std::ops::Deref;

use anchor_lang::prelude::*;
use anchor_lang::solana_program;
use anchor_lang::solana_program::account_info::AccountInfo;
use anchor_lang::solana_program::entrypoint::ProgramResult;
use anchor_lang::solana_program::program_pack::Pack;
use anchor_lang::{Accounts, CpiContext};

/// Creates and invokes a [stable_swap_client::instruction::deposit] instruction.
///
/// # Arguments:
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
    solana_program::program::invoke(
        &ix,
        &[
            ctx.program,
            ctx.accounts.user.clock,
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
    )
}

/// Creates a 'swap' instruction.
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
    solana_program::program::invoke(
        &ix,
        &[
            ctx.program,
            ctx.accounts.user.clock,
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
    )
}

/// Creates a 'withdraw_one' instruction.
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
    solana_program::program::invoke(
        &ix,
        &[
            ctx.program,
            ctx.accounts.user.clock,
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
    )
}

/// Creates a 'withdraw' instruction.
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
    solana_program::program::invoke(&ix, &ctx.to_account_infos())
}

/// --------------------------------
/// Instructions
/// --------------------------------

/// Accounts for a 'deposit' instruction.
#[derive(Accounts)]
pub struct Deposit<'info> {
    /// The context of the user.
    pub user: SwapUserContext<'info>,
    /// The "A" token of the swap.
    pub input_a: SwapToken<'info>,
    /// The "B" token of the swap.
    pub input_b: SwapToken<'info>,
    /// The pool mint of the swap.
    pub pool_mint: AccountInfo<'info>,
    /// The output account for LP tokens.
    pub output_lp: AccountInfo<'info>,
}

/// Accounts for a 'swap' instruction.
#[derive(Accounts)]
pub struct Swap<'info> {
    /// The context of the user.
    pub user: SwapUserContext<'info>,
    /// Accounts for input tokens.
    pub input: SwapToken<'info>,
    /// Accounts for output tokens.
    pub output: SwapOutput<'info>,
}

/// Accounts for a 'withdraw_one' instruction.
#[derive(Accounts)]
pub struct WithdrawOne<'info> {
    /// The context of the user.
    pub user: SwapUserContext<'info>,
    /// The pool mint of the swap.
    pub pool_mint: AccountInfo<'info>,
    /// The input (user)'s LP token account
    pub input_lp: AccountInfo<'info>,
    /// Accounts for quote tokens (the token not being withdrawn).
    pub quote_reserves: AccountInfo<'info>,
    /// Accounts for output tokens.
    pub output: SwapOutput<'info>,
}

/// Accounts for a 'withdraw' instruction.
#[derive(Accounts)]
pub struct Withdraw<'info> {
    /// The context of the user.
    pub user: SwapUserContext<'info>,
    /// The input account for LP tokens.
    pub input_lp: AccountInfo<'info>,
    /// The pool mint of the swap.
    pub pool_mint: AccountInfo<'info>,
    /// The "A" token of the swap.
    pub output_a: SwapOutput<'info>,
    /// The "B" token of the swap.
    pub output_b: SwapOutput<'info>,
}

/// --------------------------------
/// Various accounts
/// --------------------------------

/// Token accounts for a 'swap' instruction.
#[derive(Accounts)]
pub struct SwapToken<'info> {
    /// The token account associated with the user.
    pub user: AccountInfo<'info>,
    /// The token account for the pool's reserves of this token.
    pub reserve: AccountInfo<'info>,
}

/// Token accounts for the output of a StableSwap instruction.
#[derive(Accounts)]
pub struct SwapOutput<'info> {
    /// The token accounts of the user and the token.
    pub user_token: SwapToken<'info>,
    /// The token account for the fees associated with the token.
    pub fees: AccountInfo<'info>,
}

/// Accounts for an instruction that interacts with the swap.
#[derive(Accounts)]
pub struct SwapUserContext<'info> {
    /// The spl_token program.
    pub token_program: AccountInfo<'info>,
    /// The authority of the swap.
    pub swap_authority: AccountInfo<'info>,
    /// The authority of the user.
    pub user_authority: AccountInfo<'info>,
    /// The swap.
    pub swap: AccountInfo<'info>,
    /// The clock
    pub clock: AccountInfo<'info>,
}

/// Swap information.
#[derive(Clone)]
pub struct SwapInfo(stable_swap_client::state::SwapInfo);

impl Deref for SwapInfo {
    type Target = stable_swap_client::state::SwapInfo;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl anchor_lang::AccountDeserialize for SwapInfo {
    fn try_deserialize(buf: &mut &[u8]) -> Result<Self, ProgramError> {
        SwapInfo::try_deserialize_unchecked(buf)
    }

    fn try_deserialize_unchecked(buf: &mut &[u8]) -> Result<Self, ProgramError> {
        stable_swap_client::state::SwapInfo::unpack(buf).map(SwapInfo)
    }
}
