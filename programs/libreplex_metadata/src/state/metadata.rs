use crate::errors::ErrorCode;
use anchor_lang::prelude::*;

use anchor_lang::{AnchorDeserialize, AnchorSerialize};

use crate::{License, MetadataExtension, Royalties};

/*
    Asset replaces URL and provides both backwards compatibility and flexibility

    Examples of asset set-ups for different asset types

    1) SPL tokens:
        Asset::Image{ url: String}
        specifying only an image when JSON is not needed
        OR
        Asset::Json{ url: String}
        specifying a link to static JSON when JSON is needed


    2) 1/1 NFTs:

        Asset::Json{ url: String}
        specifying a static url image pointing to a https:// that hosts/serves the JSON

    2) Large collections:
        JsonTemplate: {url_param: String}
        Specifying a url_param when most of the URL address is repeated for every item in the collection, this optimises rent

    3) Dynamic applications (gaming etc) could be configured in many different ways such
        1) Asset::Json{ url: String} with
                url = https://metadata.libreplex.io/api/offchaindata/<mintId> (or any similar API)
        2) Asset::JsonTemplate{ url_parameter: String} with
                url_parameter = <mintId>
                (on group) url_template = https://metadata.libreplex.io/api/offchaindata/{{mintId}}
        3) Asset::Image{ url: String} with
                url = <custom renderer image API>
        4) Asset::ChainRenderer {program_id: Pubkey} with
                program_id = <address of on-chain rendering program that generates image content>

*/
#[derive(Clone, AnchorDeserialize, AnchorSerialize)]
pub enum Asset {
    None,
    Json { url: String },
    JsonTemplate { url_parameter: String },
    Image { url: String, description: Option<String> },
    ChainRenderer { 
        // This is where the renderer program will write the output of a render call to
        render_output_address: Pubkey,
        program_id: Pubkey, 
        description: Option<String> },
    Inscription { account_id: Pubkey, data_type: String, description: Option<String> },
}

impl Asset {
    pub const BASE_SIZE: usize = 2;
    pub fn get_size(&self) -> usize {
        return Asset::BASE_SIZE
            + match self {
                Asset::None => 0,
                Asset::Json { url } => 4 + url.len(),
                Asset::JsonTemplate { url_parameter } => 4 + url_parameter.len(),
                Asset::Image { url , description} => 4 + url.len() + 1 + match &description {Some(x) => 4 + x.len(), None => 0},
                Asset::ChainRenderer { render_output_address: _, program_id: _, description } => 32 + 32 + 1  + match &description {Some(x) => 4 + x.len(), None => 0},
                // Asset::Inscription { account_id: _, description } => 32 + 1  + match &description {Some(x) => 4 + x.len(), None => 0},
                Asset::Inscription { account_id: _, data_type, description } => 32 
                + 4 + data_type.len()
                + 1 + match &description {Some(x) => 4 + x.len(), None => 0}
                
            };
    }
}

#[account]
pub struct Metadata {
    // the mint address of the token to which the metadata refers
    pub mint: Pubkey,

    pub update_authority: Pubkey,

    // First ever creator cannot be changed
    pub creator: Pubkey,

    pub is_mutable: bool,

    pub group: Option<Pubkey>,

    pub name: String,

    pub symbol: String,

    pub asset: Asset,

    pub extension: MetadataExtension,
}

impl Metadata {
    pub const BASE_SIZE: usize = 8 
        // mint
        + 32 
        // ua
        + 32 
        // creator
        + 32 
        // is mutable
        + 1 
        // group
        + 1 + 32;

    pub fn get_size(&self) -> usize {
        let size = Metadata::BASE_SIZE
            + 4
            + self.name.len()
            + 4
            + self.symbol.len()
            + 4
            + self.asset.get_size()
            + 1
            + self.extension.get_size();

        return size;
    }
}

#[derive(Clone, AnchorDeserialize, AnchorSerialize)]
pub struct AttributesInput {
    pub attributes: Vec<u8>,
    /*
        we purposefully omit the signers from here
        as every metadata starts its life with no
        signers. signatures are added separately
        in accordance with permitted signers
    */
}

impl AttributesInput {
    pub fn get_size(&self) -> usize {
        let size = 4 + self.attributes.len();

        return size;
    }
}

#[derive(Clone, AnchorDeserialize, AnchorSerialize)]
pub struct MetadataExtensionInput {
    pub attributes: Vec<u8>, // base: 4
    pub royalties: Option<Royalties>,
}

impl MetadataExtensionInput {
    pub const BASE_SIZE: usize = 4 + 1 + 1;

    pub fn get_size(&self) -> usize {
        MetadataExtensionInput::BASE_SIZE
            + self.attributes.len()
            + match &self.royalties {
                Some(x) => x.get_size(),
                None => 0,
            }
    }
}

pub fn validate_extend_metadata_input(metadata_input: &MetadataExtensionInput) -> Result<()> {
    match &metadata_input.royalties {
        Some(royalties) => {
            let total_shares: u16 = royalties.shares.iter().map(|x| x.share).sum();
            if total_shares != 10000 {
                return Err(ErrorCode::RoyaltiesBadSum.into());
            }
        }
        None => {}
    }

    /*
        ensure that the initial render mode of the metadata matches the
        currently active render mode of the collection.

        NB: It is possible to change the active render mode of the collection.
        If that happens, it is the responsibility of the update auth holder
        to add the appropriate render mode data to each metadata.

    */

    // render_mode_data.is_compatible_with(&collection.collection_render_mode);

    // Ensure that the lengths of strings do not exceed the maximum allowed length

    Ok(())
}

#[repr(C)]
#[derive(Clone, AnchorDeserialize, AnchorSerialize)]
pub struct CreateMetadataInput {
    pub name: String,
    pub symbol: String,
    pub asset: Asset,
    pub update_authority: Pubkey,
    pub extension: MetadataExtension,
}

impl CreateMetadataInput {
    pub fn get_size(&self) -> usize {
        let size = 4
            + self.name.len()
            + 4
            + self.symbol.len()
            + 4
            + self.asset.get_size()
            + self.extension.get_size();

        return size;
    }
}

#[derive(Clone, AnchorDeserialize, AnchorSerialize)]
pub struct UpdateMetadataInput {
    pub name: String,
    pub symbol: String,
    pub asset: Asset,
}

impl UpdateMetadataInput {
    pub fn get_size(&self) -> usize {
        let size = 4
            + self.name.len()
            + 4
            + self.symbol.len()
            + 4
            + self.asset.get_size();

        return size;
    }
}

#[derive(Clone, AnchorDeserialize, AnchorSerialize)]
pub enum MetadataEventType {
    Create,
    Update,
    Delete,
}

#[event]
pub struct MetadataEvent {
    pub id: Pubkey,
    pub mint: Pubkey,
    pub event_type: MetadataEventType,
}
