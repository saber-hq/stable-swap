//! An automated market maker for mean-reverting trading pairs.
#![deny(rustdoc::all)]
#![allow(rustdoc::missing_doc_code_examples)]
#![deny(clippy::unwrap_used)]
#![deny(clippy::integer_arithmetic)]
#![deny(missing_docs)]

pub mod entrypoint;
pub mod processor;

pub use stable_swap_client::{error, fees, instruction, state};
pub use stable_swap_math::{curve, math, pool_converter};

pub use stable_swap_client::error::SwapError as ErrorCode;

/// Export current solana-program types for downstream users who may also be
/// building with a different solana-program version
pub use solana_program;

solana_program::declare_id!("SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ");
