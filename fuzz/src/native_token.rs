use crate::native_account_data::NativeAccountData;
use solana_sdk::pubkey::Pubkey;
use spl_token::{
    option::COption,
    pack::Pack as TokenPack,
    state::{Account as TokenAccount, AccountState as TokenAccountState, Mint},
};

pub fn create_mint(owner: &Pubkey) -> NativeAccountData {
    let mut account_data = NativeAccountData::new(Mint::LEN, spl_token::id());
    let mint = Mint {
        is_initialized: true,
        mint_authority: COption::Some(*owner),
        ..Default::default()
    };
    Mint::pack(mint, &mut account_data.data[..]).unwrap();
    account_data
}

pub fn create_token_account(
    mint_account: &mut NativeAccountData,
    owner: &Pubkey,
    amount: u64,
) -> NativeAccountData {
    let mut mint = Mint::unpack(&mint_account.data).unwrap();
    let mut account_data = NativeAccountData::new(TokenAccount::LEN, spl_token::id());
    let account = TokenAccount {
        state: TokenAccountState::Initialized,
        mint: mint_account.key,
        owner: *owner,
        amount,
        ..Default::default()
    };
    mint.supply += amount;
    Mint::pack(mint, &mut mint_account.data[..]).unwrap();
    TokenAccount::pack(account, &mut account_data.data[..]).unwrap();
    account_data
}
