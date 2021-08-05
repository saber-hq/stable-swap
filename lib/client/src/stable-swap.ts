import BN from "bn.js";
import type { Connection } from "@solana/web3.js";
import {
  Account,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { AccountLayout, MintLayout } from "@solana/spl-token";

import { TOKEN_PROGRAM_ID, ZERO_TS } from "./constants";
import { DEFAULT_FEES, Fees } from "./fees";
import * as instructions from "./instructions";
import * as layout from "./layout";
import { loadAccount } from "./util/account";
import { computeD } from "./util/calculator";
import { sendAndConfirmTransaction } from "./util/send-and-confirm-transaction";
import { NumberU64 } from "./util/u64";

/**
 * A program to exchange tokens against a pool of liquidity
 */
export class StableSwap {
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
    fees: Fees = DEFAULT_FEES
  ) {
    this.connection = connection;
    this.stableSwap = stableSwap;
    this.swapProgramId = swapProgramId;
    this.tokenProgramId = tokenProgramId;
    this.poolTokenMint = poolTokenMint;
    this.authority = authority;
    this.adminAccount = adminAccount;
    this.adminFeeAccountA = adminFeeAccountA;
    this.adminFeeAccountB = adminFeeAccountB;
    this.tokenAccountA = tokenAccountA;
    this.tokenAccountB = tokenAccountB;
    this.mintA = mintA;
    this.mintB = mintB;
    this.initialAmpFactor = initialAmpFactor;
    this.targetAmpFactor = targetAmpFactor;
    this.startRampTimestamp = startRampTimestamp;
    this.stopRampTimestamp = stopRampTimeStamp;
    this.fees = fees;
  }

  /**
   * Get the minimum balance for the token swap account to be rent exempt
   *
   * @return Number of lamports required
   */
  static async getMinBalanceRentForExemptStableSwap(
    connection: Connection
  ): Promise<number> {
    return await connection.getMinimumBalanceForRentExemption(
      layout.StableSwapLayout.span
    );
  }

  /**
   * Load an onchain StableSwap program
   * @param connection The connection to use
   * @param address The public key of the account to load
   * @param programId Address of the onchain StableSwap program
   * @param payer Pays for the transaction
   */
  static async loadStableSwap(
    connection: Connection,
    address: PublicKey,
    programId: PublicKey
  ): Promise<StableSwap> {
    const data = await loadAccount(connection, address, programId);
    const stableSwapData = layout.StableSwapLayout.decode(data);
    if (!stableSwapData.isInitialized) {
      throw new Error(`Invalid token swap state`);
    }

    const [authority] = await PublicKey.findProgramAddress(
      [address.toBuffer()],
      programId
    );
    const adminAccount = new PublicKey(stableSwapData.adminAccount);
    const adminFeeAccountA = new PublicKey(stableSwapData.adminFeeAccountA);
    const adminFeeAccountB = new PublicKey(stableSwapData.adminFeeAccountB);
    const tokenAccountA = new PublicKey(stableSwapData.tokenAccountA);
    const tokenAccountB = new PublicKey(stableSwapData.tokenAccountB);
    const poolTokenMint = new PublicKey(stableSwapData.tokenPool);
    const mintA = new PublicKey(stableSwapData.mintA);
    const mintB = new PublicKey(stableSwapData.mintB);
    const tokenProgramId = TOKEN_PROGRAM_ID;
    const initialAmpFactor = stableSwapData.initialAmpFactor;
    const targetAmpFactor = stableSwapData.targetAmpFactor;
    const startRampTimestamp = stableSwapData.startRampTs;
    const stopRampTimeStamp = stableSwapData.stopRampTs;
    const fees = {
      adminTradeFeeNumerator: stableSwapData.adminTradeFeeNumerator as number,
      adminTradeFeeDenominator: stableSwapData.adminTradeFeeDenominator as number,
      adminWithdrawFeeNumerator: stableSwapData.adminWithdrawFeeNumerator as number,
      adminWithdrawFeeDenominator: stableSwapData.adminWithdrawFeeDenominator as number,
      tradeFeeNumerator: stableSwapData.tradeFeeNumerator as number,
      tradeFeeDenominator: stableSwapData.tradeFeeDenominator as number,
      withdrawFeeNumerator: stableSwapData.withdrawFeeNumerator as number,
      withdrawFeeDenominator: stableSwapData.withdrawFeeDenominator as number,
    };

    return new StableSwap(
      connection,
      address,
      programId,
      tokenProgramId,
      poolTokenMint,
      authority,
      adminAccount,
      adminFeeAccountA,
      adminFeeAccountB,
      tokenAccountA,
      tokenAccountB,
      mintA,
      mintB,
      initialAmpFactor,
      targetAmpFactor,
      startRampTimestamp,
      stopRampTimeStamp,
      fees
    );
  }

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
  static async createStableSwap(
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
    fees: Fees = DEFAULT_FEES
  ): Promise<StableSwap> {
    // Allocate memory for the account
    const balanceNeeded = await StableSwap.getMinBalanceRentForExemptStableSwap(
      connection
    );
    const transaction = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: stableSwapAccount.publicKey,
        lamports: balanceNeeded,
        space: layout.StableSwapLayout.span,
        programId: swapProgramId,
      })
    );

    const instruction = instructions.createInitSwapInstruction(
      stableSwapAccount,
      authority,
      adminAccount,
      adminFeeAccountA,
      adminFeeAccountB,
      tokenMintA,
      tokenAccountA,
      tokenMintB,
      tokenAccountB,
      poolTokenMint,
      poolTokenAccount,
      swapProgramId,
      tokenProgramId,
      nonce,
      ampFactor,
      fees
    );
    transaction.add(instruction);

    await sendAndConfirmTransaction(
      "createAccount and InitializeSwap",
      connection,
      transaction,
      payer,
      stableSwapAccount
    );

    return new StableSwap(
      connection,
      stableSwapAccount.publicKey,
      swapProgramId,
      tokenProgramId,
      poolTokenMint,
      authority,
      adminAccount,
      adminFeeAccountA,
      adminFeeAccountB,
      tokenAccountA,
      tokenAccountB,
      mintA,
      mintB,
      ampFactor,
      ampFactor,
      ZERO_TS,
      ZERO_TS,
      fees
    );
  }

  /**
   * Get the virtual price of the pool.
   */
  async getVirtualPrice(): Promise<number> {
    let tokenAData;
    let tokenBData;
    let poolMintData;
    try {
      tokenAData = loadAccount(
        this.connection,
        this.tokenAccountA,
        this.tokenProgramId
      );
      tokenBData = loadAccount(
        this.connection,
        this.tokenAccountB,
        this.tokenProgramId
      );
      poolMintData = loadAccount(
        this.connection,
        this.poolTokenMint,
        this.tokenProgramId
      );

      const tokenA = AccountLayout.decode(await tokenAData);
      const tokenB = AccountLayout.decode(await tokenBData);
      const amountA = NumberU64.fromBuffer(tokenA.amount);
      const amountB = NumberU64.fromBuffer(tokenB.amount);
      const D = computeD(new BN(this.initialAmpFactor), amountA, amountB);

      const poolMint = MintLayout.decode(await poolMintData);
      const poolSupply = NumberU64.fromBuffer(poolMint.supply);

      return D.div(poolSupply).toNumber();
    } catch (e) {
      throw new Error(e);
    }
  }

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
  ): Transaction {
    const adminDestination =
      poolDestination === this.tokenAccountA
        ? this.adminFeeAccountA
        : this.adminFeeAccountB;
    return new Transaction().add(
      instructions.swapInstruction(
        this.stableSwap,
        this.authority,
        userSource,
        poolSource,
        poolDestination,
        userDestination,
        adminDestination,
        this.swapProgramId,
        this.tokenProgramId,
        amountIn,
        minimumAmountOut
      )
    );
  }

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
  ): Transaction {
    return new Transaction().add(
      instructions.depositInstruction(
        this.stableSwap,
        this.authority,
        userAccountA,
        userAccountB,
        this.tokenAccountA,
        this.tokenAccountB,
        this.poolTokenMint,
        poolTokenAccount,
        this.swapProgramId,
        this.tokenProgramId,
        tokenAmountA,
        tokenAmountB,
        minimumPoolTokenAmount
      )
    );
  }

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
  ): Transaction {
    return new Transaction().add(
      instructions.withdrawInstruction(
        this.stableSwap,
        this.authority,
        this.poolTokenMint,
        poolAccount,
        this.tokenAccountA,
        this.tokenAccountB,
        userAccountA,
        userAccountB,
        this.adminFeeAccountA,
        this.adminFeeAccountB,
        this.swapProgramId,
        this.tokenProgramId,
        poolTokenAmount,
        minimumTokenA,
        minimumTokenB
      )
    );
  }
}
