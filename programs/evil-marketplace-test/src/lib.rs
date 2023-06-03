use anchor_lang::prelude::*;
use spl_token_2022::instruction::{transfer_checked, approve_checked};

declare_id!("5tQSvNCjigRCP8tMwvpYtURrecwBdWcyCWuANC7d3Ppw");

#[program]
pub mod evil_marketplace_test {
    use solana_program::program::{invoke, invoke_signed};

    use super::*;

    pub fn list(ctx: Context<List>) -> Result<()> {
        let lister = &ctx.accounts.lister;
        let marketplace_admin = &ctx.accounts.marketplace_admin;

        let mint_info = &ctx.accounts.mint;
        let token_account_info = &ctx.accounts.token_account;
      
        let approve_ix = approve_checked(&spl_token_2022::ID, 
            token_account_info.key, 
            mint_info.key, marketplace_admin.key, lister.key, &[], 1, 
            0)?;

        invoke(&approve_ix, 
            &[token_account_info.to_account_info(), 
            mint_info.to_account_info(), 
            marketplace_admin.to_account_info(), 
            lister.to_account_info(), ctx.accounts.token_program.to_account_info()])?;

        Ok(())
    }

    pub fn sell<'info>(ctx: Context<'_, '_, '_, 'info, Sell<'info>>) -> Result<()> {
        let source = &ctx.accounts.source_token_account;
        let mint = &ctx.accounts.mint;
        let destination = &ctx.accounts.target_token_account;
        let marketplace_admin = &ctx.accounts.marketplace_admin;

        let marketplace_admin_bump = ctx.bumps.get("marketplace_admin").expect("Bump is present");

        let admin_signer_seeds = ["admin".as_bytes(), &[*marketplace_admin_bump]];


        let mut transfer_ix = transfer_checked(&spl_token_2022::ID, 
            source.key, 
            mint.key, 
            destination.key, 
            marketplace_admin.key, 
            &[], 
            1, 0)?;

        let remaining_accounts = ctx.remaining_accounts;

        transfer_ix.accounts.extend(remaining_accounts.iter()
        .map(|acc| match acc.is_writable {
            false => AccountMeta::new_readonly(*acc.key, acc.is_signer),
            true => AccountMeta::new(*acc.key, acc.is_signer),
        }));

        let mut infos: Vec<AccountInfo> =  vec![
            source.to_account_info(), 
            mint.to_account_info(), destination.to_account_info(), 
            marketplace_admin.to_account_info(), ctx.accounts.token_program.to_account_info()];
        
        infos.extend(remaining_accounts.iter().map(|acc| {
            acc.to_account_info()
        }));

        invoke_signed(&transfer_ix, infos.as_slice(), &[&admin_signer_seeds])?;

        Ok(())
    }



}


#[derive(Accounts)]
pub struct Sell<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    /// CHECK: No data
    #[account(
        seeds = ["admin".as_ref()], bump)]
    pub marketplace_admin: AccountInfo<'info>,

    /// CHECK: Check in cpi
    pub mint: AccountInfo<'info>,

    /// CHECK: Check in cpi
    #[account(mut)]
    pub source_token_account: AccountInfo<'info>,

    /// CHECK: Check in cpi
    #[account(mut)]
    pub target_token_account: AccountInfo<'info>,

    /// CHECK: Check in cpi
    #[account(address = spl_token_2022::ID)]
    pub token_program: AccountInfo<'info>,
}


#[derive(Accounts)]
pub struct List<'info> {
    #[account(mut)]
    pub lister: Signer<'info>,

    /// CHECK: No data
    #[account(
        seeds = ["admin".as_ref()], bump)]
    pub marketplace_admin: AccountInfo<'info>,

    /// CHECK: Check in cpi
    pub mint: AccountInfo<'info>,

   /// CHECK: Check in cpi
   #[account(mut)]
    pub token_account: AccountInfo<'info>,

    pub system_program: Program<'info, System>,

    /// CHECK: Check in cpi
    #[account(address = spl_token_2022::ID)]
    pub token_program: AccountInfo<'info>,
}