//! A comment
#![allow(clippy::integer_arithmetic)]
#![cfg_attr(not(test), forbid(unsafe_code))]


pub mod errors;
pub mod processor;
pub mod inline_spl_token;

#[cfg(not(feature = "no-entrypoint"))]
mod entrypoint;

