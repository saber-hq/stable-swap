//! A Curve-like program for the Solana blockchain.
#![deny(clippy::unwrap_used)]
#![deny(rustdoc::all)]
#![allow(rustdoc::missing_doc_code_examples)]
#![deny(missing_docs)]

pub mod error;
pub mod fees;
pub mod fraction;
pub mod instruction;
pub mod state;

// Export current solana-program types for downstream users who may also be
// building with a different solana-program version
pub use solana_program;

// The library uses this to verify the keys
solana_program::declare_id!("SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ");
