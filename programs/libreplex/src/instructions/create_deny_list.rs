use anchor_lang::prelude::*;
use crate::deny_list::{DenyList, DenyListInput};


#[derive(Accounts)]
#[instruction(denylist_input: DenyListInput)]
pub struct CreateDenyList<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(init,
        space = 8 + 32 + denylist_input.get_size(), 
        payer = authority)]
    pub deny_list: Box<Account<'info, DenyList>>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateDenyList>,
    denylist_input: DenyListInput,
) -> Result<()> {
    let deny_list = &mut ctx.accounts.deny_list;

    deny_list.authority = ctx.accounts.authority.key();
    deny_list.denied_programs = denylist_input.denied_programs;
    Ok(())
}
