//! Instruction types

#![allow(clippy::too_many_arguments)]

use crate::error::SwapError;
use crate::fees::Fees;
use solana_sdk::{
    instruction::{AccountMeta, Instruction},
    program_error::ProgramError,
    program_pack::Pack,
    pubkey::Pubkey,
    sysvar::clock,
};
use std::convert::TryInto;
use std::mem::size_of;

/// Initialize instruction data
#[repr(C)]
#[derive(Debug, PartialEq)]
pub struct InitializeData {
    /// Nonce used to create valid program address
    pub nonce: u8,
    /// Amplification coefficient (A)
    pub amp_factor: u64,
    /// Fees
    pub fees: Fees,
}

/// Swap instruction data
#[repr(C)]
#[derive(Clone, Debug, PartialEq)]
pub struct SwapData {
    /// SOURCE amount to transfer, output to DESTINATION is based on the exchange rate
    pub amount_in: u64,
    /// Minimum amount of DESTINATION token to output, prevents excessive slippage
    pub minimum_amount_out: u64,
}

/// Deposit instruction data
#[repr(C)]
#[derive(Clone, Debug, PartialEq)]
pub struct DepositData {
    /// Token A amount to deposit
    pub token_a_amount: u64,
    /// Token B amount to deposit
    pub token_b_amount: u64,
    /// Minimum LP tokens to mint, prevents excessive slippage
    pub min_mint_amount: u64,
}

/// Withdraw instruction data
#[repr(C)]
#[derive(Clone, Debug, PartialEq)]
pub struct WithdrawData {
    /// Amount of pool tokens to burn. User receives an output of token a
    /// and b based on the percentage of the pool tokens that are returned.
    pub pool_token_amount: u64,
    /// Minimum amount of token A to receive, prevents excessive slippage
    pub minimum_token_a_amount: u64,
    /// Minimum amount of token B to receive, prevents excessive slippage
    pub minimum_token_b_amount: u64,
}

/// Withdraw instruction data
#[repr(C)]
#[derive(Clone, Debug, PartialEq)]
pub struct WithdrawOneData {
    /// Amount of pool tokens to burn. User receives an output of token a
    /// or b based on the percentage of the pool tokens that are returned.
    pub pool_token_amount: u64,
    /// Minimum amount of token A or B to receive, prevents excessive slippage
    pub minimum_token_amount: u64,
}

/// RampA instruction data
#[repr(C)]
#[derive(Clone, Debug, PartialEq)]
pub struct RampAData {
    /// Amp. Coefficient to ramp to
    pub target_amp: u64,
    /// Unix timestamp to stop ramp
    pub stop_ramp_ts: i64,
}

/// Admin only instructions.
#[repr(C)]
#[derive(Debug, PartialEq)]
pub enum AdminInstruction {
    /// TODO: Docs
    RampA(RampAData),
    /// TODO: Docs
    StopRampA,
    /// TODO: Docs
    Pause,
    /// TODO: Docs
    Unpause,
    /// TODO: Docs
    SetFeeAccountA,
    /// TODO: Docs
    SetFeeAccountB,
    /// TODO: Docs
    ApplyNewAdmin,
    /// TODO: Docs
    CommitNewAdmin,
    /// TODO: Docs
    RevertNewAdmin,
    /// TODO: Docs
    ApplyNewFees,
    /// TODO: Docs
    CommitNewFees(Fees),
    /// TODO: Docs
    RevertNewFees,
}

impl AdminInstruction {
    /// Unpacks a byte buffer into a [AdminInstruction](enum.AdminInstruction.html).
    pub fn unpack(input: &[u8]) -> Result<Option<Self>, ProgramError> {
        let (&tag, rest) = input.split_first().ok_or(SwapError::InvalidInstruction)?;
        Ok(match tag {
            100 => {
                let (target_amp, rest) = unpack_u64(rest)?;
                let (stop_ramp_ts, _rest) = unpack_i64(rest)?;
                Some(Self::RampA(RampAData {
                    target_amp,
                    stop_ramp_ts,
                }))
            }
            101 => Some(Self::StopRampA),
            102 => Some(Self::Pause),
            103 => Some(Self::Unpause),
            104 => Some(Self::SetFeeAccountA),
            105 => Some(Self::SetFeeAccountB),
            106 => Some(Self::ApplyNewAdmin),
            107 => Some(Self::CommitNewAdmin),
            108 => Some(Self::RevertNewAdmin),
            109 => Some(Self::ApplyNewFees),
            110 => {
                let fees = Fees::unpack_unchecked(rest)?;
                Some(Self::CommitNewFees(fees))
            }
            111 => Some(Self::RevertNewFees),
            _ => None,
        })
    }

