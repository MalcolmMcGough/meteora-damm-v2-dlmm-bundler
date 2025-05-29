import { Keypair, PublicKey, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { fetchDLMMPool } from "./fetchPool";
import { wsol } from "./constants";
import { BN } from "bn.js";
import DLMM from "@meteora-ag/dlmm";

/**
 * Performs a swap operation in a DLMM pool.
 * @param side The side of the swap operation, either "buy" or "sell". Default is "buy".
 * @param tokenAddress The address of the token to be swapped.
 * @param buyAmountInSOL The amount of SOL to be used for buying the token. Default is 0.1.
 * @param sellPercentage The percentage of the token to be sold. Default is 100%.
 * @returns A Promise that resolves to the transaction hash if the swap is successful, otherwise an error object.
 */
export async function swap(
  wallet: Keypair,
  side: string = "buy",
  tokenAddress: string,
  poolId: string,
  buyAmountInSOL: number = 0.1,
  sellPercentage: number = 100
) {
  let swapYtoX = false,
    decimalY: number,
    decimalX: number,
    inToken: PublicKey,
    outToken: PublicKey,
    swapAmount: any;
  const dlmmPool: DLMM = await fetchDLMMPool(tokenAddress, poolId); // fetch the DLMM pool object for swapping
  decimalY = dlmmPool.tokenY.mint.decimals;
  decimalX = dlmmPool.tokenX.mint.decimals;
  console.log(dlmmPool.tokenX.mint.decimals);
  if (side === "buy") {
    // inToken = wsol
    if (dlmmPool.tokenY.publicKey.toBase58() === wsol) {
      inToken = dlmmPool.tokenY.publicKey;
      outToken = dlmmPool.tokenX.publicKey;
    } else {
      inToken = dlmmPool.tokenX.publicKey;
      outToken = dlmmPool.tokenY.publicKey;
    }
    swapAmount = new BN(buyAmountInSOL * 10 ** 9); // convert to lamports
  } else {
    if (dlmmPool.tokenY.publicKey.toBase58() === wsol) {
      inToken = dlmmPool.tokenX.publicKey;
      outToken = dlmmPool.tokenY.publicKey;

      const amount = buyAmountInSOL * (sellPercentage / 100);
      swapAmount = new BN(amount); // convert to lamports
    } else {
      inToken = dlmmPool.tokenY.publicKey;
      outToken = dlmmPool.tokenX.publicKey;

      const amount = buyAmountInSOL * (sellPercentage / 100);
      swapAmount = new BN(amount); // convert to lamports
    }
  }

  const binArrays = await dlmmPool.getBinArrayForSwap(swapYtoX); // list of pools
  if(side == "buy") {
    /**
     *  Please Contact to Developer if you need this feature
     */
    return {amountOuty, swapIxs: swapTx.instructions};
  } else {
    /**
     *  Please Contact to Developer if you need this feature
     */
    return {amountOut: 0, swapIxs: swapTx.instructions};
  }
}