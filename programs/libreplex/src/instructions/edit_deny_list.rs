use anchor_lang::prelude::*;
use crate::deny_list::{DenyList, DenyListInput};


#[derive(Accounts)]
#[instruction(denylist_input: DenyListInput)]
pub struct EditDenyList<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut, has_one = authority, 
        realloc = 8 + 32 + denylist_input.get_size(), 
        realloc::payer = authority, 
        realloc::zero = false)]
    pub deny_list: Box<Account<'info, DenyList>>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<EditDenyList>,
    denylist_input: DenyListInput,
) -> Result<()> {
    let deny_list = &mut ctx.accounts.deny_list;

    deny_list.denied_programs = denylist_input.denied_programs;
    Ok(())
}
