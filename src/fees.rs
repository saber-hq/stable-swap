//! Program fees

use crate::bn::U256;
use arrayref::{array_mut_ref, array_ref, array_refs, mut_array_refs};
use solana_sdk::{
    program_error::ProgramError,
    program_pack::{Pack, Sealed},
};

/// Fees struct
#[repr(C)]
#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub struct Fees {
    /// Admin trade fee numerator
    pub admin_trade_fee_numerator: u64,
    /// Admin trade fee denominator
    pub admin_trade_fee_denominator: u64,
    /// Admin withdraw fee numerator
    pub admin_withdraw_fee_numerator: u64,
    /// Admin withdraw fee denominator
    pub admin_withdraw_fee_denominator: u64,
    /// Trade fee numerator
    pub trade_fee_numerator: u64,
    /// Trade fee denominator
    pub trade_fee_denominator: u64,
    /// Withdraw fee numerator
    pub withdraw_fee_numerator: u64,
    /// Withdraw fee denominator
    pub withdraw_fee_denominator: u64,
}

impl Fees {
    /// Apply admin trade fee
    pub fn admin_trade_fee(&self, fee_amount: U256) -> Option<U256> {
        Some(
            fee_amount
                .checked_mul(self.admin_trade_fee_numerator.into())?
                .checked_div(self.admin_trade_fee_denominator.into())?,
        )
    }

    /// Apply admin withdraw fee
    pub fn admin_withdraw_fee(&self, fee_amount: U256) -> Option<U256> {
        Some(
            fee_amount
                .checked_mul(self.admin_withdraw_fee_numerator.into())?
                .checked_div(self.admin_withdraw_fee_denominator.into())?,
        )
    }

    /// Apply trade fee to amount
    pub fn trade_fee(&self, trade_amount: U256) -> Option<U256> {
        Some(
            trade_amount
                .checked_mul(self.trade_fee_numerator.into())?
                .checked_div(self.trade_fee_denominator.into())?,
        )
    }

    /// Apply withdraw fee to amount
    pub fn withdraw_fee(&self, withdraw_amount: U256) -> Option<U256> {
        Some(
            withdraw_amount
                .checked_mul(self.withdraw_fee_numerator.into())?
                .checked_div(self.withdraw_fee_denominator.into())?,
        )
    }

    /// Compute normalized fee for symmetric/asymmetric for deposits/withdraws
    pub fn normalized_trade_fee(&self, n_coins: u64, amount: U256) -> Option<U256> {
        // adjusted_fee_numerator: uint256 = self.fee * N_COINS / (4 * (N_COINS - 1))
        let adjusted_trade_fee_numerator = self
            .trade_fee_numerator
            .checked_mul(n_coins)?
            .checked_div((n_coins.checked_sub(1)?).checked_mul(4)?)?; // XXX: Why divide by 4?
        let fee = amount
            .checked_mul(adjusted_trade_fee_numerator.into())?
            .checked_div(self.trade_fee_denominator.into())?;
        Some(fee)
    }
}

impl Sealed for Fees {}
impl Pack for Fees {
    const LEN: usize = 64;
    fn unpack_from_slice(input: &[u8]) -> Result<Self, ProgramError> {
        let input = array_ref![input, 0, 64];
        #[allow(clippy::ptr_offset_with_cast)]
        let (
            admin_trade_fee_numerator,
            admin_trade_fee_denominator,
            admin_withdraw_fee_numerator,
            admin_withdraw_fee_denominator,
            trade_fee_numerator,
            trade_fee_denominator,
            withdraw_fee_numerator,
            withdraw_fee_denominator,
        ) = array_refs![input, 8, 8, 8, 8, 8, 8, 8, 8];
        Ok(Self {
            admin_trade_fee_numerator: u64::from_le_bytes(*admin_trade_fee_numerator),
            admin_trade_fee_denominator: u64::from_le_bytes(*admin_trade_fee_denominator),
            admin_withdraw_fee_numerator: u64::from_le_bytes(*admin_withdraw_fee_numerator),
            admin_withdraw_fee_denominator: u64::from_le_bytes(*admin_withdraw_fee_denominator),
            trade_fee_numerator: u64::from_le_bytes(*trade_fee_numerator),
            trade_fee_denominator: u64::from_le_bytes(*trade_fee_denominator),
            withdraw_fee_numerator: u64::from_le_bytes(*withdraw_fee_numerator),
            withdraw_fee_denominator: u64::from_le_bytes(*withdraw_fee_denominator),
        })
    }

