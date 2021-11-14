//! Math helpers

use num_traits::ToPrimitive;

const MAX: u64 = 1 << 32;
const MAX_BIG: u64 = 1 << 48;
const MAX_SMALL: u64 = 1 << 16;

/// Multiplies two u64s then divides by the third number.
/// This function attempts to use 64 bit math if possible.
#[inline(always)]
pub fn mul_div(a: u64, b: u64, c: u64) -> Option<u64> {
    if a > MAX || b > MAX {
        (a as u128)
            .checked_mul(b as u128)?
            .checked_div(c as u128)?
            .to_u64()
    } else {
        a.checked_mul(b)?.checked_div(c)
    }
}

/// Multiplies two u64s then divides by the third number.
/// This assumes that a > b.
#[inline(always)]
pub fn mul_div_imbalanced(a: u64, b: u64, c: u64) -> Option<u64> {
    if a > MAX_BIG || b > MAX_SMALL {
        (a as u128)
            .checked_mul(b as u128)?
            .checked_div(c as u128)?
            .to_u64()
    } else {
        a.checked_mul(b)?.checked_div(c)
    }
}
