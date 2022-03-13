//! Program fraction

use arrayref::{array_mut_ref, array_ref, array_refs, mut_array_refs};
use solana_program::{
    program_error::ProgramError,
    program_pack::{Pack, Sealed},
};

/// Fraction struct
#[repr(C)]
#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
#[cfg_attr(feature = "fuzz", derive(arbitrary::Arbitrary))]
pub struct Fraction {
    /// Numerator
    pub numerator: u64,
    /// Denominator
    pub denominator: u64,
}

impl Fraction {
    /// The fraction corresponding to 1/1.
    pub const ONE: Self = Self {
        numerator: 1,
        denominator: 1,
    };

    /// The fraction corresponding to 0/0.
    pub const UNDEFINED: Self = Self {
        numerator: 0,
        denominator: 0,
    };

    /// Returns whether the fraction has a non-zero denominator.
    pub fn is_divisible(&self) -> bool {
        self.denominator != 0
    }
}

impl Sealed for Fraction {}
impl Pack for Fraction {
    const LEN: usize = 16;
    fn unpack_from_slice(input: &[u8]) -> Result<Self, ProgramError> {
        let input = array_ref![input, 0, 16];
        #[allow(clippy::ptr_offset_with_cast)]
        let (numerator, denominator) = array_refs![input, 8, 8];
        Ok(Self {
            numerator: u64::from_le_bytes(*numerator),
            denominator: u64::from_le_bytes(*denominator),
        })
    }

    fn pack_into_slice(&self, output: &mut [u8]) {
        let output = array_mut_ref![output, 0, 16];
        let (numerator, denominator) = mut_array_refs![output, 8, 8];
        *numerator = self.numerator.to_le_bytes();
        *denominator = self.denominator.to_le_bytes();
    }
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;

    #[test]
    fn pack_fraction() {
        let numerator = 1;
        let denominator = 2;
        let fraction = Fraction {
            numerator,
            denominator,
        };

        let mut packed = [0u8; Fraction::LEN];
        Pack::pack_into_slice(&fraction, &mut packed[..]);
        let unpacked = Fraction::unpack_from_slice(&packed).unwrap();
        assert_eq!(fraction, unpacked);

        let mut packed = vec![];
        packed.extend_from_slice(&numerator.to_le_bytes());
        packed.extend_from_slice(&denominator.to_le_bytes());
        let unpacked = Fraction::unpack_from_slice(&packed).unwrap();
        assert_eq!(fraction, unpacked);
    }
}
