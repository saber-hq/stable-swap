import type { u64 } from "@saberhq/token-utils";
import { Uint64Layout } from "@saberhq/token-utils";
import type { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { SYSVAR_CLOCK_PUBKEY } from "@solana/web3.js";
import * as BufferLayout from "buffer-layout";

import type { StableSwapState } from "../state";
import type { Fees } from "../state/fees";
import { encodeFees, ZERO_FEES } from "../state/fees";
import type { RawFees } from "../state/layout";
import { FeesLayout } from "../state/layout";
import type { StableSwapConfig } from "./common";
import { buildInstruction } from "./common";

/**
 * Admin instruction.
 */
export enum AdminInstruction {
  RAMP_A = 100,
  STOP_RAMP_A = 101,
  PAUSE = 102,
  UNPAUSE = 103,
  SET_FEE_ACCOUNT = 104,
  APPLY_NEW_ADMIN = 105,
  COMMIT_NEW_ADMIN = 106,
  SET_NEW_FEES = 107,
}

/**
 * Creates a ramp A instruction.
 */
export const createAdminRampAInstruction = ({
  config,
  state: { adminAccount },
  targetAmp,
  stopRamp,
}: {
  config: StableSwapConfig;
  state: Pick<StableSwapState, "adminAccount">;
  targetAmp: u64;
  stopRamp: Date;
}): TransactionInstruction => {
  const keys = [
    { pubkey: config.swapAccount, isSigner: false, isWritable: true },
    { pubkey: adminAccount, isSigner: true, isWritable: false },
    { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
  ];
  const dataLayout = BufferLayout.struct<{
    instruction: number;
    targetAmp: u64;
    stopRampTS: number;
  }>([
    BufferLayout.u8("instruction"),
    Uint64Layout("targetAmp"),
    BufferLayout.ns64("stopRampTS"),
  ]);
  let data = Buffer.alloc(dataLayout.span);
  {
    const encodeLength = dataLayout.encode(
      {
        instruction: AdminInstruction.RAMP_A,
        targetAmp,
        stopRampTS: Math.floor(stopRamp.getTime() / 1000),
      },
      data
    );
    data = data.slice(0, encodeLength);
  }
  return buildInstruction({
    config,
    keys,
    data,
  });
};

/**
 * Creates a stop ramp A instruction.
 */
export const createAdminStopRampAInstruction = ({
  config,
  state: { adminAccount },
}: {
  config: StableSwapConfig;
  state: Pick<StableSwapState, "adminAccount">;
}): TransactionInstruction => {
  const keys = [
    { pubkey: config.swapAccount, isSigner: false, isWritable: true },
    { pubkey: adminAccount, isSigner: true, isWritable: false },
    { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
  ];
  const dataLayout = BufferLayout.struct<{
    instruction: number;
  }>([BufferLayout.u8("instruction")]);
  let data = Buffer.alloc(dataLayout.span);
  {
    const encodeLength = dataLayout.encode(
      {
        instruction: AdminInstruction.STOP_RAMP_A,
      },
      data
    );
    data = data.slice(0, encodeLength);
  }
  return buildInstruction({
    config,
    keys,
    data,
  });
};

/**
 * Creates a pause instruction.
 */
export const createAdminPauseInstruction = ({
  config,
  state: { adminAccount },
}: {
  config: StableSwapConfig;
  state: Pick<StableSwapState, "adminAccount">;
}): TransactionInstruction => {
  const keys = [
    { pubkey: config.swapAccount, isSigner: false, isWritable: true },
    { pubkey: adminAccount, isSigner: true, isWritable: false },
  ];
  const dataLayout = BufferLayout.struct<{
    instruction: number;
  }>([BufferLayout.u8("instruction")]);
  let data = Buffer.alloc(dataLayout.span);
  {
    const encodeLength = dataLayout.encode(
      {
        instruction: AdminInstruction.PAUSE,
      },
      data
    );
    data = data.slice(0, encodeLength);
  }
  return buildInstruction({
    config,
    keys,
    data,
  });
};

/**
 * Creates an unpause instruction.
 */
export const createAdminUnpauseInstruction = ({
  config,
  state: { adminAccount },
}: {
  config: StableSwapConfig;
  state: Pick<StableSwapState, "adminAccount">;
}): TransactionInstruction => {
  const keys = [
    { pubkey: config.swapAccount, isSigner: false, isWritable: true },
    { pubkey: adminAccount, isSigner: true, isWritable: false },
  ];
  const dataLayout = BufferLayout.struct<{
    instruction: number;
  }>([BufferLayout.u8("instruction")]);
  let data = Buffer.alloc(dataLayout.span);
  {
    const encodeLength = dataLayout.encode(
      {
        instruction: AdminInstruction.UNPAUSE,
      },
      data
    );
    data = data.slice(0, encodeLength);
  }
  return buildInstruction({
    config,
    keys,
    data,
  });
};

/**
 * Creates a set fee account instruction.
 */
export const createAdminSetFeeAccountInstruction = ({
  config,
  state: { adminAccount },
  tokenAccount,
}: {
  config: StableSwapConfig;
  state: Pick<StableSwapState, "adminAccount">;
  tokenAccount: PublicKey;
}): TransactionInstruction => {
  const keys = [
    { pubkey: config.swapAccount, isSigner: false, isWritable: true },
    { pubkey: adminAccount, isSigner: true, isWritable: false },
    { pubkey: tokenAccount, isSigner: false, isWritable: false },
  ];
  const dataLayout = BufferLayout.struct<{
    instruction: number;
  }>([BufferLayout.u8("instruction")]);
  let data = Buffer.alloc(dataLayout.span);
  {
    const encodeLength = dataLayout.encode(
      {
        instruction: AdminInstruction.SET_FEE_ACCOUNT,
      },
      data
    );
    data = data.slice(0, encodeLength);
  }
  return buildInstruction({
    config,
    keys,
    data,
  });
};

/**
 * Creates a set new fees instruction.
 */
export const createAdminApplyNewAdminInstruction = ({
  config,
  state: { adminAccount },
}: {
  config: StableSwapConfig;
  state: Pick<StableSwapState, "adminAccount">;
}): TransactionInstruction => {
  const keys = [
    { pubkey: config.swapAccount, isSigner: false, isWritable: true },
    { pubkey: adminAccount, isSigner: true, isWritable: false },
    { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
  ];
  const dataLayout = BufferLayout.struct<{
    instruction: number;
  }>([BufferLayout.u8("instruction")]);
  let data = Buffer.alloc(dataLayout.span);
  {
    const encodeLength = dataLayout.encode(
      {
        instruction: AdminInstruction.APPLY_NEW_ADMIN,
      },
      data
    );
    data = data.slice(0, encodeLength);
  }
  return buildInstruction({
    config,
    keys,
    data,
  });
};

/**
 * Creates a set new fees instruction.
 */
export const createAdminCommitNewAdminInstruction = ({
  config,
  state: { adminAccount },
  newAdminAccount,
}: {
  config: StableSwapConfig;
  state: Pick<StableSwapState, "adminAccount">;
  newAdminAccount: PublicKey;
}): TransactionInstruction => {
  const keys = [
    { pubkey: config.swapAccount, isSigner: false, isWritable: true },
    { pubkey: adminAccount, isSigner: true, isWritable: false },
    { pubkey: newAdminAccount, isSigner: true, isWritable: false },
    { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
  ];
  const dataLayout = BufferLayout.struct<{
    instruction: number;
  }>([BufferLayout.u8("instruction")]);
  let data = Buffer.alloc(dataLayout.span);
  {
    const encodeLength = dataLayout.encode(
      {
        instruction: AdminInstruction.COMMIT_NEW_ADMIN,
      },
      data
    );
    data = data.slice(0, encodeLength);
  }
  return buildInstruction({
    config,
    keys,
    data,
  });
};

/**
 * Creates a set new fees instruction.
 */
export const createAdminSetNewFeesInstruction = ({
  config,
  state: { adminAccount },
  fees = ZERO_FEES,
}: {
  config: StableSwapConfig;
  state: Pick<StableSwapState, "adminAccount">;
  fees: Fees;
}): TransactionInstruction => {
  const keys = [
    { pubkey: config.swapAccount, isSigner: false, isWritable: true },
    { pubkey: adminAccount, isSigner: true, isWritable: false },
  ];
  const dataLayout = BufferLayout.struct<{
    instruction: number;
    fees: RawFees;
  }>([BufferLayout.u8("instruction"), FeesLayout]);
  let data = Buffer.alloc(dataLayout.span);
  {
    const encodeLength = dataLayout.encode(
      {
        instruction: AdminInstruction.SET_NEW_FEES, // InitializeSwap instruction
        fees: encodeFees(fees),
      },
      data
    );
    data = data.slice(0, encodeLength);
  }
  return buildInstruction({
    config,
    keys,
    data,
  });
};