    /// Packs a [AdminInstruction](enum.AdminInstruciton.html) into a byte buffer.
    pub fn pack(&self) -> Vec<u8> {
        let mut buf = Vec::with_capacity(size_of::<Self>());
        match *self {
            Self::RampA(RampAData {
                target_amp,
                stop_ramp_ts,
            }) => {
                buf.push(100);
                buf.extend_from_slice(&target_amp.to_le_bytes());
                buf.extend_from_slice(&stop_ramp_ts.to_le_bytes());
            }
            Self::StopRampA => buf.push(101),
            Self::Pause => buf.push(102),
            Self::Unpause => buf.push(103),
            Self::SetFeeAccountA => buf.push(104),
            Self::SetFeeAccountB => buf.push(105),
            Self::ApplyNewAdmin => buf.push(106),
            Self::CommitNewAdmin => buf.push(107),
            Self::RevertNewAdmin => buf.push(108),
            Self::ApplyNewFees => buf.push(109),
            Self::CommitNewFees(fees) => {
                buf.push(110);
                let mut fees_slice = [0u8; Fees::LEN];
                Pack::pack_into_slice(&fees, &mut fees_slice[..]);
                buf.extend_from_slice(&fees_slice);
            }
            Self::RevertNewFees => buf.push(111),
        }
        buf
    }
}

/// Creates a 'ramp_a' instruction
pub fn ramp_a(
    program_id: &Pubkey,
    swap_pubkey: &Pubkey,
    authority_pubkey: &Pubkey,
    admin_pubkey: &Pubkey,
    target_amp: u64,
    stop_ramp_ts: i64,
) -> Result<Instruction, ProgramError> {
    let data = AdminInstruction::RampA(RampAData {
        target_amp,
        stop_ramp_ts,
    })
    .pack();

    let accounts = vec![
        AccountMeta::new(*swap_pubkey, true),
        AccountMeta::new(*authority_pubkey, false),
        AccountMeta::new(*admin_pubkey, true),
        AccountMeta::new(clock::id(), false),
    ];

    Ok(Instruction {
        program_id: *program_id,
        accounts,
        data,
    })
}

/// Creates a 'stop_ramp_a' instruction
pub fn stop_ramp_a(
    program_id: &Pubkey,
    swap_pubkey: &Pubkey,
    authority_pubkey: &Pubkey,
    admin_pubkey: &Pubkey,
) -> Result<Instruction, ProgramError> {
    let data = AdminInstruction::StopRampA.pack();

    let accounts = vec![
        AccountMeta::new(*swap_pubkey, true),
        AccountMeta::new(*authority_pubkey, false),
        AccountMeta::new(*admin_pubkey, true),
        AccountMeta::new(clock::id(), false),
    ];

    Ok(Instruction {
        program_id: *program_id,
        accounts,
        data,
    })
}

/// Creates a 'set_fee_account_a' instruction
pub fn set_fee_account_a(
    program_id: &Pubkey,
    swap_pubkey: &Pubkey,
    authority_pubkey: &Pubkey,
    admin_pubkey: &Pubkey,
    new_fee_account_a_pubkey: &Pubkey,
) -> Result<Instruction, ProgramError> {
    let data = AdminInstruction::SetFeeAccountA.pack();

    let accounts = vec![
        AccountMeta::new(*swap_pubkey, true),
        AccountMeta::new(*authority_pubkey, false),
        AccountMeta::new(*admin_pubkey, true),
        AccountMeta::new(*new_fee_account_a_pubkey, false),
    ];

    Ok(Instruction {
        program_id: *program_id,
        accounts,
        data,
    })
}

