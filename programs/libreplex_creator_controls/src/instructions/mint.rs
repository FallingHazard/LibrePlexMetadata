use anchor_lang::{prelude::*};

use crate::state::{Phase, CreatorController, Accounts, RemainingAccountsCtx, ArgCtx};
use crate::controls::Control;
use crate::errors::ErrorCode;

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct MintInput {
    pub args: Vec<Vec<u8>>,
    pub chosen_phase: Option<String>,
}

#[derive(Accounts)]
#[instruction(input: MintInput)]
pub struct Mint<'info> {
    #[account(mut)]
    pub creator_controller: Account<'info, CreatorController>,

    #[account(mut)]
    pub buyer: Signer<'info>,

    pub mint: Signer<'info>,

    /// CHECK: checked in cpi
    #[account(mut)]
    pub creator: AccountInfo<'info>,

    /// CHECK: checked in cpi
    #[account(mut)]
    pub metadata: AccountInfo<'info>,

    /// CHECK: checked in cpi
    #[account(mut)]
    pub group: AccountInfo<'info>,

    /// CHECK: checked in cpi
    #[account(mut)]
    pub group_permissions: AccountInfo<'info>,

  /// CHECK: checked in cpi
    #[account(mut)]
    pub minter_numbers: Option<AccountInfo<'info>,>,

    pub system_program: Program<'info, System>,


    /// CHECK: checked in cpi
    #[account(address = libreplex_metadata::id())]
    pub libreplex_metadata_program: AccountInfo<'info>,

    
    /// CHECK: checked in cpi
    #[account(address = solana_program::sysvar::slot_hashes::id())]
    recent_slothashes: AccountInfo<'info>,

    /// CHECK: checked in cpi
    pub attribute_config: Option<AccountInfo<'info>,>,

    /// CHECK: Only check address
    #[account(address = libreplex_creator::id())]
    pub libreplex_creator_program: AccountInfo<'info>,
}                 

pub fn handler<'a, 'b, 'c, 'info>(ctx: Context<'a, 'b, 'c, 'info, Mint<'info>>, input: MintInput) -> Result<()> {
    let controller = &mut ctx.accounts.creator_controller;

    let mut accounts = Accounts {
        creator: ctx.accounts.creator.to_account_info(),
        buyer: ctx.accounts.buyer.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        metadata: ctx.accounts.metadata.to_account_info(),
        group: ctx.accounts.group.to_account_info(),
        group_permissions: ctx.accounts.group_permissions.to_account_info(),
        minter_numbers: ctx.accounts.minter_numbers.as_ref().map(|c| c.to_account_info()),
        system_program: ctx.accounts.system_program.to_account_info(),
        libreplex_metadata_program: ctx.accounts.libreplex_metadata_program.to_account_info(),
        recent_slothashes: ctx.accounts.recent_slothashes.to_account_info(),
        attribute_config: ctx.accounts.attribute_config.as_ref().map(|c| c.to_account_info()),
        remaining_accounts: RemainingAccountsCtx { accounts: ctx.remaining_accounts, current: 0 },
    };

    let clock = Clock::get()?;

    let mut active_phases: Vec<&Phase> = controller.phases.iter().filter(|p| {
        clock.unix_timestamp > p.start && (p.end.is_none() || clock.unix_timestamp < p.end.unwrap()) 
    }).collect();

    if active_phases.len() == 0 {
        return Err(ErrorCode::NoActivePhases.into())
    }


    let active_phase = match input.chosen_phase {
        Some(chosen_phase) => {
            let mut matching_phases: Vec<&Phase> = active_phases.into_iter().filter(|p| {
                p.label == chosen_phase
            }).collect();

            if matching_phases.len() != 1 {
                return Err(ErrorCode::PhaseNotSpecified.into())
            }

            matching_phases.pop().unwrap()
        },
        None => {   
            if active_phases.len() != 1 {
                return Err(ErrorCode::PhaseNotSpecified.into())
            }

            active_phases.pop().unwrap()
        },
    };

    let mut arg_ctx = ArgCtx { args: input.args, current: 0 };



    for control in &active_phase.controls {
        control.before_mint(&mut accounts, &mut arg_ctx)?;
    }

    let controller_seeds: [&[u8]; 2] = [controller.seed.as_ref(), &[controller.bump]];

    let signer_seeds = [controller_seeds.as_slice()];

    
    let mint_accounts = libreplex_creator::cpi::accounts::Mint {
        buyer: accounts.buyer.to_account_info(),
        mint_authority: controller.to_account_info(),
        mint: accounts.mint.to_account_info(),
        creator: accounts.creator.to_account_info(),
        metadata: accounts.metadata.to_account_info(),
        group: accounts.group.to_account_info(),
        metadata_extension: accounts.metadata_extension.to_account_info(),
        group_permissions: accounts.group_permissions.to_account_info(),
        minter_numbers: accounts.minter_numbers.as_ref().map(|a| {a.to_account_info()}),
        system_program: accounts.system_program.to_account_info(),
        libreplex_metadata_program: accounts.libreplex_metadata_program.to_account_info(),
        recent_slothashes: accounts.recent_slothashes.to_account_info(),
        attribute_config: accounts.attribute_config.as_ref().map(|a| {a.to_account_info()}),
    };

    let mint_ctx = CpiContext::new_with_signer(ctx.accounts.libreplex_creator_program.to_account_info(), mint_accounts, &signer_seeds);

    libreplex_creator::cpi::mint(mint_ctx)?;

    for control in &active_phase.controls {
        control.after_mint(&mut accounts, &mut arg_ctx)?;
    }

    Ok(())
}
