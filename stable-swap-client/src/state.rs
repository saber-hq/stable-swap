//! State transition types

use crate::{fees::Fees, fraction::Fraction};
use arrayref::{array_mut_ref, array_ref, array_refs, mut_array_refs};
use solana_program::{
    program_error::ProgramError,
    program_pack::{IsInitialized, Pack, Sealed},
    pubkey::Pubkey,
};

/// Program states.
#[repr(C)]
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct SwapInfo {
    /// Initialized state
    pub is_initialized: bool,

    /// Paused state
    pub is_paused: bool,

    /// Nonce used in program address
    /// The program address is created deterministically with the nonce,
    /// swap program id, and swap account pubkey.  This program address has
    /// authority over the swap's token A account, token B account, and pool
    /// token mint.
    pub nonce: u8,

    /// Initial amplification coefficient (A)
    pub initial_amp_factor: u64,
    /// Target amplification coefficient (A)
    pub target_amp_factor: u64,
    /// Ramp A start timestamp
    pub start_ramp_ts: i64,
    /// Ramp A stop timestamp
    pub stop_ramp_ts: i64,

    /// Deadline to transfer admin control to future_admin_key
    pub future_admin_deadline: i64,
    /// Public key of the admin account to be applied
    pub future_admin_key: Pubkey,
    /// Public key of admin account to execute admin instructions
    pub admin_key: Pubkey,

    /// Token A
    pub token_a: SwapTokenInfo,
    /// Token B
    pub token_b: SwapTokenInfo,

    /// Pool tokens are issued when A or B tokens are deposited.
    /// Pool tokens can be withdrawn back to the original A or B token.
    pub pool_mint: Pubkey,
    /// Fees
    pub fees: Fees,

    /// Exchange rate override between token A and the underlying.
    /// If 0/0, there is no override.
    pub token_a_exchange_rate_override: Fraction,
    /// Exchange rate override between token B and the underlying.
    /// If 0/0, there is no override.
    pub token_b_exchange_rate_override: Fraction,
}

impl SwapInfo {
    fn exchange_rate_from_override(exchange_rate_override: Fraction) -> Fraction {
        if exchange_rate_override.numerator == 0 && exchange_rate_override.denominator == 0 {
            return Fraction {
                numerator: 1,
                denominator: 1,
            };
        }

        exchange_rate_override
    }

    /// Calculates the exchange rate of token A.
    pub fn exchange_rate_a(&self) -> Fraction {
        // For now, we exclusively rely on the exchange rate override.
        SwapInfo::exchange_rate_from_override(self.token_a_exchange_rate_override)
    }

    /// Calculates the exchange rate of token B.
    pub fn exchange_rate_b(&self) -> Fraction {
        // For now, we exclusively rely on the exchange rate override.
        SwapInfo::exchange_rate_from_override(self.token_b_exchange_rate_override)
    }

    /// Calculates the exchange rate of the token corresponding with 'key'.
    /// Assumes that 'key' corresponds with either token A or token B.
    pub fn exchange_rate_from_token_account(&self, key: Pubkey) -> Fraction {
        if key == self.token_a.reserves {
            return self.exchange_rate_a();
        }
        if key == self.token_b.reserves {
            return self.exchange_rate_b();
        }
        Fraction {
            numerator: 0,
            denominator: 0,
        }
    }
}

/// Information about one of the tokens.
#[repr(C)]
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct SwapTokenInfo {
    /// Token account for pool reserves
    pub reserves: Pubkey,
    /// Mint information for the token
    pub mint: Pubkey,
    /// Public key of the admin token account to receive trading and / or withdrawal fees for token
    pub admin_fees: Pubkey,
    /// The index of the token. Token A = 0, Token B = 1.
    pub index: u8,
}

impl Sealed for SwapInfo {}
impl IsInitialized for SwapInfo {
    fn is_initialized(&self) -> bool {
        self.is_initialized
    }
}

impl Pack for SwapInfo {
    const LEN: usize = 427;