/// Creates a 'set_fee_account_b' instruction
pub fn set_fee_account_b(
    program_id: &Pubkey,
    swap_pubkey: &Pubkey,
    authority_pubkey: &Pubkey,
    admin_pubkey: &Pubkey,
    new_fee_account_b_pubkey: &Pubkey,
) -> Result<Instruction, ProgramError> {
    let data = AdminInstruction::SetFeeAccountB.pack();

    let accounts = vec![
        AccountMeta::new(*swap_pubkey, true),
        AccountMeta::new(*authority_pubkey, false),
        AccountMeta::new(*admin_pubkey, true),
        AccountMeta::new(*new_fee_account_b_pubkey, false),
    ];

    Ok(Instruction {
        program_id: *program_id,
        accounts,
        data,
    })
}

/// Instructions supported by the SwapInfo program.
#[repr(C)]
#[derive(Debug, PartialEq)]
pub enum SwapInstruction {
    ///   Initializes a new SwapInfo.
    ///
    ///   0. `[writable, signer]` New Token-swap to create.
    ///   1. `[]` $authority derived from `create_program_address(&[Token-swap account])`
    ///   2. `[]` admin Account.
    ///   3. `[]` admin_fee_a admin fee Account for token_a.
    ///   4. `[]` admin_fee_b admin fee Account for token_b.
    ///   5. `[]` token_a Account. Must be non zero, owned by $authority.
    ///   6. `[]` token_b Account. Must be non zero, owned by $authority.
    ///   7. `[writable]` Pool Token Mint. Must be empty, owned by $authority.
    Initialize(InitializeData),

    ///   Swap the tokens in the pool.
    ///
    ///   0. `[]` Token-swap
    ///   1. `[]` $authority
    ///   2. `[writable]` token_(A|B) SOURCE Account, amount is transferable by $authority,
    ///   3. `[writable]` token_(A|B) Base Account to swap INTO.  Must be the SOURCE token.
    ///   4. `[writable]` token_(A|B) Base Account to swap FROM.  Must be the DESTINATION token.
    ///   5. `[writable]` token_(A|B) DESTINATION Account assigned to USER as the owner.
    ///   6. `[writable]` token_(A|B) admin fee Account. Must have same mint as DESTINATION token.
    ///   7. `[]` Token program id
    ///   8. `[]` Clock sysvar
    Swap(SwapData),

    ///   Deposit some tokens into the pool.  The output is a "pool" token representing ownership
    ///   into the pool. Inputs are converted to the current ratio.
    ///
    ///   0. `[]` Token-swap
    ///   1. `[]` $authority
    ///   2. `[writable]` token_a $authority can transfer amount,
    ///   3. `[writable]` token_b $authority can transfer amount,
    ///   4. `[writable]` token_a Base Account to deposit into.
    ///   5. `[writable]` token_b Base Account to deposit into.
    ///   6. `[writable]` Pool MINT account, $authority is the owner.
    ///   7. `[writable]` Pool Account to deposit the generated tokens, user is the owner.
    ///   8. `[]` Token program id
    ///   9. `[]` Clock sysvar
    Deposit(DepositData),

    ///   Withdraw tokens from the pool at the current ratio.
    ///
    ///   0. `[]` Token-swap
    ///   1. `[]` $authority
    ///   2. `[writable]` Pool mint account, $authority is the owner
    ///   3. `[writable]` SOURCE Pool account, amount is transferable by $authority.
    ///   4. `[writable]` token_a Swap Account to withdraw FROM.
    ///   5. `[writable]` token_b Swap Account to withdraw FROM.
    ///   6. `[writable]` token_a user Account to credit.
    ///   7. `[writable]` token_b user Account to credit.
    ///   8. `[writable]` admin_fee_a admin fee Account for token_a.
    ///   9. `[writable]` admin_fee_b admin fee Account for token_b.
    ///   10. `[]` Token program id
    Withdraw(WithdrawData),

    ///   Withdraw one token from the pool at the current ratio.
    ///
    ///   0. `[]` Token-swap
    ///   1. `[]` $authority
    ///   2. `[writable]` Pool mint account, $authority is the owner
    ///   3. `[writable]` SOURCE Pool account, amount is transferable by $authority.
    ///   4. `[writable]` token_(A|B) BASE token Swap Account to withdraw FROM.
    ///   5. `[writable]` token_(A|B) QUOTE token Swap Account to exchange to base token.
    ///   6. `[writable]` token_(A|B) BASE token user Account to credit.
    ///   7. `[writable]` token_(A|B) admin fee Account. Must have same mint as BASE token.
    ///   8. `[]` Token program id
    ///   9. `[]` Clock sysvar
    WithdrawOne(WithdrawOneData),
}

