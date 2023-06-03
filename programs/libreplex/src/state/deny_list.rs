use anchor_lang::prelude::*;


#[account]
pub struct DenyList {
    pub authority: Pubkey,
    pub denied_programs: Vec<Pubkey>
}

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct DenyListInput {
    pub denied_programs: Vec<Pubkey>,
}

impl DenyListInput {
    pub fn get_size(&self) -> usize {
        return 4 + 32 * self.denied_programs.len()
    }
}


