//! State transition types

use crate::fees::Fees;
use arrayref::{array_mut_ref, array_ref, array_refs, mut_array_refs};
use solana_sdk::{
    program_error::ProgramError,
    program_pack::{IsInitialized, Pack, Sealed},
    pubkey::Pubkey,
};

/// Program states.
#[repr(C)]
#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub struct SwapInfo {
    /// Initialized state.
    pub is_initialized: bool,
    /// Nonce used in program address.
    /// The program address is created deterministically with the nonce,
    /// swap program id, and swap account pubkey.  This program address has
    /// authority over the swap's token A account, token B account, and pool
    /// token mint.
    pub nonce: u8,

    /// Initial amplification coefficient (A)
    pub initial_amp_factor: u64,
    /// Target amplification coefficient (A)
    pub target_amp_factor: u64,

    /// Token A
    pub token_a: Pubkey,
    /// Token B
    pub token_b: Pubkey,

    /// Pool tokens are issued when A or B tokens are deposited.
    /// Pool tokens can be withdrawn back to the original A or B token.
    pub pool_mint: Pubkey,
    /// Mint information for token A
    pub token_a_mint: Pubkey,
    /// Mint information for token B
    pub token_b_mint: Pubkey,

    /// Admin token account to receive trading and / or withdrawal fees for token a
    pub admin_fee_account_a: Pubkey,
    /// Admin token account to receive trading and / or withdrawal fees for token b
    pub admin_fee_account_b: Pubkey,
    /// Fees
    pub fees: Fees,
}

impl Sealed for SwapInfo {}
impl IsInitialized for SwapInfo {
    fn is_initialized(&self) -> bool {
        self.is_initialized
    }
}

impl Pack for SwapInfo {
    const LEN: usize = 306;

    /// Unpacks a byte buffer into a [SwapInfo](struct.SwapInfo.html).
    fn unpack_from_slice(input: &[u8]) -> Result<Self, ProgramError> {
        let input = array_ref![input, 0, 306];
        #[allow(clippy::ptr_offset_with_cast)]
        let (
            is_initialized,
            nonce,
            initial_amp_factor,
            target_amp_factor,
            token_a,
            token_b,
            pool_mint,
            token_a_mint,
            token_b_mint,
            admin_fee_account_a,
            admin_fee_account_b,
            fees,
        ) = array_refs![input, 1, 1, 8, 8, 32, 32, 32, 32, 32, 32, 32, 64];
        Ok(Self {
            is_initialized: match is_initialized {
                [0] => false,
                [1] => true,
                _ => return Err(ProgramError::InvalidAccountData),
            },
            nonce: nonce[0],
            initial_amp_factor: u64::from_le_bytes(*initial_amp_factor),
            target_amp_factor: u64::from_le_bytes(*target_amp_factor),
            token_a: Pubkey::new_from_array(*token_a),
            token_b: Pubkey::new_from_array(*token_b),
            pool_mint: Pubkey::new_from_array(*pool_mint),
            token_a_mint: Pubkey::new_from_array(*token_a_mint),
            token_b_mint: Pubkey::new_from_array(*token_b_mint),
            admin_fee_account_a: Pubkey::new_from_array(*admin_fee_account_a),
            admin_fee_account_b: Pubkey::new_from_array(*admin_fee_account_b),
            fees: Fees::unpack_from_slice(fees)?,
        })
    }

