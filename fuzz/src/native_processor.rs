use crate::native_account_data::NativeAccountData;

use stable_swap::{processor::Processor}

use solana_sdk::{
    account_info::AccountInfo, entrypoint::ProgramResult, instruction::Instruction,
};

use spl_token::processor::Processor as SplProcessor;

pub fn do_process_instruction(
    instruction: Instruction,
    accounts: Vec<&mut Account>,
) -> ProgramResult {
    // approximate the logic in the actual runtime which runs the instruction
    // and only updates accounts if the instruction is successful
    let mut account_clones = accounts.iter().map(|x| (*x).clone()).collect::<Vec<_>>();
    let mut meta = instruction
        .accounts
        .iter()
        .zip(account_clones.iter_mut())
        .map(|(account_meta, account)| (&account_meta.pubkey, account_meta.is_signer, account))
        .collect::<Vec<_>>();
    let mut account_infos = create_is_signer_account_infos(&mut meta);
    let res = if instruction.program_id == SWAP_PROGRAM_ID {
        Processor::process(&instruction.program_id, &account_infos, &instruction.data)
    } else {
        SplProcessor::process(&instruction.program_id, &account_infos, &instruction.data)
    };

    if res.is_ok() {
        let mut account_metas = instruction
            .accounts
            .iter()
            .zip(accounts)
            .map(|(account_meta, account)| (&account_meta.pubkey, account))
            .collect::<Vec<_>>();
        for account_info in account_infos.iter_mut() {
            for account_meta in account_metas.iter_mut() {
                if account_info.key == account_meta.0 {
                    let account = &mut account_meta.1;
                    account.owner = *account_info.owner;
                    account.lamports = **account_info.lamports.borrow();
                    account.data = account_info.data.borrow().to_vec();
                }
            }
        }
    }
    res
}