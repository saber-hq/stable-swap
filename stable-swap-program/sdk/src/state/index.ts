import { u64 } from "@saberhq/token-utils";
import { PublicKey } from "@solana/web3.js";

import type { SwapTokenInfo } from "../instructions/swap";
import type { Fees } from "./fees";
import { decodeFees } from "./fees";
import { StableSwapLayout } from "./layout";

export * from "./fees";
export * from "./layout";

export interface StableSwapState {
  /**
   * Mint account for pool token
   */
  poolTokenMint: PublicKey;

  /**
   * Admin account
   */
  adminAccount: PublicKey;

  tokenA: SwapTokenInfo;
  tokenB: SwapTokenInfo;

  /**
   * Initial amplification coefficient (A)
   */
  initialAmpFactor: u64;

  /**
   * Target amplification coefficient (A)
   */
  targetAmpFactor: u64;

  /**
   * Ramp A start timestamp
   */
  startRampTimestamp: number;

  /**
   * Ramp A start timestamp
   */
  stopRampTimestamp: number;

  /**
   * Fee schedule
   */
  fees: Fees;
}

/**
 * Decodes the Swap account.
 * @param data
 * @returns
 */
export const decodeSwap = (data: Buffer): StableSwapState => {
  const stableSwapData = StableSwapLayout.decode(data);
  if (!stableSwapData.isInitialized) {
    throw new Error(`Invalid token swap state`);
  }
  const adminAccount = new PublicKey(stableSwapData.adminAccount);
  const adminFeeAccountA = new PublicKey(stableSwapData.adminFeeAccountA);
  const adminFeeAccountB = new PublicKey(stableSwapData.adminFeeAccountB);
  const tokenAccountA = new PublicKey(stableSwapData.tokenAccountA);
  const tokenAccountB = new PublicKey(stableSwapData.tokenAccountB);
  const poolTokenMint = new PublicKey(stableSwapData.tokenPool);
  const mintA = new PublicKey(stableSwapData.mintA);
  const mintB = new PublicKey(stableSwapData.mintB);
  const initialAmpFactor = u64.fromBuffer(stableSwapData.initialAmpFactor);
  const targetAmpFactor = u64.fromBuffer(stableSwapData.targetAmpFactor);
  const startRampTimestamp = stableSwapData.startRampTs;
  const stopRampTimestamp = stableSwapData.stopRampTs;
  const fees = decodeFees(stableSwapData.fees);
  return {
    adminAccount,
    tokenA: {
      adminFeeAccount: adminFeeAccountA,
      reserve: tokenAccountA,
      mint: mintA,
    },
    tokenB: {
      adminFeeAccount: adminFeeAccountB,
      reserve: tokenAccountB,
      mint: mintB,
    },
    poolTokenMint,
    initialAmpFactor,
    targetAmpFactor,
    startRampTimestamp,
    stopRampTimestamp,
    fees,
  };
};
