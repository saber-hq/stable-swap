//! Anchor-compatible SDK for the StableSwap program.
#![deny(missing_docs)]
#![deny(rustdoc::all)]
#![allow(rustdoc::missing_doc_code_examples)]
#![allow(clippy::nonstandard_macro_braces)]

use anchor_lang::solana_program::program_pack::Pack;
use anchor_lang::{prelude::*, solana_program};
use std::ops::Deref;

declare_id!("SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ");

/// Creates and invokes a [stable_swap_client::instruction::initialize] instruction.
///
/// # Arguments:
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
    solana_program::program::invoke_signed(
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
        ctx.signer_seeds,
    )
}

/// Creates and invokes a [stable_swap_client::instruction::swap] instruction.
///
/// # Arguments:
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
        ctx.signer_seeds,
    )
}

/// Creates and invokes a [stable_swap_client::instruction::withdraw_one] instruction.
///
/// # Arguments:
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
        ctx.signer_seeds,
    )
}

/// Creates and invokes a [stable_swap_client::instruction::withdraw] instruction.
///
/// # Arguments:
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
/// # Arguments:
///
/// * `target_amp` - Target amplification factor to ramp to.
/// * `stop_ramp_ts` - Timestamp when ramp up/down should stop.
pub fn ramp_a<'a, 'b, 'c, 'info>(
    ctx: CpiContext<'a, 'b, 'c, 'info, AdminUserContextWithClock<'info>>,
    target_amp: u64,
    stop_ramp_ts: i64,
) -> ProgramResult {
    let ix = stable_swap_client::instruction::ramp_a(
        ctx.accounts.admin_ctx.swap.key,
        ctx.accounts.admin_ctx.admin.key,
        target_amp,
        stop_ramp_ts,
    )?;
    solana_program::program::invoke_signed(&ix, &ctx.to_account_infos(), ctx.signer_seeds)
}

/// Creates and invokes a [stable_swap_client::instruction::stop_ramp_a] instruction.
pub fn stop_ramp_a<'a, 'b, 'c, 'info>(
    ctx: CpiContext<'a, 'b, 'c, 'info, AdminUserContextWithClock<'info>>,
) -> ProgramResult {
    let ix = stable_swap_client::instruction::stop_ramp_a(
        ctx.accounts.admin_ctx.swap.key,
        ctx.accounts.admin_ctx.admin.key,
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
    ctx: CpiContext<'a, 'b, 'c, 'info, AdminUserContextWithClock<'info>>,
) -> ProgramResult {
    let ix = stable_swap_client::instruction::apply_new_admin(
        ctx.accounts.admin_ctx.swap.key,
        ctx.accounts.admin_ctx.admin.key,
    )?;
    solana_program::program::invoke_signed(&ix, &ctx.to_account_infos(), ctx.signer_seeds)
}

/// Creates and invokes a [stable_swap_client::instruction::commit_new_admin] instruction.
/// # Arguments:
///
/// * `new_admin` - Public key of the new admin.
pub fn commit_new_admin<'a, 'b, 'c, 'info>(
    ctx: CpiContext<'a, 'b, 'c, 'info, CommitNewAdmin<'info>>,
) -> ProgramResult {
    let admin_ctx = &ctx.accounts.admin_with_clock.admin_ctx;
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
/// # Arguments:
///
/// * `fees` - new fees
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

// --------------------------------
// Instructions
// --------------------------------

/// Accounts for an [initialize] instruction.
#[derive(Accounts)]
pub struct Initialize<'info> {
    /// The swap.
    pub swap: AccountInfo<'info>,
    /// The authority of the swap.
    pub swap_authority: AccountInfo<'info>,
    /// The admin of the swap.
    pub admin: AccountInfo<'info>,
    /// The "A" token of the swap.
    pub token_a: InitToken<'info>,
    /// The "B" token of the swap.
    pub token_b: InitToken<'info>,
    /// The pool mint of the swap.
    pub pool_mint: AccountInfo<'info>,
    /// The output account for LP tokens.
    pub output_lp: AccountInfo<'info>,
    /// The spl_token program.
    pub token_program: AccountInfo<'info>,
}

/// Accounts for a [deposit] instruction.
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

/// Accounts for a [swap] instruction.
#[derive(Accounts)]
pub struct Swap<'info> {
    /// The context of the user.
    pub user: SwapUserContext<'info>,
    /// Accounts for input tokens.
    pub input: SwapToken<'info>,
    /// Accounts for output tokens.
    pub output: SwapOutput<'info>,
}

