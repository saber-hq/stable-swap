import type {
  PublicKey,
  TransactionInstructionCtorFields,
} from "@solana/web3.js";
import { TransactionInstruction } from "@solana/web3.js";

export const buildInstruction = ({
  config: { swapProgramID },
  keys,
  data,
}: Pick<TransactionInstructionCtorFields, "keys" | "data"> & {
  config: StableSwapConfig;
}): TransactionInstruction => {
  return new TransactionInstruction({
    keys,
    programId: swapProgramID,
    data,
  });
};

export interface StableSwapConfig {
  /**
   * The public key identifying this instance of the Stable Swap.
   */
  readonly swapAccount: PublicKey;
  /**
   * Authority
   */
  readonly authority: PublicKey;
  /**
   * Program Identifier for the Swap program
   */
  readonly swapProgramID: PublicKey;
  /**
   * Program Identifier for the Token program
   */
  readonly tokenProgramID: PublicKey;
}
