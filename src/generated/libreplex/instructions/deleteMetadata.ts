/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as beet from '@metaplex-foundation/beet'
import * as web3 from '@solana/web3.js'

/**
 * @category Instructions
 * @category DeleteMetadata
 * @category generated
 */
export const deleteMetadataStruct = new beet.BeetArgsStruct<{
  instructionDiscriminator: number[] /* size: 8 */
}>(
  [['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)]],
  'DeleteMetadataInstructionArgs'
)
/**
 * Accounts required by the _deleteMetadata_ instruction
 *
 * @property [_writable_, **signer**] authority
 * @property [_writable_] metadata
 * @property [] metadataNft
 * @property [_writable_] mint
 * @category Instructions
 * @category DeleteMetadata
 * @category generated
 */
export type DeleteMetadataInstructionAccounts = {
  authority: web3.PublicKey
  metadata: web3.PublicKey
  metadataNft: web3.PublicKey
  mint: web3.PublicKey
  systemProgram?: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const deleteMetadataInstructionDiscriminator = [
  7, 241, 181, 162, 214, 254, 84, 251,
]

/**
 * Creates a _DeleteMetadata_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @category Instructions
 * @category DeleteMetadata
 * @category generated
 */
export function createDeleteMetadataInstruction(
  accounts: DeleteMetadataInstructionAccounts,
  programId = new web3.PublicKey('L1BRc7ZYjj7t9k7E5xbdnKy3KhaY6sTcJx4gAsqxUbh')
) {
  const [data] = deleteMetadataStruct.serialize({
    instructionDiscriminator: deleteMetadataInstructionDiscriminator,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.authority,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: accounts.metadata,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.metadataNft,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.mint,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.systemProgram ?? web3.SystemProgram.programId,
      isWritable: false,
      isSigner: false,
    },
  ]

  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc)
    }
  }

  const ix = new web3.TransactionInstruction({
    programId,
    keys,
    data,
  })
  return ix
}
