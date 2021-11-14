import type {
  ConfirmOptions,
  Connection,
  Signer,
  TransactionInstruction,
} from "@solana/web3.js";
import { sendAndConfirmTransaction, Transaction } from "@solana/web3.js";

export interface TransactionInstructions {
  /**
   * Transaction instructions
   */
  instructions: readonly TransactionInstruction[];
  /**
   * Additional transaction signers if applicable
   */
  signers: readonly Signer[];
}

export interface MutableTransactionInstructions {
  /**
   * Transaction instructions
   */
  instructions: TransactionInstruction[];
  /**
   * Additional transaction signers if applicable
   */
  signers: Signer[];
}

export const createMutableTransactionInstructions =
  (): MutableTransactionInstructions => ({
    instructions: [],
    signers: [],
  });

/**
 * Executes a TransactionInstructions
 * @param title
 * @param param1
 * @param param2
 * @returns Transaction signature
 */
export const executeTxInstructions = async (
  title: string,
  { instructions, signers }: TransactionInstructions,
  {
    connection,
    payerSigner,
    options,
  }: {
    connection: Connection;
    payerSigner: Signer;
    options?: ConfirmOptions;
  }
): Promise<string> => {
  console.log(`Running tx ${title}`);
  const tx = new Transaction();
  tx.add(...instructions);
  const txSig = await sendAndConfirmTransaction(
    connection,
    tx,
    [
      // payer of the tx
      payerSigner,
      // initialize the swap
      ...signers,
    ],
    options
  );
  console.log(`${title} done at tx: ${txSig}`);
  return txSig;
};

export const mergeInstructions = (
  mut: MutableTransactionInstructions,
  inst: TransactionInstructions
): void => {
  mut.instructions.push(...inst.instructions);
  mut.signers.push(...inst.signers);
};
