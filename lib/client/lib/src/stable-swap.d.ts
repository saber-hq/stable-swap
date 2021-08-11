import type { Connection } from "@solana/web3.js";
import { Account, PublicKey, Transaction } from "@solana/web3.js";
import { Fees } from "./fees";
/**
 * A program to exchange tokens against a pool of liquidity
 */
export declare class StableSwap {
  /**
   * @private
   */
  connection: Connection;
  /**
   * Program Identifier for the Swap program
   */
  swapProgramId: PublicKey;
  /**
   * Program Identifier for the Token program
   */
  tokenProgramId: PublicKey;
  /**
   * The public key identifying this swap program
   */
  stableSwap: PublicKey;
  /**
   * The public key for the liquidity pool token mint
   */
  poolTokenMint: PublicKey;
  /**
   * Authority
   */
  authority: PublicKey;
  /**
   * Admin account
   */
  adminAccount: PublicKey;
  /**
   * Admin fee account for token A
   */
  adminFeeAccountA: PublicKey;
  /**
   * Admin fee account for token B
   */
  adminFeeAccountB: PublicKey;
  /**
   * The public key for the first token account of the trading pair
   */
  tokenAccountA: PublicKey;
  /**
   * The public key for the second token account of the trading pair
   */
  tokenAccountB: PublicKey;
  /**
   * The public key for the mint of the first token account of the trading pair
   */
  mintA: PublicKey;
  /**
   * The public key for the mint of the second token account of the trading pair
   */
  mintB: PublicKey;
  /**
   * Initial amplification coefficient (A)
   */
  initialAmpFactor: number;
  /**
   * Target amplification coefficient (A)
   */
  targetAmpFactor: number;
  /**
   * Ramp A start timestamp
   */
  startRampTimestamp: number;
  /**
   * Ramp A start timestamp
   */
  stopRampTimestamp: number;
  /**
   * Fees
   */
  fees: Fees;
  /**
   * Constructor for new StableSwap client object
   * @param connection
   * @param stableSwap
   * @param swapProgramId
   * @param tokenProgramId
   * @param poolTokenMint
   * @param authority
   * @param adminAccount
   * @param adminFeeAccountA
   * @param adminFeeAccountB
   * @param tokenAccountA
   * @param tokenAccountB
   * @param mintA
   * @param mintB
   * @param initialAmpFactor
   * @param targetAmpFactor
   * @param startRampTimestamp
   * @param stopRampTimeStamp
   * @param fees
   */
  constructor(
    connection: Connection,
    stableSwap: PublicKey,
    swapProgramId: PublicKey,
    tokenProgramId: PublicKey,
    poolTokenMint: PublicKey,
    authority: PublicKey,
    adminAccount: PublicKey,
    adminFeeAccountA: PublicKey,
    adminFeeAccountB: PublicKey,
    tokenAccountA: PublicKey,
    tokenAccountB: PublicKey,
    mintA: PublicKey,
    mintB: PublicKey,
    initialAmpFactor: number,
    targetAmpFactor: number,
    startRampTimestamp: number,
    stopRampTimeStamp: number,
    fees?: Fees
  );
  /**
   * Get the minimum balance for the token swap account to be rent exempt
   *
   * @return Number of lamports required
   */
  static getMinBalanceRentForExemptStableSwap(
    connection: Connection
  ): Promise<number>;
  /**
   * Load an onchain StableSwap program
   * @param connection The connection to use
   * @param address The public key of the account to load
   * @param programId Address of the onchain StableSwap program
   * @param payer Pays for the transaction
   */
  static loadStableSwap(
    connection: Connection,
    address: PublicKey,
    programId: PublicKey
  ): Promise<StableSwap>;
  /**
   * Constructor for new StableSwap client object
   * @param connection
   * @param payer
   * @param stableSwapAccount
   * @param authority
   * @param adminAccount
   * @param adminFeeAccountA
   * @param adminFeeAccountB
   * @param tokenAccountA
   * @param tokenAccountB
   * @param poolTokenMint
   * @param poolTokenAccount
   * @param mintA
   * @param mintB
   * @param swapProgramId
   * @param tokenProgramId
   * @param nonce
   * @param ampFactor
   * @param fees
   */
  static createStableSwap(
    connection: Connection,
    payer: Account,
    stableSwapAccount: Account,
    authority: PublicKey,
    adminAccount: PublicKey,
    adminFeeAccountA: PublicKey,
    adminFeeAccountB: PublicKey,
    tokenMintA: PublicKey,
    tokenAccountA: PublicKey,
    tokenMintB: PublicKey,
    tokenAccountB: PublicKey,
    poolTokenMint: PublicKey,
    poolTokenAccount: PublicKey,
    mintA: PublicKey,
    mintB: PublicKey,
    swapProgramId: PublicKey,
    tokenProgramId: PublicKey,
    nonce: number,
    ampFactor: number,
    fees?: Fees
  ): Promise<StableSwap>;
  /**
   * Get the virtual price of the pool.
   */
  getVirtualPrice(): Promise<number>;
  /**
   * Swap token A for token B
   * @param userSource
   * @param poolSource
   * @param poolDestination
   * @param userDestination
   * @param amountIn
   * @param minimumAmountOut
   */
  swap(
    userSource: PublicKey,
    poolSource: PublicKey,
    poolDestination: PublicKey,
    userDestination: PublicKey,
    amountIn: number,
    minimumAmountOut: number
  ): Transaction;
  /**
   * Deposit tokens into the pool
   * @param userAccountA
   * @param userAccountB
   * @param poolAccount
   * @param tokenAmountA
   * @param tokenAmountB
   * @param minimumPoolTokenAmount
   */
  deposit(
    userAccountA: PublicKey,
    userAccountB: PublicKey,
    poolTokenAccount: PublicKey,
    tokenAmountA: number,
    tokenAmountB: number,
    minimumPoolTokenAmount: number
  ): Transaction;
  /**
   * Withdraw tokens from the pool
   * @param userAccountA
   * @param userAccountB
   * @param poolAccount
   * @param poolTokenAmount
   * @param minimumTokenA
   * @param minimumTokenB
   */
  withdraw(
    userAccountA: PublicKey,
    userAccountB: PublicKey,
    poolAccount: PublicKey,
    poolTokenAmount: number,
    minimumTokenA: number,
    minimumTokenB: number
  ): Transaction;
}
//# sourceMappingURL=stable-swap.d.ts.map
