//! Helper methods

use crate::error::SwapError;
use std::convert::TryInto;

/// Convert u64 value to u128
pub fn to_u128(val: u64) -> Result<u128, SwapError> {
    val.try_into().map_err(|_| SwapError::ConversionFailure)
}

/// Convert u128 to u64
pub fn to_u64(val: u128) -> Result<u64, SwapError> {
    val.try_into().map_err(|_| SwapError::ConversionFailure)
}
