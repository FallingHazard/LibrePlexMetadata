//! A comment


use {
    crate::inline_spl_token,
    solana_program::{
        account_info::{next_account_info, AccountInfo},
        entrypoint::ProgramResult,
        msg,
        program::invoke_signed,
        program_error::ProgramError,
        pubkey::Pubkey,
        system_instruction,
    },
    spl_tlv_account_resolution::state::ExtraAccountMetas,
    spl_transfer_hook_interface::{
        collect_extra_account_metas_signer_seeds,
        error::TransferHookError,
        get_extra_account_metas_address, get_extra_account_metas_address_and_bump_seed,
        instruction::{ExecuteInstruction, TransferHookInstruction},
    },
    spl_type_length_value::state::TlvStateBorrowed,
};

use anchor_lang::{AccountDeserialize, ToAccountInfo};
use libreplex::PermissionEventType;
use libreplex::state::deny_list::DenyList;
use solana_program::{serialize_utils::{read_u16, read_pubkey}, sysvar::{self, Sysvar}, rent::Rent};

use crate::errors::DenyListError;

/// Processes an [Execute](enum.TransferHookInstruction.html) instruction.
pub fn process_execute(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    _amount: u64,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();

    let source_account_info = next_account_info(account_info_iter)?;
    let mint_info = next_account_info(account_info_iter)?;
    let destination_account_info = next_account_info(account_info_iter)?;
    let authority_info = next_account_info(account_info_iter)?;
    let extra_account_metas_info = next_account_info(account_info_iter)?;

    // For the example program, we just check that the correct pda and validation
    // pubkeys are provided
    let expected_validation_address = get_extra_account_metas_address(mint_info.key, program_id);
    if expected_validation_address != *extra_account_metas_info.key {
        return Err(ProgramError::InvalidSeeds);
    }

    let data = extra_account_metas_info.try_borrow_data()?;
    let state = TlvStateBorrowed::unpack(&data).unwrap();
    let extra_account_metas =
        ExtraAccountMetas::unpack_with_tlv_state::<ExecuteInstruction>(&state)?;

    // if incorrect number of are provided, error
    let extra_account_infos = account_info_iter.as_slice();
    let account_metas = extra_account_metas.data();

    msg!("{} {}", extra_account_infos.len(), account_metas.len());
    if extra_account_infos.len() != account_metas.len() {
        return Err(TransferHookError::IncorrectAccount.into());
    }

    // Let's assume that they're provided in the correct order
    for (i, account_info) in extra_account_infos.iter().enumerate() {
        msg!("{} {}", account_metas[i].pubkey, account_info.key);
        if &account_metas[i].pubkey != account_info.key {
            return Err(TransferHookError::IncorrectAccount.into());
        }
    }

    msg!("Validated accounts");

    let deny_list_info = extra_account_infos.get(0).expect("Deny List account is provided");
    let mut deny_list_data: &[u8] = &mut deny_list_info.data.borrow();

    let instruction_sysvar_account = extra_account_infos.get(1).expect("Sysvar instructions provided");

    let deny_list = DenyList::try_deserialize(&mut deny_list_data)?;
    let denied_program = deny_list.denied_programs;
    
    {
        let instruction_sysvar = instruction_sysvar_account.data.borrow();
        let mut idx = 0;
        let num_instructions = read_u16(&mut idx, &instruction_sysvar).unwrap();


        for index in 0..num_instructions {
            let mut current = 2 + (index * 2) as usize;
            let start = read_u16(&mut current, &instruction_sysvar).unwrap();

            current = start as usize;
            let num_accounts = read_u16(&mut current, &instruction_sysvar).unwrap();
            current += (num_accounts as usize) * (1 + 32);
            let program_id = read_pubkey(&mut current, &instruction_sysvar).unwrap();

                
                // Should maybe use a hash list
            let denied = denied_program.contains(&program_id);

            if denied {
                return Err(DenyListError::ProgramDenied.into());
            }
        }
    }

    let denied = denied_program.contains(source_account_info.owner) || 
                        denied_program.contains(destination_account_info.owner) || 
                        denied_program.contains(authority_info.owner);

    if denied {
        return Err(DenyListError::ProgramDenied.into());
    }

    Ok(())
}

/// Processes a [InitializeExtraAccountMetas](enum.TransferHookInstruction.html) instruction.
pub fn process_initialize_extra_account_metas(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();

    let extra_account_metas_info = next_account_info(account_info_iter)?;
    let mint_info = next_account_info(account_info_iter)?;
    let authority_info = next_account_info(account_info_iter)?;
    let _system_program_info = next_account_info(account_info_iter)?;

    // check that the mint authority is valid without fully deserializing
    let mint_authority = inline_spl_token::get_mint_authority(&mint_info.try_borrow_data()?)?;
    let mint_authority = mint_authority.ok_or(TransferHookError::MintHasNoMintAuthority)?;

    // Check signers
    if !authority_info.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    if *authority_info.key != mint_authority {
        return Err(TransferHookError::IncorrectMintAuthority.into());
    }

    // Check validation account
    let (expected_validation_address, bump_seed) =
        get_extra_account_metas_address_and_bump_seed(mint_info.key, program_id);
    if expected_validation_address != *extra_account_metas_info.key {
        return Err(ProgramError::InvalidSeeds);
    }

    // Create the account
    let bump_seed = [bump_seed];
    let signer_seeds = collect_extra_account_metas_signer_seeds(mint_info.key, &bump_seed);
    let extra_account_infos = account_info_iter.as_slice();
    let length: usize = extra_account_infos.len();
    let account_size = ExtraAccountMetas::size_of(length)?;
   
    let rent = solana_program::sysvar::rent::Rent::get().unwrap();

    invoke_signed(
        &system_instruction::create_account(authority_info.key, extra_account_metas_info.key,    
            rent.minimum_balance(account_size), account_size as u64, program_id),
        &[extra_account_metas_info.clone(), authority_info.to_account_info()],
        &[&signer_seeds],
    )?;

    // Write the data
    let mut data = extra_account_metas_info.try_borrow_mut_data()?;
    ExtraAccountMetas::init_with_account_infos::<ExecuteInstruction>(
        &mut data,
        extra_account_infos,
    )?;

    Ok(())
}

/// Processes an [Instruction](enum.Instruction.html).
pub fn process(program_id: &Pubkey, accounts: &[AccountInfo], input: &[u8]) -> ProgramResult {
    let instruction = TransferHookInstruction::unpack(input)?;

    match instruction {
        TransferHookInstruction::Execute { amount } => {
            msg!("Instruction: Execute");
            process_execute(program_id, accounts, amount)
        }
        TransferHookInstruction::InitializeExtraAccountMetas => {
            msg!("Instruction: InitializeExtraAccountMetas");
            process_initialize_extra_account_metas(program_id, accounts)
        }
    }
}