    /// Unpacks a byte buffer into a [SwapInfo](struct.SwapInfo.html).
    fn unpack_from_slice(input: &[u8]) -> Result<Self, ProgramError> {
        let input = array_ref![input, 0, 427];
        #[allow(clippy::ptr_offset_with_cast)]
        let (
            is_initialized,
            is_paused,
            nonce,
            initial_amp_factor,
            target_amp_factor,
            start_ramp_ts,
            stop_ramp_ts,
            future_admin_deadline,
            future_admin_key,
            admin_key,
            token_a,
            token_b,
            pool_mint,
            token_a_mint,
            token_b_mint,
            admin_fee_key_a,
            admin_fee_key_b,
            fees,
            token_a_exchange_rate_override,
            token_b_exchange_rate_override,
        ) = array_refs![
            input, 1, 1, 1, 8, 8, 8, 8, 8, 32, 32, 32, 32, 32, 32, 32, 32, 32, 64, 16, 16
        ];
        Ok(Self {
            is_initialized: match is_initialized {
                [0] => false,
                [1] => true,
                _ => return Err(ProgramError::InvalidAccountData),
            },
            is_paused: match is_paused {
                [0] => false,
                [1] => true,
                _ => return Err(ProgramError::InvalidAccountData),
            },
            nonce: nonce[0],
            initial_amp_factor: u64::from_le_bytes(*initial_amp_factor),
            target_amp_factor: u64::from_le_bytes(*target_amp_factor),
            start_ramp_ts: i64::from_le_bytes(*start_ramp_ts),
            stop_ramp_ts: i64::from_le_bytes(*stop_ramp_ts),
            future_admin_deadline: i64::from_le_bytes(*future_admin_deadline),
            future_admin_key: Pubkey::new_from_array(*future_admin_key),
            admin_key: Pubkey::new_from_array(*admin_key),
            token_a: SwapTokenInfo {
                reserves: Pubkey::new_from_array(*token_a),
                mint: Pubkey::new_from_array(*token_a_mint),
                admin_fees: Pubkey::new_from_array(*admin_fee_key_a),
                index: 0,
            },
            token_b: SwapTokenInfo {
                reserves: Pubkey::new_from_array(*token_b),
                mint: Pubkey::new_from_array(*token_b_mint),
                admin_fees: Pubkey::new_from_array(*admin_fee_key_b),
                index: 1,
            },
            pool_mint: Pubkey::new_from_array(*pool_mint),
            fees: Fees::unpack_from_slice(fees)?,
            token_a_exchange_rate_override: Fraction::unpack_from_slice(
                token_a_exchange_rate_override,
            )?,
            token_b_exchange_rate_override: Fraction::unpack_from_slice(
                token_b_exchange_rate_override,
            )?,
        })
    }

    fn pack_into_slice(&self, output: &mut [u8]) {
        let output = array_mut_ref![output, 0, 427];
        let (
            is_initialized,
            is_paused,
            nonce,
            initial_amp_factor,
            target_amp_factor,
            start_ramp_ts,
            stop_ramp_ts,
            future_admin_deadline,
            future_admin_key,
            admin_key,
            token_a,
            token_b,
            pool_mint,
            token_a_mint,
            token_b_mint,
            admin_fee_key_a,
            admin_fee_key_b,
            fees,
            token_a_exchange_rate_override,
            token_b_exchange_rate_override,
        ) = mut_array_refs![
            output, 1, 1, 1, 8, 8, 8, 8, 8, 32, 32, 32, 32, 32, 32, 32, 32, 32, 64, 16, 16
        ];
        is_initialized[0] = self.is_initialized as u8;
        is_paused[0] = self.is_paused as u8;
        nonce[0] = self.nonce;
        *initial_amp_factor = self.initial_amp_factor.to_le_bytes();
        *target_amp_factor = self.target_amp_factor.to_le_bytes();
        *start_ramp_ts = self.start_ramp_ts.to_le_bytes();
        *stop_ramp_ts = self.stop_ramp_ts.to_le_bytes();
        *future_admin_deadline = self.future_admin_deadline.to_le_bytes();
        future_admin_key.copy_from_slice(self.future_admin_key.as_ref());
        admin_key.copy_from_slice(self.admin_key.as_ref());
        token_a.copy_from_slice(self.token_a.reserves.as_ref());
        token_b.copy_from_slice(self.token_b.reserves.as_ref());
        pool_mint.copy_from_slice(self.pool_mint.as_ref());
        token_a_mint.copy_from_slice(self.token_a.mint.as_ref());
        token_b_mint.copy_from_slice(self.token_b.mint.as_ref());
        admin_fee_key_a.copy_from_slice(self.token_a.admin_fees.as_ref());
        admin_fee_key_b.copy_from_slice(self.token_b.admin_fees.as_ref());
        self.fees.pack_into_slice(&mut fees[..]);
        self.token_a_exchange_rate_override
            .pack_into_slice(&mut token_a_exchange_rate_override[..]);
        self.token_b_exchange_rate_override
            .pack_into_slice(&mut token_b_exchange_rate_override[..]);
    }
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;