impl SwapInstruction {
    /// Unpacks a byte buffer into a [SwapInstruction](enum.SwapInstruction.html).
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        let (&tag, rest) = input.split_first().ok_or(SwapError::InvalidInstruction)?;
        Ok(match tag {
            0 => {
                let (&nonce, rest) = rest.split_first().ok_or(SwapError::InvalidInstruction)?;
                let (amp_factor, rest) = unpack_u64(rest)?;
                let fees = Fees::unpack_unchecked(rest)?;
                Self::Initialize(InitializeData {
                    nonce,
                    amp_factor,
                    fees,
                })
            }
            1 => {
                let (amount_in, rest) = unpack_u64(rest)?;
                let (minimum_amount_out, _rest) = unpack_u64(rest)?;
                Self::Swap(SwapData {
                    amount_in,
                    minimum_amount_out,
                })
            }
            2 => {
                let (token_a_amount, rest) = unpack_u64(rest)?;
                let (token_b_amount, rest) = unpack_u64(rest)?;
                let (min_mint_amount, _rest) = unpack_u64(rest)?;
                Self::Deposit(DepositData {
                    token_a_amount,
                    token_b_amount,
                    min_mint_amount,
                })
            }
            3 => {
                let (pool_token_amount, rest) = unpack_u64(rest)?;
                let (minimum_token_a_amount, rest) = unpack_u64(rest)?;
                let (minimum_token_b_amount, _rest) = unpack_u64(rest)?;
                Self::Withdraw(WithdrawData {
                    pool_token_amount,
                    minimum_token_a_amount,
                    minimum_token_b_amount,
                })
            }
            4 => {
                let (pool_token_amount, rest) = unpack_u64(rest)?;
                let (minimum_token_amount, _rest) = unpack_u64(rest)?;
                Self::WithdrawOne(WithdrawOneData {
                    pool_token_amount,
                    minimum_token_amount,
                })
            }
            _ => return Err(SwapError::InvalidInstruction.into()),
        })
    }

    /// Packs a [SwapInstruction](enum.SwapInstruction.html) into a byte buffer.
    pub fn pack(&self) -> Vec<u8> {
        let mut buf = Vec::with_capacity(size_of::<Self>());
        match *self {
            Self::Initialize(InitializeData {
                nonce,
                amp_factor,
                fees,
            }) => {
                buf.push(0);
                buf.push(nonce);
                buf.extend_from_slice(&amp_factor.to_le_bytes());
                let mut fees_slice = [0u8; Fees::LEN];
                Pack::pack_into_slice(&fees, &mut fees_slice[..]);
                buf.extend_from_slice(&fees_slice);
            }
            Self::Swap(SwapData {
                amount_in,
                minimum_amount_out,
            }) => {
                buf.push(1);
                buf.extend_from_slice(&amount_in.to_le_bytes());
                buf.extend_from_slice(&minimum_amount_out.to_le_bytes());
            }
            Self::Deposit(DepositData {
                token_a_amount,
                token_b_amount,
                min_mint_amount,
            }) => {
                buf.push(2);
                buf.extend_from_slice(&token_a_amount.to_le_bytes());
                buf.extend_from_slice(&token_b_amount.to_le_bytes());
                buf.extend_from_slice(&min_mint_amount.to_le_bytes());
            }
            Self::Withdraw(WithdrawData {
                pool_token_amount,
                minimum_token_a_amount,
                minimum_token_b_amount,
            }) => {
                buf.push(3);
                buf.extend_from_slice(&pool_token_amount.to_le_bytes());
                buf.extend_from_slice(&minimum_token_a_amount.to_le_bytes());
                buf.extend_from_slice(&minimum_token_b_amount.to_le_bytes());
            }
            Self::WithdrawOne(WithdrawOneData {
                pool_token_amount,
                minimum_token_amount,
            }) => {
                buf.push(4);
                buf.extend_from_slice(&pool_token_amount.to_le_bytes());
                buf.extend_from_slice(&minimum_token_amount.to_le_bytes());
            }
        }
        buf
    }
}

