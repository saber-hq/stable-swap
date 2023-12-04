//! Program state processor

mod admin;
mod checks;
mod logging;
mod swap;
mod token;
mod utils;

mod test_utils;

use crate::instruction::AdminInstruction;

use solana_program::{account_info::AccountInfo, entrypoint::ProgramResult, pubkey::Pubkey};

/// Program state handler. (and general curve params)
pub struct Processor {}

impl Processor {
    /// Processes an [Instruction](enum.Instruction.html).
    pub fn process(program_id: &Pubkey, accounts: &[AccountInfo], input: &[u8]) -> ProgramResult {
        let instruction = AdminInstruction::unpack(input)?;
        match instruction {
            None => swap::process_swap_instruction(program_id, accounts, input),
            Some(admin_instruction) => {
                admin::process_admin_instruction(&admin_instruction, accounts)
            }
        }
    }
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;
    use crate::processor::test_utils::*;
    use solana_program::program_error::ProgramError;
    use solana_sdk::account::Account;
    use spl_token::instruction::mint_to;

    #[test]
    fn test_token_program_id_error() {
        let swap_key = pubkey_rand();
        let mut mint = (pubkey_rand(), Account::default());
        let mut destination = (pubkey_rand(), Account::default());
        let token_program = (spl_token::id(), Account::default());
        let (authority_key, nonce) =
            Pubkey::find_program_address(&[&swap_key.to_bytes()[..]], &SWAP_PROGRAM_ID);
        let mut authority = (authority_key, Account::default());
        let swap_bytes = swap_key.to_bytes();
        let authority_signature_seeds = [&swap_bytes[..32], &[nonce]];
        let signers = &[&authority_signature_seeds[..]];
        let ix = mint_to(
            &token_program.0,
            &mint.0,
            &destination.0,
            &authority.0,
            &[],
            10,
        )
        .unwrap();
        let mint = (&mut mint).into();
        let destination = (&mut destination).into();
        let authority = (&mut authority).into();

        let err =
            solana_program::program::invoke_signed(&ix, &[mint, destination, authority], signers)
                .unwrap_err();
        assert_eq!(err, ProgramError::InvalidAccountData);
    }
}