    #[test]
    fn test_swap_info_packing() {
        let nonce = 255;
        let initial_amp_factor: u64 = 1;
        let target_amp_factor: u64 = 1;
        let start_ramp_ts: i64 = i64::MAX;
        let stop_ramp_ts: i64 = i64::MAX;
        let future_admin_deadline: i64 = i64::MAX;
        let future_admin_key_raw = [1u8; 32];
        let admin_key_raw = [2u8; 32];
        let token_a_raw = [3u8; 32];
        let token_b_raw = [4u8; 32];
        let pool_mint_raw = [5u8; 32];
        let token_a_mint_raw = [6u8; 32];
        let token_b_mint_raw = [7u8; 32];
        let admin_fee_key_a_raw = [8u8; 32];
        let admin_fee_key_b_raw = [9u8; 32];
        let admin_key = Pubkey::new_from_array(admin_key_raw);
        let future_admin_key = Pubkey::new_from_array(future_admin_key_raw);
        let token_a = Pubkey::new_from_array(token_a_raw);
        let token_b = Pubkey::new_from_array(token_b_raw);
        let pool_mint = Pubkey::new_from_array(pool_mint_raw);
        let token_a_mint = Pubkey::new_from_array(token_a_mint_raw);
        let token_b_mint = Pubkey::new_from_array(token_b_mint_raw);
        let admin_fee_key_a = Pubkey::new_from_array(admin_fee_key_a_raw);
        let admin_fee_key_b = Pubkey::new_from_array(admin_fee_key_b_raw);
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
        let token_a_exchange_rate_override = Fraction {
            numerator: 9,
            denominator: 10,
        };
        let token_b_exchange_rate_override = Fraction {
            numerator: 11,
            denominator: 12,
        };

        let is_initialized = true;
        let is_paused = false;
        let swap_info = SwapInfo {
            is_initialized,
            is_paused,
            nonce,
            initial_amp_factor,
            target_amp_factor,
            start_ramp_ts,
            stop_ramp_ts,
            future_admin_deadline,
            future_admin_key,
            admin_key,
            token_a: SwapTokenInfo {
                reserves: token_a,
                mint: token_a_mint,
                admin_fees: admin_fee_key_a,
                index: 0,
            },
            token_b: SwapTokenInfo {
                reserves: token_b,
                mint: token_b_mint,
                admin_fees: admin_fee_key_b,
                index: 1,
            },
            pool_mint,
            fees,
            token_a_exchange_rate_override,
            token_b_exchange_rate_override,
        };

        let mut packed = [0u8; SwapInfo::LEN];
        SwapInfo::pack(swap_info, &mut packed).unwrap();
        let unpacked = SwapInfo::unpack(&packed).unwrap();
        assert_eq!(swap_info, unpacked);

        let mut packed = vec![
            1_u8, // is_initialized
            0_u8, // is_paused
            nonce,
        ];
        packed.extend_from_slice(&initial_amp_factor.to_le_bytes());
        packed.extend_from_slice(&target_amp_factor.to_le_bytes());
        packed.extend_from_slice(&start_ramp_ts.to_le_bytes());
        packed.extend_from_slice(&stop_ramp_ts.to_le_bytes());
        packed.extend_from_slice(&future_admin_deadline.to_le_bytes());
        packed.extend_from_slice(&future_admin_key_raw);
        packed.extend_from_slice(&admin_key_raw);
        packed.extend_from_slice(&token_a_raw);
        packed.extend_from_slice(&token_b_raw);
        packed.extend_from_slice(&pool_mint_raw);
        packed.extend_from_slice(&token_a_mint_raw);
        packed.extend_from_slice(&token_b_mint_raw);
        packed.extend_from_slice(&admin_fee_key_a_raw);
        packed.extend_from_slice(&admin_fee_key_b_raw);
        packed.extend_from_slice(&admin_trade_fee_numerator.to_le_bytes());
        packed.extend_from_slice(&admin_trade_fee_denominator.to_le_bytes());
        packed.extend_from_slice(&admin_withdraw_fee_numerator.to_le_bytes());
        packed.extend_from_slice(&admin_withdraw_fee_denominator.to_le_bytes());
        packed.extend_from_slice(&trade_fee_numerator.to_le_bytes());
        packed.extend_from_slice(&trade_fee_denominator.to_le_bytes());
        packed.extend_from_slice(&withdraw_fee_numerator.to_le_bytes());
        packed.extend_from_slice(&withdraw_fee_denominator.to_le_bytes());
        packed.extend_from_slice(&token_a_exchange_rate_override.numerator.to_le_bytes());
        packed.extend_from_slice(&token_a_exchange_rate_override.denominator.to_le_bytes());
        packed.extend_from_slice(&token_b_exchange_rate_override.numerator.to_le_bytes());
        packed.extend_from_slice(&token_b_exchange_rate_override.denominator.to_le_bytes());
        let unpacked = SwapInfo::unpack(&packed).unwrap();
        assert_eq!(swap_info, unpacked);
    }
}
