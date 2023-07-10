use crate::{state::{Listing, ListingGroup}, constants::LISTING};
use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token::Token};
use libreplex_shared::transfer_tokens;
use spl_token_2022::{ID as TOKEN_2022_PROGRAM_ID, instruction::close_account};

#[derive(Accounts)]
pub struct Delist<'info> {
    #[account(mut)]
    pub lister: Signer<'info>,

    /// CHECK: Checked against ID constraint
    #[account(
        constraint = mint.owner.eq(&TOKEN_2022_PROGRAM_ID)
    )]
    pub mint: UncheckedAccount<'info>,

    #[account(mut,
        close=lister,
        constraint = listing.lister == lister.key(),
        constraint = listing.mint == mint.key(),
        constraint = listing.group == listing_group.key()
        )]
    pub listing: Account<'info, Listing>,

    /// CHECK: Checked in logic
    #[account(mut)]
    pub escrow_token_account: UncheckedAccount<'info>,

    /// CHECK: Is allowed to be empty in which case we create it
    #[account(mut)]
    pub lister_token_account: UncheckedAccount<'info>,

    /// CHECK: can be empty if the group has been deleted.
    #[account(mut)]
    pub listing_group: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,

    pub associated_token_program: Program<'info, AssociatedToken>,

    pub token_program: Program<'info, Token>,
    
    /// CHECK: Checked against ID constraint
    #[account(
        constraint = token_program_2022.key.eq(&TOKEN_2022_PROGRAM_ID)
    )]
    pub token_program_2022: UncheckedAccount<'info>,
}

pub fn handler<'info>(ctx: Context<'_, '_, '_, 'info, Delist<'info>>) -> Result<()> {

    let escrow_token_account = &ctx.accounts.escrow_token_account;
    let lister_token_account = &ctx.accounts.lister_token_account;
    let mint = &ctx.accounts.mint;
    let listing = &ctx.accounts.listing;
    let listing_group = &mut ctx.accounts.listing_group;
    let lister = &ctx.accounts.lister;
    let associated_token_program = &ctx.accounts.associated_token_program;
    let system_program = &ctx.accounts.system_program;
    let token_program = &ctx.accounts.token_program;
    let token_program_2022 = &ctx.accounts.token_program_2022;

    
    // let's handle both 2022 and trad here just in case.
    let mint_token_program = match escrow_token_account.owner {
        &TOKEN_2022_PROGRAM_ID => token_program_2022.to_account_info(),
        _ => token_program.to_account_info(),
    };

    let mint_key = &mint.key();

    let auth_seeds = &[
        LISTING.as_bytes(),
        &mint_key.as_ref(),
        &[listing.listing_bump],
    ];

    let lister_account_info = &ctx.accounts.lister.to_account_info().clone();
    
    let listing_group_account_info = listing_group.to_account_info();
    if !listing_group_account_info.data_is_empty() {
        let mut listing_group_data = listing_group_account_info.data.borrow_mut();
        // read current number of active listings
        let active_listings = u32::from_le_bytes(listing_group_data[72..76].try_into().unwrap());
        let listing_count_slice: &mut [u8] = &mut listing_group_data[
            72..76
        ];
        
        listing_count_slice.copy_from_slice(&(active_listings-1).to_le_bytes())
        
    } 
    transfer_tokens(
        &mint_token_program,
        &escrow_token_account.to_account_info(),
        &lister_token_account.to_account_info(),
        &listing.to_account_info(),
        &mint.to_account_info(),
        &lister.to_account_info(),
        &associated_token_program.to_account_info(),
        &system_program.to_account_info(),
        Some(&[auth_seeds]),
        &lister_account_info,
        listing.amount,
    )?;

    solana_program::program::invoke_signed(
        &close_account(
            &token_program_2022.key(),
            &escrow_token_account.key(),
            &listing.lister,
            &listing.key(),
            &[],
        )?,
        &[
            escrow_token_account.to_account_info().clone(),
            lister_account_info.clone(),
            listing.to_account_info().clone(),
            token_program_2022.to_account_info().clone(),
        ],
        &[auth_seeds],
    )?;

    Ok(())
}
