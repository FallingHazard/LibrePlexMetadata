use num_derive::FromPrimitive;
use solana_program::{
    decode_error::DecodeError,
    msg,
    program_error::{PrintProgramError, ProgramError},
};
use thiserror::Error;


#[derive(Clone, Debug, Eq, Error, FromPrimitive, PartialEq)]
pub enum DenyListError {
    /// Incorrect account provided
    #[error("Incorrect account provided")]
    ProgramDenied = 6006,
}

impl From<DenyListError> for ProgramError {
    fn from(e: DenyListError) -> Self {
        ProgramError::Custom(e as u32)
    }
}