/// Creates an 'initialize' instruction.
pub fn initialize(
    program_id: &Pubkey,
    pool_token_program_id: &Pubkey, // Token program used for the pool token
    swap_pubkey: &Pubkey,
    authority_pubkey: &Pubkey,
    admin_pubkey: &Pubkey,
    admin_fee_a_pubkey: &Pubkey,
    admin_fee_b_pubkey: &Pubkey,
    token_a_pubkey: &Pubkey,
    token_b_pubkey: &Pubkey,
    pool_token_pubkey: &Pubkey,
    destination_pubkey: &Pubkey, // Desintation to mint pool tokens for bootstrapper
    nonce: u8,
    amp_factor: u64,
    fees: Fees,
) -> Result<Instruction, ProgramError> {
    let data = SwapInstruction::Initialize(InitializeData {
        nonce,
        amp_factor,
        fees,
    })
    .pack();

    let accounts = vec![
        AccountMeta::new(*swap_pubkey, true),
        AccountMeta::new(*authority_pubkey, false),
        AccountMeta::new(*admin_pubkey, false),
        AccountMeta::new(*admin_fee_a_pubkey, false),
        AccountMeta::new(*admin_fee_b_pubkey, false),
        AccountMeta::new(*token_a_pubkey, false),
        AccountMeta::new(*token_b_pubkey, false),
        AccountMeta::new(*pool_token_pubkey, false),
        AccountMeta::new(*destination_pubkey, false),
        AccountMeta::new(*pool_token_program_id, false),
    ];

    Ok(Instruction {
        program_id: *program_id,
        accounts,
        data,
    })
}

/// Creates a 'deposit' instruction.
pub fn deposit(
    program_id: &Pubkey,
    token_program_id: &Pubkey,
    swap_pubkey: &Pubkey,
    authority_pubkey: &Pubkey,
    deposit_token_a_pubkey: &Pubkey,
    deposit_token_b_pubkey: &Pubkey,
    swap_token_a_pubkey: &Pubkey,
    swap_token_b_pubkey: &Pubkey,
    pool_mint_pubkey: &Pubkey,
    destination_pubkey: &Pubkey,
    token_a_amount: u64,
    token_b_amount: u64,
    min_mint_amount: u64,
) -> Result<Instruction, ProgramError> {
    let data = SwapInstruction::Deposit(DepositData {
        token_a_amount,
        token_b_amount,
        min_mint_amount,
    })
    .pack();

    let accounts = vec![
        AccountMeta::new(*swap_pubkey, false),
        AccountMeta::new(*authority_pubkey, false),
        AccountMeta::new(*deposit_token_a_pubkey, false),
        AccountMeta::new(*deposit_token_b_pubkey, false),
        AccountMeta::new(*swap_token_a_pubkey, false),
        AccountMeta::new(*swap_token_b_pubkey, false),
        AccountMeta::new(*pool_mint_pubkey, false),
        AccountMeta::new(*destination_pubkey, false),
        AccountMeta::new(*token_program_id, false),
        AccountMeta::new(clock::id(), false),
    ];

    Ok(Instruction {
        program_id: *program_id,
        accounts,
        data,
    })
}

/// Creates a 'withdraw' instruction.
pub fn withdraw(
    program_id: &Pubkey,
    token_program_id: &Pubkey,
    swap_pubkey: &Pubkey,
    authority_pubkey: &Pubkey,
    pool_mint_pubkey: &Pubkey,
    source_pubkey: &Pubkey,
    swap_token_a_pubkey: &Pubkey,
    swap_token_b_pubkey: &Pubkey,
    destination_token_a_pubkey: &Pubkey,
    destination_token_b_pubkey: &Pubkey,
    admin_fee_a_pubkey: &Pubkey,
    admin_fee_b_pubkey: &Pubkey,
    pool_token_amount: u64,
    minimum_token_a_amount: u64,
    minimum_token_b_amount: u64,
) -> Result<Instruction, ProgramError> {
    let data = SwapInstruction::Withdraw(WithdrawData {
        pool_token_amount,
        minimum_token_a_amount,
        minimum_token_b_amount,
    })
    .pack();

    let accounts = vec![
        AccountMeta::new(*swap_pubkey, false),
        AccountMeta::new(*authority_pubkey, false),
        AccountMeta::new(*pool_mint_pubkey, false),
        AccountMeta::new(*source_pubkey, false),
        AccountMeta::new(*swap_token_a_pubkey, false),
        AccountMeta::new(*swap_token_b_pubkey, false),
        AccountMeta::new(*destination_token_a_pubkey, false),
        AccountMeta::new(*destination_token_b_pubkey, false),
        AccountMeta::new(*admin_fee_a_pubkey, false),
        AccountMeta::new(*admin_fee_b_pubkey, false),
        AccountMeta::new(*token_program_id, false),
    ];

    Ok(Instruction {
        program_id: *program_id,
        accounts,
        data,
    })
}

