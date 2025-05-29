import {
  BlockhashWithExpiryBlockHeight,
  Keypair,
  PublicKey,
  SystemProgram,
  Connection,
  TransactionMessage,
  VersionedTransaction,
  LAMPORTS_PER_SOL,
  Transaction,
} from "@solana/web3.js";
import axios from "axios";
import bs58 from "bs58";
import { Currency, CurrencyAmount } from "@raydium-io/raydium-sdk";
import { connection } from "../config";
import { NATIVE_MINT, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as spl from "@solana/spl-token";

const jito_Validators = [
  "DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh",
  "ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt",
  "3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT",
  "HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe",
  "ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49",
  "Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY",
  "DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL",
  "96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5",
];
const endpoints = [
  // TODO: Choose a jito endpoint which is closest to your location, and uncomment others
  "https://mainnet.block-engine.jito.wtf/api/v1/bundles",
  "https://amsterdam.mainnet.block-engine.jito.wtf/api/v1/bundles",
  "https://frankfurt.mainnet.block-engine.jito.wtf/api/v1/bundles",
  "https://ny.mainnet.block-engine.jito.wtf/api/v1/bundles",
  "https://tokyo.mainnet.block-engine.jito.wtf/api/v1/bundles",
];

/**
 * Generates a random validator from the list of jito_Validators.
 * @returns {PublicKey} A new PublicKey representing the random validator.
 */
export async function getRandomValidator() {
  const res =
    jito_Validators[Math.floor(Math.random() * jito_Validators.length)];
  return new PublicKey(res);
}
/**
 * Executes and confirms a Jito transaction.
 * @param {Transaction} transaction - The transaction to be executed and confirmed.
 * @param {Account} payer - The payer account for the transaction.
 * @param {Blockhash} lastestBlockhash - The latest blockhash.
 * @param {number} jitofee - The fee for the Jito transaction.
 * @returns {Promise<{ confirmed: boolean, signature: string | null }>} - A promise that resolves to an object containing the confirmation status and the transaction signature.
 */
export async function jito_executeAndConfirm(
  transaction: any,
  payer: Keypair,
  lastestBlockhash: any,
  jitofee: any
) {
  console.log("Executing transaction (jito)...");
  const jito_validator_wallet = await getRandomValidator();
  console.log("Selected Jito Validator: ", jito_validator_wallet.toBase58());
  try {
    const fee = new CurrencyAmount(Currency.SOL, jitofee, false).raw.toNumber();
    console.log(`Jito Fee: ${fee / 10 ** 9} sol`);
    const jitoFee_message = new TransactionMessage({
      payerKey: payer.publicKey,
      recentBlockhash: lastestBlockhash.blockhash,
      instructions: [
        SystemProgram.transfer({
          fromPubkey: payer.publicKey,
          toPubkey: jito_validator_wallet,
          lamports: fee,
        }),
      ],
    }).compileToV0Message();
    const jitoFee_transaction = new VersionedTransaction(jitoFee_message);
    jitoFee_transaction.sign([payer]);
    const jitoTxSignature = bs58.encode(jitoFee_transaction.signatures[0]);
    const serializedJitoFeeTransaction = bs58.encode(
      jitoFee_transaction.serialize()
    );
    const serializedTransaction = bs58.encode(transaction.serialize());
    const final_transaction = [
      serializedJitoFeeTransaction,
      serializedTransaction,
    ];
    const requests = endpoints.map((url) =>
      axios.post(url, {
        jsonrpc: "2.0",
        id: 1,
        method: "sendBundle",
        params: [final_transaction],
      })
    );
    console.log("Sending tx to Jito validators...");
    const res = await Promise.all(requests.map((p) => p.catch((e) => e)));
    const success_res = res.filter((r) => !(r instanceof Error));
    if (success_res.length > 0) {
      console.log("Jito validator accepted the tx");
      return await jito_confirm(jitoTxSignature, lastestBlockhash);
    } else {
      console.log("No Jito validators accepted the tx");
      return { confirmed: false, signature: jitoTxSignature };
    }
  } catch (e) {
    if (e instanceof axios.AxiosError) {
      console.log("Failed to execute the jito transaction");
    } else {
      console.log("Error during jito transaction execution: ", e);
    }
    return { confirmed: false, signature: null };
  }
}

/**
 * Confirms a transaction on the Solana blockchain.
 * @param {string} signature - The signature of the transaction.
 * @param {object} latestBlockhash - The latest blockhash information.
 * @returns {object} - An object containing the confirmation status and the transaction signature.
 */
export async function jito_confirm(signature: any, latestBlockhash: any) {
  console.log("Confirming the jito transaction...");
  const confirmation = await connection.confirmTransaction(
    {
      signature,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      blockhash: latestBlockhash.blockhash,
    },
    "confirmed"
  );
  return { confirmed: !confirmation.value.err, signature };
}

export const getPoolOwner = async (poolId: PublicKey) => {
  try {
    // Get the account info for the PDA
    const accountInfo = await connection.getAccountInfo(new PublicKey(poolId));

    if (!accountInfo) {
      console.log("PDA account not found");
      return null;
    }

    // The owner of the PDA is in the owner field of the accountInfo
    const ownerPublicKey = accountInfo.owner;

    console.log("PDA owner:", ownerPublicKey.toBase58());
    return ownerPublicKey;
  } catch (error) {
    console.error("Error fetching PDA owner:", error);
    return null;
  }
};

export async function exceuteJitoTx(
  transaction: VersionedTransaction[],
  payer: Keypair,
  lastestBlockhash: any,
  jitofee: any
) {
  console.log("Executing transaction (jito)...");
  console.log("Transaction length: ", transaction.length);
  const jito_validator_wallet = await getRandomValidator();
  console.log("Selected Jito Validator: ", jito_validator_wallet.toBase58());
  try {
    const fee = new CurrencyAmount(Currency.SOL, jitofee, false).raw.toNumber();
    console.log(`Jito Fee: ${fee / 10 ** 9} sol`);
    const jitoFee_message = new TransactionMessage({
      payerKey: payer.publicKey,
      recentBlockhash: lastestBlockhash.blockhash,
      instructions: [
        SystemProgram.transfer({
          fromPubkey: payer.publicKey,
          toPubkey: jito_validator_wallet,
          lamports: fee,
        }),
      ],
    }).compileToV0Message();
    const jitoFee_transaction = new VersionedTransaction(jitoFee_message);
    jitoFee_transaction.sign([payer]);
    const serializedJitoFeeTransaction = bs58.encode(
      jitoFee_transaction.serialize()
    );
    // Serialize the transactions once here
    const serializedTransactions: string[] = [];
    for (let i = 0; i < transaction.length; i++) {
      const serializedTransaction = bs58.encode(transaction[i].serialize());
      serializedTransactions.push(serializedTransaction);
    }

    const final_transaction = [
      serializedJitoFeeTransaction,
      ...serializedTransactions,
    ];
    const requests = endpoints.map((url) =>
      axios.post(url, {
        jsonrpc: "2.0",
        id: 1,
        method: "sendBundle",
        params: [final_transaction],
      })
    );
    console.log('Sending transactions to endpoints...');

    const results = await Promise.all(requests.map((p) => p.catch((e) => e)));

    const successfulResults = results.filter((result) => !(result instanceof Error));
    const jitoTxsignature = bs58.encode(transaction[0].signatures[0]);
    let latestBlockhash = await connection.getLatestBlockhash();

    if (successfulResults.length > 0) {
      console.log("Waiting for response")
      const confirmation = await connection.confirmTransaction(
        {
          signature: jitoTxsignature,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
          blockhash: latestBlockhash.blockhash,
        },
        "confirmed",
      );

      console.log("Wallets bought the token plz check keypairs in the data.json file in key folder")

      if (confirmation.value.err) {
        console.log("Confirmtaion error")
        return { 
          success: false, 
          msg: confirmation.value.err, 
          tx: jitoTxsignature 
        };
      } else {
        return { 
          success: true, 
          msg: "succesfully swapped", 
          tx: jitoTxsignature 
        };
      }
    } else {
      return { 
        success: false, 
        msg: "No Jito validators accepted the tx", 
        tx: jitoTxsignature 
      };
    }
  } catch (e) {
    if (e instanceof axios.AxiosError) {
      console.log("Failed to execute the jito transaction");
    } else {
      console.log("Error during jito transaction execution: ", e);
    }
    return { confirmed: false, signature: null };
  }
}


export const createAndFundWSOLAccount = async (
  wallet: Keypair,
  amount: number
): Promise<PublicKey> => {
  try {
      // Create a new account for WSOL
      const wsolAccount = await spl.getAssociatedTokenAddress(
          NATIVE_MINT,
          wallet.publicKey,
          false,
          TOKEN_PROGRAM_ID,
          spl.ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const transaction = new Transaction();

      // Create WSOL account if it doesn't exist
      transaction.add(
          spl.createAssociatedTokenAccountIdempotentInstruction(
              wallet.publicKey,
              wsolAccount,
              wallet.publicKey,
              NATIVE_MINT,
              TOKEN_PROGRAM_ID,
              spl.ASSOCIATED_TOKEN_PROGRAM_ID
          )
      );

      // Transfer SOL to the WSOL account
      transaction.add(
          SystemProgram.transfer({
              fromPubkey: wallet.publicKey,
              toPubkey: wsolAccount,
              lamports: amount * LAMPORTS_PER_SOL,
          })
      );

      // Sync wrapped SOL balance
      transaction.add(
          spl.createSyncNativeInstruction(
              wsolAccount,
              TOKEN_PROGRAM_ID
          )
      );

      const latestBlockhash = await connection.getLatestBlockhash();
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = wallet.publicKey;

      // Sign and send the transaction
      transaction.sign(wallet);
      const txid = await connection.sendRawTransaction(transaction.serialize());
      await connection.confirmTransaction(txid);

      return wsolAccount;
  } catch (error) {
      console.error("Error in createAndFundWSOLAccount:", error);
      throw error;
  }
};

export const getTokenProgramId = async (mint: PublicKey) => {
  try {
      // First check if it's a Token-2022 account
      try {
          const accountInfo = await connection.getAccountInfo(mint);
          if (accountInfo) {
              // Check the owner of the account
              if (accountInfo.owner.equals(spl.TOKEN_2022_PROGRAM_ID)) {
                  console.log(`Mint ${mint.toBase58()} is a Token-2022 token`);
                  return spl.TOKEN_2022_PROGRAM_ID;
              }
          }
      } catch (err: any) {
          // If there's an error, default to classic SPL Token
          console.log(`Error checking Token-2022 status: ${err.message}`);
      }

      // Default to classic SPL Token
      console.log(`Mint ${mint.toBase58()} is a classic SPL token`);
      return spl.TOKEN_PROGRAM_ID;
  } catch (error: any) {
      console.error(`Error determining token program ID: ${error.message}`);
      // Default to classic SPL Token
      return spl.TOKEN_PROGRAM_ID;
  }
}
