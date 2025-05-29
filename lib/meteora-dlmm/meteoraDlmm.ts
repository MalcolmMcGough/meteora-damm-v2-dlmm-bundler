import { ComputeBudgetProgram, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { swap } from "./swap";
import * as spl from "@solana/spl-token";
import { connection } from "../../config";
import { createAndFundWSOLAccount, exceuteJitoTx, getTokenProgramId } from "../utils";

export const meteoraDlmm = async (wallet: Keypair, tokenMint: string, amount: number, sells: number[], poolId: string) => {
    try {
        console.log("Meteora Swap Start");
        const tokenProgramId = await getTokenProgramId(new PublicKey(tokenMint));
        // await createAndFundWSOLAccount(wallet, amount); 
        // Create the associated token account if it doesn't exist
        const TokenATA = await spl.getAssociatedTokenAddress(
            new PublicKey(tokenMint),
            wallet.publicKey,
            false,
            tokenProgramId,
            spl.ASSOCIATED_TOKEN_PROGRAM_ID
        );
        const QuoteATA = await spl.getAssociatedTokenAddress(
            spl.NATIVE_MINT,
            wallet.publicKey,
            false,
            tokenProgramId,
            spl.ASSOCIATED_TOKEN_PROGRAM_ID
        );
        const createTokenBaseAta =
            spl.createAssociatedTokenAccountIdempotentInstruction(
                wallet.publicKey,
                TokenATA,
                wallet.publicKey,
                new PublicKey(tokenMint),
                tokenProgramId,
                spl.ASSOCIATED_TOKEN_PROGRAM_ID
            );
        const createTokenQuoteAta =
            spl.createAssociatedTokenAccountIdempotentInstruction(
                wallet.publicKey,
                QuoteATA,
                wallet.publicKey,
                spl.NATIVE_MINT,
                tokenProgramId,
                spl.ASSOCIATED_TOKEN_PROGRAM_ID
            );

        const TransferLamportsWSOL = SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: QuoteATA,
            lamports: 0.15 * LAMPORTS_PER_SOL,
        });
        const syncNativeIx = spl.createSyncNativeInstruction(
            QuoteATA,
            spl.TOKEN_PROGRAM_ID
        );

        const versionedTransaction: VersionedTransaction[] = [];

        // const transaction = new Transaction().add(TransferLamportsWSOL, syncNativeIx);
        const updateCpIx = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100_000 });
        const updateCuIx = ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 });
        const { amountOut, swapIxs } = await swap(wallet, "buy", tokenMint, poolId, amount, 2.0);
        const buyAmount = amountOut;
        // console.log("buyIx-->", swapIxs);
        const buyIxs = [updateCpIx, updateCuIx, createTokenBaseAta, createTokenQuoteAta, swapIxs[swapIxs.length - 2]];
        const blockhash = await connection.getLatestBlockhash();

        const buyTx = new VersionedTransaction(
            new TransactionMessage({
                payerKey: wallet.publicKey,
                recentBlockhash: blockhash.blockhash,
                instructions: buyIxs,
            }).compileToV0Message(),
        );

        buyTx.sign([wallet]);
        versionedTransaction.push(buyTx);

        for (let index = 0; index < sells.length; index++) {
            const element = sells[index];
            const { amountOut, swapIxs } = await swap(wallet, "sell", tokenMint, poolId, parseInt(buyAmount.toString()), element);
            console.log("sellIx-->", swapIxs);

            const sellIxs: TransactionInstruction[] = [updateCpIx, updateCuIx, swapIxs[swapIxs.length - 2]];

            const sellTx = new VersionedTransaction(
                new TransactionMessage({
                    payerKey: wallet.publicKey,
                    recentBlockhash: blockhash.blockhash,
                    instructions: sellIxs,
                }).compileToV0Message(),
            );

            sellTx.sign([wallet]);
            versionedTransaction.push(sellTx);
        }

        versionedTransaction.map(async (tx, i) => console.log(i, " | ", tx.serialize().length, "bytes | \n", (await connection.simulateTransaction(tx, { sigVerify: true }))))

        return await exceuteJitoTx(
            versionedTransaction,
            wallet,
            blockhash,
            0.001
        );
    } catch (error) {
        console.log("Error in meteoraSwap:", error);
        throw new Error("Meteora Swap failed");
    }
}