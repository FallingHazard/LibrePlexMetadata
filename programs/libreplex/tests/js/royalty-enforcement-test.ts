import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Libreplex } from "../../../../target/types/libreplex";
import {EvilMarketplaceTest} from "../../../../target/types/evil_marketplace_test"
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SYSVAR_INSTRUCTIONS_PUBKEY, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { expect } from 'chai';
import exp from "constants";
import {transfer, TOKEN_2022_PROGRAM_ID, createMint, TOKEN_PROGRAM_ID, createAssociatedTokenAccount, mintTo, TokenInstruction, createInitializeMintInstruction, MINT_SIZE} from "@solana/spl-token"
import { struct, u16, u8, seq  } from '@solana/buffer-layout';
import { publicKey, u64 } from '@solana/buffer-layout-utils';

const TRANSFER_HOOK_ID = "HbhCGHxUmHFn8wA5PQCFya8nom4Zeacpit5SxottTmA"
const INITIALIZE_EXTRA_ACCOUNT_METAS_DISCRIMINATOR = [43, 34, 13, 49, 167, 88, 235, 235];

// pub fn get_extra_account_metas_address_and_bump_seed(
//   mint: &Pubkey,
//   program_id: &Pubkey,
// ) -> (Pubkey, u8) {
//   Pubkey::find_program_address(&collect_extra_account_metas_seeds(mint), program_id)
// }

//   [EXTRA_ACCOUNT_METAS_SEED, mint.as_ref()]
//  b"extra-account-metas";
function getExtraAccountMetasAddressAndBumpSeed(mint: PublicKey, programId: PublicKey) {
  return PublicKey.findProgramAddressSync([Buffer.from("extra-account-metas"), mint.toBuffer()], programId)[0]
}

enum MyTokenInstruction {
  HOOKINSTRUCTION = 36,
}

interface InitializeTransferHookInit {
  instruction: MyTokenInstruction.HOOKINSTRUCTION,
  transferHookInstruction: 0,
  authority: PublicKey,
  transferHookProgramId: PublicKey,
}

interface InitializeExtraAccountMeta {
  discriminator: number[],
}

const initializeExtraAccountMetaInstructionData = struct<InitializeExtraAccountMeta>([
  seq(u8(), 8, "discriminator")
])

const initializeTransferHookInitInstructionData = struct<InitializeTransferHookInit>([
  u8('instruction'),
  u8('transferHookInstruction'),
  publicKey("authority"),
  publicKey("transferHookProgramId")
]);


const DENY_LIST_PROGRAM_ID = ""

