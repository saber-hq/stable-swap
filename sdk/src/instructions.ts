import * as BufferLayout from "buffer-layout";
import {
  Account,
  PublicKey,
  TransactionInstruction,
  SYSVAR_CLOCK_PUBKEY,
} from "@solana/web3.js";

import { NumberU64 } from "./util/u64";
import { Uint64Layout } from "./layout";
import { Fees } from "./fees";

export const createInitSwapInstruction = (
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
  initialAmpFactor: number | NumberU64,
  targetAmpFactor: number | NumberU64,
  fees: Fees
): TransactionInstruction => {
  const keys = [
    { pubkey: tokenSwapAccount.publicKey, isSigner: false, isWritable: true },
    { pubkey: authority, isSigner: false, isWritable: false },
    { pubkey: adminAccount, isSigner: false, isWritable: false },
    { pubkey: adminFeeAccountA, isSigner: false, isWritable: false },
    { pubkey: adminFeeAccountB, isSigner: false, isWritable: false },
    { pubkey: tokenMintA, isSigner: false, isWritable: false },
    { pubkey: tokenAccountA, isSigner: false, isWritable: false },
    { pubkey: tokenMintB, isSigner: false, isWritable: false },
    { pubkey: tokenAccountB, isSigner: false, isWritable: false },
    { pubkey: poolTokenMint, isSigner: false, isWritable: true },
    { pubkey: poolTokenAccount, isSigner: false, isWritable: true },
    { pubkey: tokenProgramId, isSigner: false, isWritable: false },
  ];
  const dataLayout = BufferLayout.struct([
    BufferLayout.u8("instruction"),
    BufferLayout.u8("nonce"),
    Uint64Layout("initialAmpFactor"),
    Uint64Layout("targetAmpFactor"),
    Uint64Layout("adminTradeFeeNumerator"),
    Uint64Layout("adminTradeFeeDenominator"),
    Uint64Layout("adminWithdrawFeeNumerator"),
    Uint64Layout("adminWithdrawFeeDenominator"),
    Uint64Layout("tradeFeeNumerator"),
    Uint64Layout("tradeFeeDenominator"),
    Uint64Layout("withdrawFeeNumerator"),
    Uint64Layout("withdrawFeeDenominator"),
  ]);
  let data = Buffer.alloc(dataLayout.span);
  {
    const encodeLength = dataLayout.encode(
      {
        instruction: 0, // InitializeSwap instruction
        nonce,
        initialAmpFactor: new NumberU64(initialAmpFactor).toBuffer(),
        targetAmpFactor: new NumberU64(targetAmpFactor).toBuffer(),
        adminTradeFeeNumerator: new NumberU64(
          fees.adminTradeFeeNumerator
        ).toBuffer(),
        adminTradeFeeDenominator: new NumberU64(
          fees.adminTradeFeeDenominator
        ).toBuffer(),
        adminWithdrawFeeNumerator: new NumberU64(
          fees.adminWithdrawFeeNumerator
        ).toBuffer(),
        adminWithdrawFeeDenominator: new NumberU64(
          fees.adminWithdrawFeeDenominator
        ).toBuffer(),
        tradeFeeNumerator: new NumberU64(fees.tradeFeeNumerator).toBuffer(),
        tradeFeeDenominator: new NumberU64(fees.tradeFeeDenominator).toBuffer(),
        withdrawFeeNumerator: new NumberU64(
          fees.withdrawFeeNumerator
        ).toBuffer(),
        withdrawFeeDenominator: new NumberU64(
          fees.withdrawFeeDenominator
        ).toBuffer(),
      },
      data
    );
    data = data.slice(0, encodeLength);
  }
  return new TransactionInstruction({
    keys,
    programId: swapProgramId,
    data,
  });
};