/// Creates a 'swap' instruction.
pub fn swap(
    program_id: &Pubkey,
    token_program_id: &Pubkey,
    swap_pubkey: &Pubkey,
    authority_pubkey: &Pubkey,
    source_pubkey: &Pubkey,
    swap_source_pubkey: &Pubkey,
    swap_destination_pubkey: &Pubkey,
    destination_pubkey: &Pubkey,
    admin_fee_destination_pubkey: &Pubkey,
    amount_in: u64,
    minimum_amount_out: u64,
) -> Result<Instruction, ProgramError> {
    let data = SwapInstruction::Swap(SwapData {
        amount_in,
        minimum_amount_out,
    })
    .pack();

    let accounts = vec![
        AccountMeta::new(*swap_pubkey, false),
        AccountMeta::new(*authority_pubkey, false),
        AccountMeta::new(*source_pubkey, false),
        AccountMeta::new(*swap_source_pubkey, false),
        AccountMeta::new(*swap_destination_pubkey, false),
        AccountMeta::new(*destination_pubkey, false),
        AccountMeta::new(*admin_fee_destination_pubkey, false),
        AccountMeta::new(*token_program_id, false),
        AccountMeta::new(clock::id(), false),
    ];

    Ok(Instruction {
        program_id: *program_id,
        accounts,
        data,
    })
}

/// Creates a 'withdraw_one' instruction.
pub fn withdraw_one(
    program_id: &Pubkey,
    token_program_id: &Pubkey,
    swap_pubkey: &Pubkey,
    authority_pubkey: &Pubkey,
    pool_mint_pubkey: &Pubkey,
    source_pubkey: &Pubkey,
    swap_base_token_pubkey: &Pubkey,
    swap_quote_token_pubkey: &Pubkey,
    base_destination_pubkey: &Pubkey,
    admin_fee_destination_pubkey: &Pubkey,
    pool_token_amount: u64,
    minimum_token_amount: u64,
) -> Result<Instruction, ProgramError> {
    let data = SwapInstruction::WithdrawOne(WithdrawOneData {
        pool_token_amount,
        minimum_token_amount,
    })
    .pack();

    let accounts = vec![
        AccountMeta::new(*swap_pubkey, false),
        AccountMeta::new(*authority_pubkey, false),
        AccountMeta::new(*pool_mint_pubkey, false),
        AccountMeta::new(*source_pubkey, false),
        AccountMeta::new(*swap_base_token_pubkey, false),
        AccountMeta::new(*swap_quote_token_pubkey, false),
        AccountMeta::new(*base_destination_pubkey, false),
        AccountMeta::new(*admin_fee_destination_pubkey, false),
        AccountMeta::new(*token_program_id, false),
        AccountMeta::new(clock::id(), false),
    ];

    Ok(Instruction {
        program_id: *program_id,
        accounts,
        data,
    })
}

fn unpack_i64(input: &[u8]) -> Result<(i64, &[u8]), ProgramError> {
    if input.len() >= 8 {
        let (amount, rest) = input.split_at(8);
        let amount = amount
            .get(..8)
            .and_then(|slice| slice.try_into().ok())
            .map(i64::from_le_bytes)
            .ok_or(SwapError::InvalidInstruction)?;
        Ok((amount, rest))
    } else {
        Err(SwapError::InvalidInstruction.into())
    }
}

fn unpack_u64(input: &[u8]) -> Result<(u64, &[u8]), ProgramError> {
    if input.len() >= 8 {
        let (amount, rest) = input.split_at(8);
        let amount = amount
            .get(..8)
            .and_then(|slice| slice.try_into().ok())
            .map(u64::from_le_bytes)
            .ok_or(SwapError::InvalidInstruction)?;
        Ok((amount, rest))
    } else {
        Err(SwapError::InvalidInstruction.into())
    }
}