describe("royalty-enforcement-test", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Libreplex as Program<Libreplex>;
  const marketProgram = anchor.workspace.EvilMarketplaceTest as Program<EvilMarketplaceTest>


  console.log(anchor.workspace)

  const connection = program.provider.connection;

  it("is royalty enforced", async () => {
    const authority = anchor.getProvider().publicKey
    const collectionSeed = Keypair.generate();
    const collection = PublicKey.findProgramAddressSync([Buffer.from("collection"), collectionSeed.publicKey.toBuffer()], program.programId)[0]
    const userPermissions = PublicKey.findProgramAddressSync([Buffer.from("permissions"), collection.toBuffer(), authority.toBuffer()], program.programId)[0]
  
      const mintAuth = Keypair.generate()
      const mint = Keypair.generate()
      const metadata = PublicKey.findProgramAddressSync([Buffer.from("metadata"), mint.publicKey.toBuffer()], program.programId)[0]
      const metadataName = "COOLMETA"

      const buyer = Keypair.generate()

      // Create mint auth
      await program.provider.sendAndConfirm(new Transaction().add(SystemProgram.createAccount({
        fromPubkey: authority,
        lamports: LAMPORTS_PER_SOL,
        newAccountPubkey: mintAuth.publicKey,
        programId: SystemProgram.programId,
        space: 0,
      })), [mintAuth])


      // Setup mint and transfer hook
      {
        const createMintAccIx = SystemProgram.createAccount({
          fromPubkey: mintAuth.publicKey,
          lamports: await connection.getMinimumBalanceForRentExemption(234),
          space: 234,
          programId: TOKEN_2022_PROGRAM_ID,
          newAccountPubkey: mint.publicKey,
        })
        const accounts = [{ pubkey: mint.publicKey, isSigner: false, isWritable: true }];
        const transferHookIxBuf = Buffer.alloc(initializeTransferHookInitInstructionData.span)
        initializeTransferHookInitInstructionData.encode({
          authority: mintAuth.publicKey,
          transferHookProgramId: new PublicKey(TRANSFER_HOOK_ID),
          instruction: MyTokenInstruction.HOOKINSTRUCTION,
          transferHookInstruction: 0,
        }, transferHookIxBuf);
  
        const initHookIx = new TransactionInstruction({
          keys: accounts,
          programId: TOKEN_2022_PROGRAM_ID,
          data: transferHookIxBuf
        })

  
        const initMintIx =      createInitializeMintInstruction(mint.publicKey, 0, mintAuth.publicKey, mintAuth.publicKey, TOKEN_2022_PROGRAM_ID)

        await program.provider.sendAndConfirm(new Transaction().add(createMintAccIx, initHookIx, initMintIx), [mint, mintAuth], {
          skipPreflight: true,
        })
      }

      const denyListKp = Keypair.generate()

      console.log("Creating deny list")
      // Setup deny list
      {
        await program.methods.createDenyList({
          deniedPrograms: [],
        }).accounts({
          authority: mintAuth.publicKey,
          denyList: denyListKp.publicKey,
          systemProgram: SystemProgram.programId
        }).signers([mintAuth, denyListKp]).rpc()
      }

      console.log("Created")
      const extraAccountMeta = getExtraAccountMetasAddressAndBumpSeed(mint.publicKey, new PublicKey(TRANSFER_HOOK_ID));


      // Setup extra account meta
      // This tells the hook that it requires sysvar ix and the deny list account
      console.log("Initializing extra account meta")
      {
        const accounts = [{ pubkey: extraAccountMeta, isSigner: false, isWritable: true }, {
          pubkey: mint.publicKey,
          isSigner: false,
          isWritable: true,
        }, {
          pubkey: mintAuth.publicKey,
          isSigner: true,
          isWritable: true,
        },{
          pubkey: SystemProgram.programId,
          isSigner: false,
          isWritable: false,
        }, {
          pubkey: denyListKp.publicKey,
          isSigner: false,
          isWritable: false,
        }, {
          pubkey: SYSVAR_INSTRUCTIONS_PUBKEY,
          isSigner: false,
          isWritable: false,
        }];

        const initExtraAccountMetaBuf = Buffer.alloc(initializeExtraAccountMetaInstructionData.span)
        initializeExtraAccountMetaInstructionData.encode({
          discriminator: INITIALIZE_EXTRA_ACCOUNT_METAS_DISCRIMINATOR,
        }, initExtraAccountMetaBuf)

        const initExtraAccontMetaIx = new TransactionInstruction({
          keys: accounts,
          programId: new PublicKey(TRANSFER_HOOK_ID),
          data: initExtraAccountMetaBuf,
        })

        await program.provider.sendAndConfirm(new Transaction().add(initExtraAccontMetaIx), [mintAuth], {
          skipPreflight: true,
        })
      }

      console.log("Initialized")

      const sellerAccount = await createAssociatedTokenAccount(connection, mintAuth, mint.publicKey, mintAuth.publicKey, undefined, TOKEN_2022_PROGRAM_ID)
      const buyerAccount = await createAssociatedTokenAccount(connection, mintAuth, mint.publicKey, buyer.publicKey, undefined, TOKEN_2022_PROGRAM_ID)
      await mintTo(connection, mintAuth, mint.publicKey, sellerAccount, mintAuth, 1, undefined, undefined, TOKEN_2022_PROGRAM_ID)
    
      const marketplaceAdmin  = PublicKey.findProgramAddressSync([Buffer.from("admin")], marketProgram.programId)[0];

      await marketProgram.methods.list().accounts({
        
        lister: mintAuth.publicKey,
        mint: mint.publicKey,
        systemProgram: SystemProgram.programId,
        tokenAccount: sellerAccount,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        marketplaceAdmin,
      }).signers([mintAuth]).rpc({
        skipPreflight: true,
      })

      console.log("Listed")
      await marketProgram.methods.sell().accounts({
        buyer: buyer.publicKey,
        marketplaceAdmin,
        mint: mint.publicKey,
        sourceTokenAccount: sellerAccount,
        targetTokenAccount: buyerAccount,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .remainingAccounts([
        { pubkey: extraAccountMeta, isSigner: false, isWritable: false }, 
        {
        pubkey: denyListKp.publicKey,
        isSigner: false,
        isWritable: false,
      }, 
      {
        pubkey: SYSVAR_INSTRUCTIONS_PUBKEY,
        isSigner: false,
        isWritable: false,
      }, {
        pubkey: new PublicKey(TRANSFER_HOOK_ID),
        isSigner: false,
        isWritable: false,
      }])
      .signers([buyer]).rpc({
        skipPreflight: true,
      })

      console.log("Denying the program")
      // Deny the program
      await program.methods.editDenyList({
        deniedPrograms: [new PublicKey(marketProgram.programId)],
      }).accounts({
        authority: mintAuth.publicKey,
        systemProgram: SystemProgram.programId,
        denyList: denyListKp.publicKey,
      }).signers([mintAuth]).rpc({
        skipPreflight: true,
      })
      console.log("Denied")

      // Now the buyer has the nft so he is the seller

      
      console.log("Re listing")
      await marketProgram.methods.list().accounts({
        lister: buyer.publicKey,
        mint: mint.publicKey,
        systemProgram: SystemProgram.programId,
        tokenAccount: buyerAccount,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        marketplaceAdmin,
      }).signers([buyer]).rpc({
        skipPreflight: true,
      })
      
      console.log("Purchasing")
      try {
        await marketProgram.methods.sell().accounts({
          buyer: mintAuth.publicKey,
          marketplaceAdmin,
          mint: mint.publicKey,
          sourceTokenAccount: buyerAccount,
          targetTokenAccount: sellerAccount,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .remainingAccounts([
          { pubkey: extraAccountMeta, isSigner: false, isWritable: false }, 
          {
          pubkey: denyListKp.publicKey,
          isSigner: false,
          isWritable: false,
        }, 
        {
          pubkey: SYSVAR_INSTRUCTIONS_PUBKEY,
          isSigner: false,
          isWritable: false,
        }, {
          pubkey: new PublicKey(TRANSFER_HOOK_ID),
          isSigner: false,
          isWritable: false,
        }])
        .signers([mintAuth]).rpc({
          skipPreflight: true,
        })
      } catch (e) {
        
      }



      console.log("Hook setup")

      // await program.methods.createMetadata({
      //   renderModeData: {
      //     url: {
      //       url: "",
      //     }
      //   },
      //   name: metadataName,
      //   nftMetadata: null,
      // }).accounts({
      //   mint: mint.publicKey,
      //   collection,
      //   metadata,
      //   systemProgram: SystemProgram.programId,
      //   signer: authority, 
      //   signerCollectionPermissions: userPermissions,
      // }).signers([mint]).rpc()
  


    })
})
