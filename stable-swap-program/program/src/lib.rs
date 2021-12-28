#![deny(clippy::unwrap_used)]
#![deny(missing_docs)]

//! A Curve-like program for the Solana blockchain.

pub mod entrypoint;
pub mod processor;

pub use stable_swap_client::{error, fees, instruction, state};
pub use stable_swap_math::{curve, math, pool_converter};

// Export current solana-program types for downstream users who may also be
// building with a different solana-program version
pub use solana_program;

solana_program::declare_id!("SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ");
