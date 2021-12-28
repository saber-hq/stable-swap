//! Big number types

#![allow(clippy::assign_op_pattern)]
#![allow(clippy::ptr_offset_with_cast)]
#![allow(clippy::manual_range_contains)]

use crate::error::SwapError;
use uint::construct_uint;

construct_uint! {
    /// 256-bit unsigned integer.
    pub struct U256(4);
}

impl U256 {
    /// Convert u256 to u64
    pub fn to_u64(self) -> Option<u64> {
        self.try_to_u64().map_or_else(|_| None, Some)
    }

    /// Convert u256 to u64
    pub fn try_to_u64(self) -> Result<u64, SwapError> {
        self.try_into().map_err(|_| SwapError::ConversionFailure)
    }

    /// Convert u256 to u128
    pub fn to_u128(self) -> Option<u128> {
        self.try_to_u128().map_or_else(|_| None, Some)
    }

    /// Convert u256 to u128
    pub fn try_to_u128(self) -> Result<u128, SwapError> {
        self.try_into().map_err(|_| SwapError::ConversionFailure)
    }
}

construct_uint! {
    /// 192-bit unsigned integer.
    pub struct U192(3);
}

impl U192 {
    /// Convert u256 to u64
    pub fn to_u64(self) -> Option<u64> {
        self.try_to_u64().map_or_else(|_| None, Some)
    }

    /// Convert u256 to u64
    pub fn try_to_u64(self) -> Result<u64, SwapError> {
        self.try_into().map_err(|_| SwapError::ConversionFailure)
    }

    /// Convert u256 to u128
    pub fn to_u128(self) -> Option<u128> {
        self.try_to_u128().map_or_else(|_| None, Some)
    }

    /// Convert u256 to u128
    pub fn try_to_u128(self) -> Result<u128, SwapError> {
        self.try_into().map_err(|_| SwapError::ConversionFailure)
    }
}
