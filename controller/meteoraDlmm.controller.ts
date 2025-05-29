import { Request, Response } from "express";
import wallets from "../wallets.json";
import { Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { meteoraDlmm } from "../lib/meteora-dlmm/meteoraDlmm";

interface Body {
    tokenMint: string,
    amount: number,
    walletNum: number,
    poolId: string,
}

export const swap = async (req: Request, res: Response) => {
    try {
        console.log("Meteora Swap Start");
        const { tokenMint, amount, walletNum, poolId }: Body = req.body;
        console.log("body", req.body)
        const wallet = Keypair.fromSecretKey(bs58.decode(wallets[walletNum]))
        console.log("Executor Wallet Address:", wallet.publicKey.toBase58())
       
        const result = await meteoraDlmm(wallet, tokenMint, amount, [60,40], poolId);

        res.status(200).json(result)
    } catch (error) {
        res.status(500).json({ success: false, msg: error})
    }
}