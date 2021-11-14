#![deny(clippy::unwrap_used)]
#![deny(missing_docs)]

//! A Curve-like program for the Solana blockchain.

pub mod bn;
pub mod curve;
pub mod entrypoint;
pub mod error;
pub mod fees;
pub mod instruction;
mod math;
pub mod pool_converter;
pub mod processor;
pub mod state;

// Export current solana-program types for downstream users who may also be
// building with a different solana-program version
pub use solana_program;

solana_program::declare_id!("SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ");
