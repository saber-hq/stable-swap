use crate::native_account_data::NativeAccountData;
use solana_sdk::{
    account::Account,
    account_info::AccountInfo,
    entrypoint::ProgramResult,
    instruction::Instruction,
};

pub fn do_process_instruction(instruction: Instruction, accounts: &[AccountInfo]) -> ProgramResult {
    // approximate the logic in the actual runtime which runs the instruction
    // and only updates accounts if the instruction is successful
    let mut account_data = accounts
        .iter()
        .map(NativeAccountData::new_from_account_info)
        .collect::<Vec<_>>();
    let account_infos = account_data
        .iter_mut()
        .map(NativeAccountData::as_account_info)
        .collect::<Vec<_>>();
    let res = if instruction.program_id == stable_swap::id() {
        stable_swap::processor::Processor::process(
            &instruction.program_id,
            &account_infos,
            &instruction.data,
        )
    } else {
        spl_token::processor::Processor::process(
            &instruction.program_id,
            &account_infos,
            &instruction.data,
        )
    };

    if res.is_ok() {
        let mut account_metas = instruction
            .accounts
            .iter()
            .zip(accounts)
            .map(|(account_meta, account)| (&account_meta.pubkey, account))
            .collect::<Vec<_>>();
        for account_info in account_infos.iter() {
            for account_meta in account_metas.iter_mut() {
                if account_info.key == account_meta.0 {
                    let account = &mut account_meta.1;
                    let mut lamports = account.lamports.borrow_mut();
                    **lamports = **account_info.lamports.borrow();
                    let mut data = account.data.borrow_mut();
                    data.clone_from_slice(*account_info.data.borrow());
                }
            }
        }
    }
    res
}