/// Unpacks a reference from a bytes buffer.
/// TODO actually pack / unpack instead of relying on normal memory layout.
pub fn unpack<T>(input: &[u8]) -> Result<&T, ProgramError> {
    if input.len() < size_of::<u8>() + size_of::<T>() {
        return Err(ProgramError::InvalidAccountData);
    }
    #[allow(clippy::cast_ptr_alignment)]
    let val: &T = unsafe { &*(&input[1] as *const u8 as *const T) };
    Ok(val)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_admin_instruction_packing() {
        let target_amp = 100;
        let stop_ramp_ts = i64::MAX;
        let check = AdminInstruction::RampA(RampAData {
            target_amp,
            stop_ramp_ts,
        });
        let packed = check.pack();
        let mut expect = vec![];
        expect.push(100 as u8);
        expect.extend_from_slice(&target_amp.to_le_bytes());
        expect.extend_from_slice(&stop_ramp_ts.to_le_bytes());
        assert_eq!(packed, expect);
        let unpacked = AdminInstruction::unpack(&expect).unwrap();
        assert_eq!(unpacked, Some(check));

        let check = AdminInstruction::StopRampA;
        let packed = check.pack();
        let mut expect = vec![];
        expect.push(101 as u8);
        assert_eq!(packed, expect);
        let unpacked = AdminInstruction::unpack(&expect).unwrap();
        assert_eq!(unpacked, Some(check));

        let check = AdminInstruction::Pause;
        let packed = check.pack();
        let mut expect = vec![];
        expect.push(102 as u8);
        assert_eq!(packed, expect);
        let unpacked = AdminInstruction::unpack(&expect).unwrap();
        assert_eq!(unpacked, Some(check));

        let check = AdminInstruction::Unpause;
        let packed = check.pack();
        let mut expect = vec![];
        expect.push(103 as u8);
        assert_eq!(packed, expect);
        let unpacked = AdminInstruction::unpack(&expect).unwrap();
        assert_eq!(unpacked, Some(check));

        let check = AdminInstruction::SetFeeAccountA;
        let packed = check.pack();
        let mut expect = vec![];
        expect.push(104 as u8);
        assert_eq!(packed, expect);
        let unpacked = AdminInstruction::unpack(&expect).unwrap();
        assert_eq!(unpacked, Some(check));

        let check = AdminInstruction::SetFeeAccountB;
        let packed = check.pack();
        let mut expect = vec![];
        expect.push(105 as u8);
        assert_eq!(packed, expect);
        let unpacked = AdminInstruction::unpack(&expect).unwrap();
        assert_eq!(unpacked, Some(check));

        let check = AdminInstruction::ApplyNewAdmin;
        let packed = check.pack();
        let mut expect = vec![];
        expect.push(106 as u8);
        assert_eq!(packed, expect);
        let unpacked = AdminInstruction::unpack(&expect).unwrap();
        assert_eq!(unpacked, Some(check));

        let check = AdminInstruction::CommitNewAdmin;
        let packed = check.pack();
        let mut expect = vec![];
        expect.push(107 as u8);
        assert_eq!(packed, expect);
        let unpacked = AdminInstruction::unpack(&expect).unwrap();
        assert_eq!(unpacked, Some(check));

        let check = AdminInstruction::RevertNewAdmin;
        let packed = check.pack();
        let mut expect = vec![];
        expect.push(108 as u8);
        assert_eq!(packed, expect);
        let unpacked = AdminInstruction::unpack(&expect).unwrap();
        assert_eq!(unpacked, Some(check));

        let check = AdminInstruction::ApplyNewFees;
        let packed = check.pack();
        let mut expect = vec![];
        expect.push(109 as u8);
        assert_eq!(packed, expect);
        let unpacked = AdminInstruction::unpack(&expect).unwrap();
        assert_eq!(unpacked, Some(check));

        let new_fees = Fees {
            admin_trade_fee_numerator: 1,
            admin_trade_fee_denominator: 2,
            admin_withdraw_fee_numerator: 3,
            admin_withdraw_fee_denominator: 4,
            trade_fee_numerator: 5,
            trade_fee_denominator: 6,
            withdraw_fee_numerator: 7,
            withdraw_fee_denominator: 8,
        };
        let check = AdminInstruction::CommitNewFees(new_fees);
        let packed = check.pack();
        let mut expect = vec![];
        expect.push(110 as u8);
        let mut new_fees_slice = [0u8; Fees::LEN];
        new_fees.pack_into_slice(&mut new_fees_slice[..]);
        expect.extend_from_slice(&new_fees_slice);
        assert_eq!(packed, expect);
        let unpacked = AdminInstruction::unpack(&expect).unwrap();
        assert_eq!(unpacked, Some(check));

        let check = AdminInstruction::RevertNewFees;
        let packed = check.pack();
        let mut expect = vec![];
        expect.push(111 as u8);
        assert_eq!(packed, expect);
        let unpacked = AdminInstruction::unpack(&expect).unwrap();
        assert_eq!(unpacked, Some(check));
    }

    #[test]
    fn test_swap_instruction_packing() {
        let nonce: u8 = 255;
        let amp_factor: u64 = 0;
        let fees = Fees {
            admin_trade_fee_numerator: 1,
            admin_trade_fee_denominator: 2,
            admin_withdraw_fee_numerator: 3,
            admin_withdraw_fee_denominator: 4,
            trade_fee_numerator: 5,
            trade_fee_denominator: 6,
            withdraw_fee_numerator: 7,
            withdraw_fee_denominator: 8,
        };
        let check = SwapInstruction::Initialize(InitializeData {
            nonce,
            amp_factor,
            fees,
        });
        let packed = check.pack();
        let mut expect = vec![];
        expect.push(0 as u8);
        expect.push(nonce);
        expect.extend_from_slice(&amp_factor.to_le_bytes());
        let mut fees_slice = [0u8; Fees::LEN];
        fees.pack_into_slice(&mut fees_slice[..]);
        expect.extend_from_slice(&fees_slice);
        assert_eq!(packed, expect);
        let unpacked = SwapInstruction::unpack(&expect).unwrap();
        assert_eq!(unpacked, check);

        let amount_in: u64 = 2;
        let minimum_amount_out: u64 = 10;
        let check = SwapInstruction::Swap(SwapData {
            amount_in,
            minimum_amount_out,
        });
        let packed = check.pack();
        let mut expect = vec![1];
        expect.extend_from_slice(&amount_in.to_le_bytes());
        expect.extend_from_slice(&minimum_amount_out.to_le_bytes());
        assert_eq!(packed, expect);
        let unpacked = SwapInstruction::unpack(&expect).unwrap();
        assert_eq!(unpacked, check);

        let token_a_amount: u64 = 10;
        let token_b_amount: u64 = 20;
        let min_mint_amount: u64 = 5;
        let check = SwapInstruction::Deposit(DepositData {
            token_a_amount,
            token_b_amount,
            min_mint_amount,
        });
        let packed = check.pack();
        let mut expect = vec![2];
        expect.extend_from_slice(&token_a_amount.to_le_bytes());
        expect.extend_from_slice(&token_b_amount.to_le_bytes());
        expect.extend_from_slice(&min_mint_amount.to_le_bytes());
        assert_eq!(packed, expect);
        let unpacked = SwapInstruction::unpack(&expect).unwrap();
        assert_eq!(unpacked, check);

        let pool_token_amount: u64 = 1212438012089;
        let minimum_token_a_amount: u64 = 102198761982612;
        let minimum_token_b_amount: u64 = 2011239855213;
        let check = SwapInstruction::Withdraw(WithdrawData {
            pool_token_amount,
            minimum_token_a_amount,
            minimum_token_b_amount,
        });
        let packed = check.pack();
        let mut expect = vec![3];
        expect.extend_from_slice(&pool_token_amount.to_le_bytes());
        expect.extend_from_slice(&minimum_token_a_amount.to_le_bytes());
        expect.extend_from_slice(&minimum_token_b_amount.to_le_bytes());
        assert_eq!(packed, expect);
        let unpacked = SwapInstruction::unpack(&expect).unwrap();
        assert_eq!(unpacked, check);

        let pool_token_amount: u64 = 1212438012089;
        let minimum_token_amount: u64 = 102198761982612;
        let check = SwapInstruction::WithdrawOne(WithdrawOneData {
            pool_token_amount,
            minimum_token_amount,
        });
        let packed = check.pack();
        let mut expect = vec![4];
        expect.extend_from_slice(&pool_token_amount.to_le_bytes());
        expect.extend_from_slice(&minimum_token_amount.to_le_bytes());
        assert_eq!(packed, expect);
        let unpacked = SwapInstruction::unpack(&expect).unwrap();
        assert_eq!(unpacked, check);
    }
}
