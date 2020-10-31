import type { Connection, TransactionSignature } from "@solana/web3.js";
import {
  Account,
  PublicKey,
  SystemProgram,
  Transaction
} from "@solana/web3.js";

import { DEFAULT_FEES, Fees } from "./fees";
import * as instructions from "./instructions";
import * as layout from "./layout";
import { loadAccount } from "./util/account";
import { sendAndConfirmTransaction } from "./util/send-and-confirm-transaction";
import { SignerOrAccount } from "./util/signerOrAccount";

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
  poolToken: PublicKey;

  /**
   * Authority
   */
  authority: PublicKey;

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
   * Amplification coefficient (A)
   */
  ampFactor: number;

  /**
   * Fees
   */
  fees: Fees;

  /**
   * Fee payer
   */
  payer: SignerOrAccount;

  /**
   * Create a new StableSwap client object
   * @param connection
   * @param stableSwap
   * @param swapProgramId
   * @param tokenProgramId
   * @param poolToken
   * @param authority
   * @param tokenAccountA
   * @param tokenAccountB
   * @param mintA
   * @param mintB
   * @param ampFactor
   * @param payer
   * @param fees
   */
  constructor(
    connection: Connection,
    stableSwap: PublicKey,
    swapProgramId: PublicKey,
    tokenProgramId: PublicKey,
    poolToken: PublicKey,
    authority: PublicKey,
    tokenAccountA: PublicKey,
    tokenAccountB: PublicKey,
    mintA: PublicKey,
    mintB: PublicKey,
    ampFactor: number,
    payer: SignerOrAccount,
    fees: Fees = DEFAULT_FEES
  ) {
    this.connection = connection;
    this.stableSwap = stableSwap;
    this.swapProgramId = swapProgramId;
    this.tokenProgramId = tokenProgramId;
    this.poolToken = poolToken;
    this.authority = authority;
    this.tokenAccountA = tokenAccountA;
    this.tokenAccountB = tokenAccountB;
    this.mintA = mintA;
    this.mintB = mintB;
    this.ampFactor = ampFactor;
    this.payer = payer;
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
    programId: PublicKey,
    payer: SignerOrAccount
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
    const tokenAccountA = new PublicKey(stableSwapData.tokenAccountA);
    const tokenAccountB = new PublicKey(stableSwapData.tokenAccountB);
    const poolToken = new PublicKey(stableSwapData.tokenPool);
    const mintA = new PublicKey(stableSwapData.mintA);
    const mintB = new PublicKey(stableSwapData.mintB);
    const tokenProgramId = new PublicKey(stableSwapData.tokenProgramId);
    const ampFactor = stableSwapData.ampFactor;
    const fees = {
      adminTradeFeeNumerator: stableSwapData.adminTradeFeeNumerator as number,
      adminTradeFeeDenominator: stableSwapData.adminTradeFeeDenominator as number,
      adminWithdrawFeeNumerator: stableSwapData.adminWithdrawFeeNumerator as number,
      adminWithdrawFeeDenominator: stableSwapData.adminWithdrawFeeDenominator as number,
      tradeFeeNumerator: stableSwapData.tradeFeeNumerator as number,
      tradeFeeDenominator: stableSwapData.tradeFeeDenominator as number,
      withdrawFeeNumerator: stableSwapData.withdrawFeeNumerator as number,
      withdrawFeeDenominator: stableSwapData.withdrawFeeDenominator as number
    };

    return new StableSwap(
      connection,
      address,
      programId,
      tokenProgramId,
      poolToken,
      authority,
      tokenAccountA,
      tokenAccountB,
      mintA,
      mintB,
      ampFactor,
      payer,
      fees
    );
  }

  /**
   * Create a new StableSwap instance
   * @param connection
   * @param payer
   * @param stableSwapAccount
   * @param authority
   * @param adminFeeAccountA
   * @param adminFeeAccountB
   * @param tokenAccountA
   * @param tokenAccountB
   * @param poolToken
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
    payer: SignerOrAccount,
    stableSwapAccount: Account,
    authority: PublicKey,
    adminFeeAccountA: PublicKey,
    adminFeeAccountB: PublicKey,
    tokenAccountA: PublicKey,
    tokenAccountB: PublicKey,
    poolToken: PublicKey,
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
        programId: swapProgramId
      })
    );

    const instruction = instructions.createInitSwapInstruction(
      stableSwapAccount,
      authority,
      adminFeeAccountA,
      adminFeeAccountB,
      tokenAccountA,
      tokenAccountB,
      poolToken,
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
      poolToken,
      authority,
      tokenAccountA,
      tokenAccountB,
      mintA,
      mintB,
      ampFactor,
      payer,
      fees
    );
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
  async swap(
    userSource: PublicKey,
    poolSource: PublicKey,
    poolDestination: PublicKey,
    userDestination: PublicKey,
    amountIn: number,
    minimumAmountOut: number
  ): Promise<TransactionSignature> {
    return await sendAndConfirmTransaction(
      "swap",
      this.connection,
      new Transaction().add(
        instructions.swapInstruction(
          this.stableSwap,
          this.authority,
          userSource,
          poolSource,
          poolDestination,
          userDestination,
          this.swapProgramId,
          this.tokenProgramId,
          amountIn,
          minimumAmountOut
        )
      ),
      this.payer
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
  async deposit(
    userAccountA: PublicKey,
    userAccountB: PublicKey,
    poolTokenAccount: PublicKey,
    tokenAmountA: number,
    tokenAmountB: number,
    minimumPoolTokenAmount: number
  ): Promise<TransactionSignature> {
    return await sendAndConfirmTransaction(
      "deposit",
      this.connection,
      new Transaction().add(
        instructions.depositInstruction(
          this.stableSwap,
          this.authority,
          userAccountA,
          userAccountB,
          this.tokenAccountA,
          this.tokenAccountB,
          this.poolToken,
          poolTokenAccount,
          this.swapProgramId,
          this.tokenProgramId,
          tokenAmountA,
          tokenAmountB,
          minimumPoolTokenAmount
        )
      ),
      this.payer
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
  async withdraw(
    userAccountA: PublicKey,
    userAccountB: PublicKey,
    poolAccount: PublicKey,
    poolTokenAmount: number,
    minimumTokenA: number,
    minimumTokenB: number
  ): Promise<TransactionSignature> {
    return await sendAndConfirmTransaction(
      "withdraw",
      this.connection,
      new Transaction().add(
        instructions.withdrawInstruction(
          this.stableSwap,
          this.authority,
          this.poolToken,
          poolAccount,
          this.tokenAccountA,
          this.tokenAccountB,
          userAccountA,
          userAccountB,
          this.swapProgramId,
          this.tokenProgramId,
          poolTokenAmount,
          minimumTokenA,
          minimumTokenB
        )
      ),
      this.payer
    );
  }
}