export const swapInstruction = (
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
): TransactionInstruction => {
  const dataLayout = BufferLayout.struct([
    BufferLayout.u8("instruction"),
    Uint64Layout("amountIn"),
    Uint64Layout("minimumAmountOut"),
  ]);

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: 1, // Swap instruction
      amountIn: new NumberU64(amountIn).toBuffer(),
      minimumAmountOut: new NumberU64(minimumAmountOut).toBuffer(),
    },
    data
  );

  const keys = [
    { pubkey: tokenSwap, isSigner: false, isWritable: false },
    { pubkey: authority, isSigner: false, isWritable: false },
    { pubkey: userSource, isSigner: false, isWritable: true },
    { pubkey: poolSource, isSigner: false, isWritable: true },
    { pubkey: poolDestination, isSigner: false, isWritable: true },
    { pubkey: userDestination, isSigner: false, isWritable: true },
    { pubkey: adminDestination, isSigner: false, isWritable: true },
    { pubkey: tokenProgramId, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
  ];
  return new TransactionInstruction({
    keys,
    programId: swapProgramId,
    data,
  });
};

export const depositInstruction = (
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
): TransactionInstruction => {
  const dataLayout = BufferLayout.struct([
    BufferLayout.u8("instruction"),
    Uint64Layout("tokenAmountA"),
    Uint64Layout("tokenAmountB"),
    Uint64Layout("minimumPoolTokenAmount"),
  ]);
  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: 2, // Deposit instruction
      tokenAmountA: new NumberU64(tokenAmountA).toBuffer(),
      tokenAmountB: new NumberU64(tokenAmountB).toBuffer(),
      minimumPoolTokenAmount: new NumberU64(minimumPoolTokenAmount).toBuffer(),
    },
    data
  );

  const keys = [
    { pubkey: tokenSwap, isSigner: false, isWritable: false },
    { pubkey: authority, isSigner: false, isWritable: false },
    { pubkey: sourceA, isSigner: false, isWritable: true },
    { pubkey: sourceB, isSigner: false, isWritable: true },
    { pubkey: intoA, isSigner: false, isWritable: true },
    { pubkey: intoB, isSigner: false, isWritable: true },
    { pubkey: poolTokenMint, isSigner: false, isWritable: true },
    { pubkey: poolTokenAccount, isSigner: false, isWritable: true },
    { pubkey: tokenProgramId, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
  ];
  return new TransactionInstruction({
    keys,
    programId: swapProgramId,
    data,
  });
};

export const withdrawInstruction = (
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
): TransactionInstruction => {
  const dataLayout = BufferLayout.struct([
    BufferLayout.u8("instruction"),
    Uint64Layout("poolTokenAmount"),
    Uint64Layout("minimumTokenA"),
    Uint64Layout("minimumTokenB"),
  ]);

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: 3, // Withdraw instruction
      poolTokenAmount: new NumberU64(poolTokenAmount).toBuffer(),
      minimumTokenA: new NumberU64(minimumTokenA).toBuffer(),
      minimumTokenB: new NumberU64(minimumTokenB).toBuffer(),
    },
    data
  );

  const keys = [
    { pubkey: tokenSwap, isSigner: false, isWritable: false },
    { pubkey: authority, isSigner: false, isWritable: false },
    { pubkey: poolMint, isSigner: false, isWritable: true },
    { pubkey: sourcePoolAccount, isSigner: false, isWritable: true },
    { pubkey: fromA, isSigner: false, isWritable: true },
    { pubkey: fromB, isSigner: false, isWritable: true },
    { pubkey: userAccountA, isSigner: false, isWritable: true },
    { pubkey: userAccountB, isSigner: false, isWritable: true },
    { pubkey: adminFeeAccountA, isSigner: false, isWritable: true },
    { pubkey: adminFeeAccountB, isSigner: false, isWritable: true },
    { pubkey: tokenProgramId, isSigner: false, isWritable: false },
  ];
  return new TransactionInstruction({
    keys,
    programId: swapProgramId,
    data,
  });
};