    fn pack_into_slice(&self, output: &mut [u8]) {
        let output = array_mut_ref![output, 0, 306];
        let (
            is_initialized,
            nonce,
            initial_amp_factor,
            target_amp_factor,
            token_a,
            token_b,
            pool_mint,
            token_a_mint,
            token_b_mint,
            admin_fee_account_a,
            admin_fee_account_b,
            fees,
        ) = mut_array_refs![output, 1, 1, 8, 8, 32, 32, 32, 32, 32, 32, 32, 64];
        is_initialized[0] = self.is_initialized as u8;
        nonce[0] = self.nonce;
        *initial_amp_factor = self.initial_amp_factor.to_le_bytes();
        *target_amp_factor = self.target_amp_factor.to_le_bytes();
        token_a.copy_from_slice(self.token_a.as_ref());
        token_b.copy_from_slice(self.token_b.as_ref());
        pool_mint.copy_from_slice(self.pool_mint.as_ref());
        token_a_mint.copy_from_slice(self.token_a_mint.as_ref());
        token_b_mint.copy_from_slice(self.token_b_mint.as_ref());
        admin_fee_account_a.copy_from_slice(self.admin_fee_account_a.as_ref());
        admin_fee_account_b.copy_from_slice(self.admin_fee_account_b.as_ref());
        self.fees.pack_into_slice(&mut fees[..]);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_swap_info_packing() {
        let nonce = 255;
        let initial_amp_factor: u64 = 1;
        let target_amp_factor: u64 = 1;
        let token_a_raw = [1u8; 32];
        let token_b_raw = [2u8; 32];
        let pool_mint_raw = [3u8; 32];
        let token_a_mint_raw = [4u8; 32];
        let token_b_mint_raw = [5u8; 32];
        let admin_fee_account_raw_a = [6u8; 32];
        let admin_fee_account_raw_b = [7u8; 32];
        let token_a = Pubkey::new_from_array(token_a_raw);
        let token_b = Pubkey::new_from_array(token_b_raw);
        let pool_mint = Pubkey::new_from_array(pool_mint_raw);
        let token_a_mint = Pubkey::new_from_array(token_a_mint_raw);
        let token_b_mint = Pubkey::new_from_array(token_b_mint_raw);
        let admin_fee_account_a = Pubkey::new_from_array(admin_fee_account_raw_a);
        let admin_fee_account_b = Pubkey::new_from_array(admin_fee_account_raw_b);
        let admin_trade_fee_numerator = 1;
        let admin_trade_fee_denominator = 2;
        let admin_withdraw_fee_numerator = 3;
        let admin_withdraw_fee_denominator = 4;
        let trade_fee_numerator = 5;
        let trade_fee_denominator = 6;
        let withdraw_fee_numerator = 7;
        let withdraw_fee_denominator = 8;
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

        let is_initialized = true;
        let swap_info = SwapInfo {
            is_initialized,
            nonce,
            initial_amp_factor,
            target_amp_factor,
            token_a,
            token_b,
            pool_mint,
            token_a_mint,
            token_b_mint,
            admin_fee_account_a,
            admin_fee_account_b,
            fees,
        };

        let mut packed = [0u8; SwapInfo::LEN];
        SwapInfo::pack(swap_info, &mut packed).unwrap();
        let unpacked = SwapInfo::unpack(&packed).unwrap();
        assert_eq!(swap_info, unpacked);

        let mut packed = vec![];
        packed.push(1 as u8);
        packed.push(nonce);
        packed.extend_from_slice(&initial_amp_factor.to_le_bytes());
        packed.extend_from_slice(&target_amp_factor.to_le_bytes());
        packed.extend_from_slice(&token_a_raw);
        packed.extend_from_slice(&token_b_raw);
        packed.extend_from_slice(&pool_mint_raw);
        packed.extend_from_slice(&token_a_mint_raw);
        packed.extend_from_slice(&token_b_mint_raw);
        packed.extend_from_slice(&admin_fee_account_raw_a);
        packed.extend_from_slice(&admin_fee_account_raw_b);
        packed.extend_from_slice(&admin_trade_fee_numerator.to_le_bytes());
        packed.extend_from_slice(&admin_trade_fee_denominator.to_le_bytes());
        packed.extend_from_slice(&admin_withdraw_fee_numerator.to_le_bytes());
        packed.extend_from_slice(&admin_withdraw_fee_denominator.to_le_bytes());
        packed.extend_from_slice(&trade_fee_numerator.to_le_bytes());
        packed.extend_from_slice(&trade_fee_denominator.to_le_bytes());
        packed.extend_from_slice(&withdraw_fee_numerator.to_le_bytes());
        packed.extend_from_slice(&withdraw_fee_denominator.to_le_bytes());
        let unpacked = SwapInfo::unpack(&packed).unwrap();
        assert_eq!(swap_info, unpacked);

        let packed = [0u8; SwapInfo::LEN];
        let swap_info: SwapInfo = Default::default();
        let unpack_unchecked = SwapInfo::unpack_unchecked(&packed).unwrap();
        assert_eq!(unpack_unchecked, swap_info);
        let err = SwapInfo::unpack(&packed).unwrap_err();
        assert_eq!(err, ProgramError::UninitializedAccount);
    }
}