/// Accounts for a [withdraw_one] instruction.
#[derive(Accounts)]
pub struct WithdrawOne<'info> {
    /// The context of the user.
    pub user: SwapUserContext<'info>,
    /// The pool mint of the swap.
    pub pool_mint: AccountInfo<'info>,
    /// The input (user)'s LP token account
    pub input_lp: AccountInfo<'info>,
    /// The TokenAccount holding the swap's reserves of quote tokens; i.e., the token not being withdrawn.
    ///
    /// - If withdrawing token A, this is `swap_info.token_b.reserves`.
    /// - If withdrawing token B, this is `swap_info.token_a.reserves`.
    ///
    /// These reserves are needed for the withdraw_one instruction since the
    /// StableSwap "D" invariant requires both the base and quote reserves
    /// to determine how many tokens are paid out to users withdrawing from
    /// the swap.
    ///
    /// *For more info, see [stable_swap_client::state::SwapTokenInfo::reserves].*
    pub quote_reserves: AccountInfo<'info>,
    /// Accounts for output tokens.
    pub output: SwapOutput<'info>,
}

/// Accounts for a [withdraw] instruction.
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

/// Accounts for a [set_fee_account] instruction.
#[derive(Accounts)]
pub struct SetFeeAccount<'info> {
    /// The context of the admin user
    pub admin_ctx: AdminUserContext<'info>,
    /// The new token account for fees
    pub fee_account: AccountInfo<'info>,
}

/// Accounts for a [apply_new_admin].
#[derive(Accounts)]
pub struct CommitNewAdmin<'info> {
    /// The context of the admin user
    pub admin_with_clock: AdminUserContextWithClock<'info>,
    /// The account of the new admin
    pub new_admin: AccountInfo<'info>,
}

// --------------------------------
// Various accounts
// --------------------------------

/// Token accounts for initializing a [SwapInfo].
#[derive(Accounts)]
pub struct InitToken<'info> {
    /// The token account for the pool's reserves of this token.
    pub reserve: AccountInfo<'info>,
    /// The token account for the fees associated with the token.
    pub fees: AccountInfo<'info>,
    /// The mint of the token.
    pub mint: AccountInfo<'info>,
}

/// Token accounts for a [swap] instruction.
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

/// Accounts for an instruction that requires admin permission.
#[derive(Accounts)]
pub struct AdminUserContext<'info> {
    /// The public key of the admin account.
    /// **Note: must be a signer.**
    #[account(signer)]
    pub admin: AccountInfo<'info>,
    /// The swap.
    pub swap: AccountInfo<'info>,
}

/// Accounts for an instruction that requires admin permission with the clock.
#[derive(Accounts)]
pub struct AdminUserContextWithClock<'info> {
    /// The admin user context.
    pub admin_ctx: AdminUserContext<'info>,
    /// The clock
    pub clock: AccountInfo<'info>,
}

/// Swap information.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct SwapInfo(stable_swap_client::state::SwapInfo);

impl SwapInfo {
    /// The length, in bytes, of the packed representation
    pub const LEN: usize = stable_swap_client::state::SwapInfo::LEN;

    /// Computes the minimum rent exempt balance of a [SwapInfo].
    pub fn minimum_rent_exempt_balance() -> Result<u64, ProgramError> {
        Ok(Rent::get()?.minimum_balance(Self::LEN))
    }
}

impl Owner for SwapInfo {
    fn owner() -> Pubkey {
        ID
    }
}

impl Deref for SwapInfo {
    type Target = stable_swap_client::state::SwapInfo;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl anchor_lang::AccountSerialize for SwapInfo {
    fn try_serialize<W: std::io::Write>(&self, _writer: &mut W) -> Result<(), ProgramError> {
        // no-op
        Ok(())
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

/// The StableSwap program.
#[derive(Clone)]
pub struct StableSwap;

impl anchor_lang::AccountDeserialize for StableSwap {
    fn try_deserialize(buf: &mut &[u8]) -> Result<Self, ProgramError> {
        StableSwap::try_deserialize_unchecked(buf)
    }

    fn try_deserialize_unchecked(_buf: &mut &[u8]) -> Result<Self, ProgramError> {
        Ok(StableSwap)
    }
}

impl anchor_lang::Id for StableSwap {
    fn id() -> Pubkey {
        ID
    }
}