    fn pack_into_slice(&self, output: &mut [u8]) {
        let output = array_mut_ref![output, 0, 64];
        let (
            admin_trade_fee_numerator,
            admin_trade_fee_denominator,
            admin_withdraw_fee_numerator,
            admin_withdraw_fee_denominator,
            trade_fee_numerator,
            trade_fee_denominator,
            withdraw_fee_numerator,
            withdraw_fee_denominator,
        ) = mut_array_refs![output, 8, 8, 8, 8, 8, 8, 8, 8];
        *admin_trade_fee_numerator = self.admin_trade_fee_numerator.to_le_bytes();
        *admin_trade_fee_denominator = self.admin_trade_fee_denominator.to_le_bytes();
        *admin_withdraw_fee_numerator = self.admin_withdraw_fee_numerator.to_le_bytes();
        *admin_withdraw_fee_denominator = self.admin_withdraw_fee_denominator.to_le_bytes();
        *trade_fee_numerator = self.trade_fee_numerator.to_le_bytes();
        *trade_fee_denominator = self.trade_fee_denominator.to_le_bytes();
        *withdraw_fee_numerator = self.withdraw_fee_numerator.to_le_bytes();
        *withdraw_fee_denominator = self.withdraw_fee_denominator.to_le_bytes();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn pack_fees() {
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

        let mut packed = [0u8; Fees::LEN];
        Pack::pack_into_slice(&fees, &mut packed[..]);
        let unpacked = Fees::unpack_from_slice(&packed).unwrap();
        assert_eq!(fees, unpacked);

        let mut packed = vec![];
        packed.extend_from_slice(&admin_trade_fee_numerator.to_le_bytes());
        packed.extend_from_slice(&admin_trade_fee_denominator.to_le_bytes());
        packed.extend_from_slice(&admin_withdraw_fee_numerator.to_le_bytes());
        packed.extend_from_slice(&admin_withdraw_fee_denominator.to_le_bytes());
        packed.extend_from_slice(&trade_fee_numerator.to_le_bytes());
        packed.extend_from_slice(&trade_fee_denominator.to_le_bytes());
        packed.extend_from_slice(&withdraw_fee_numerator.to_le_bytes());
        packed.extend_from_slice(&withdraw_fee_denominator.to_le_bytes());
        let unpacked = Fees::unpack_from_slice(&packed).unwrap();
        assert_eq!(fees, unpacked);
    }

    #[test]
    fn fee_results() {
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

        let trade_amount = 1_000_000_000;
        let expected_trade_fee = trade_amount * trade_fee_numerator / trade_fee_denominator;
        let trade_fee = fees.trade_fee(trade_amount.into()).unwrap();
        assert_eq!(trade_fee, expected_trade_fee.into());
        let expected_admin_trade_fee =
            expected_trade_fee * admin_trade_fee_numerator / admin_trade_fee_denominator;
        assert_eq!(
            fees.admin_trade_fee(trade_fee).unwrap(),
            expected_admin_trade_fee.into()
        );

        let withdraw_amount = 100_000_000_000;
        let expected_withdraw_fee =
            withdraw_amount * withdraw_fee_numerator / withdraw_fee_denominator;
        let withdraw_fee = fees.withdraw_fee(withdraw_amount.into()).unwrap();
        assert_eq!(withdraw_fee, expected_withdraw_fee.into());
        let expected_admin_withdraw_fee =
            expected_withdraw_fee * admin_withdraw_fee_numerator / admin_withdraw_fee_denominator;
        assert_eq!(
            fees.admin_withdraw_fee(expected_withdraw_fee.into())
                .unwrap(),
            expected_admin_withdraw_fee.into()
        );

        let n_coins = 2;
        let adjusted_trade_fee_numerator = trade_fee_numerator * n_coins / (4 * (n_coins - 1));
        let expected_normalized_fee =
            U256::from(trade_amount * adjusted_trade_fee_numerator / trade_fee_denominator);
        assert_eq!(
            fees.normalized_trade_fee(n_coins, trade_amount.into())
                .unwrap(),
            expected_normalized_fee.into()
        );
    }
}
