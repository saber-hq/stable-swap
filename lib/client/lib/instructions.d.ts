import { Account, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { NumberU64 } from "./util/u64";
import { Fees } from "./fees";
export declare const createInitSwapInstruction: (
  tokenSwapAccount: Account,
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
  swapProgramId: PublicKey,
  tokenProgramId: PublicKey,
  nonce: number,
  ampFactor: number | NumberU64,
  fees: Fees
) => TransactionInstruction;
export declare const swapInstruction: (
  tokenSwap: PublicKey,
  authority: PublicKey,
  userSource: PublicKey,
  poolSource: PublicKey,
  poolDestination: PublicKey,
  userDestination: PublicKey,
  adminDestination: PublicKey,
  swapProgramId: PublicKey,
  tokenProgramId: PublicKey,
  amountIn: number | NumberU64,
  minimumAmountOut: number | NumberU64
) => TransactionInstruction;
export declare const depositInstruction: (
  tokenSwap: PublicKey,
  authority: PublicKey,
  sourceA: PublicKey,
  sourceB: PublicKey,
  intoA: PublicKey,
  intoB: PublicKey,
  poolTokenMint: PublicKey,
  poolTokenAccount: PublicKey,
  swapProgramId: PublicKey,
  tokenProgramId: PublicKey,
  tokenAmountA: number | NumberU64,
  tokenAmountB: number | NumberU64,
  minimumPoolTokenAmount: number | NumberU64
) => TransactionInstruction;
export declare const withdrawInstruction: (
  tokenSwap: PublicKey,
  authority: PublicKey,
  poolMint: PublicKey,
  sourcePoolAccount: PublicKey,
  fromA: PublicKey,
  fromB: PublicKey,
  userAccountA: PublicKey,
  userAccountB: PublicKey,
  adminFeeAccountA: PublicKey,
  adminFeeAccountB: PublicKey,
  swapProgramId: PublicKey,
  tokenProgramId: PublicKey,
  poolTokenAmount: number | NumberU64,
  minimumTokenA: number | NumberU64,
  minimumTokenB: number | NumberU64
) => TransactionInstruction;
//# sourceMappingURL=instructions.d.ts.map
