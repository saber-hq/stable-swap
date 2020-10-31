import { sendAndConfirmTransaction as realSendAndConfirmTransaction } from "@solana/web3.js";
import type {
  Account,
  Connection,
  Transaction,
  TransactionSignature,
} from "@solana/web3.js";

export const sendAndConfirmTransaction = async (
  title: string,
  connection: Connection,
  transaction: Transaction,
  ...signers: Account[]
): Promise<TransactionSignature | null> => {
  /* tslint:disable:no-console */
  console.info(`Sending ${title} transaction`);
  const txSig = await realSendAndConfirmTransaction(
    connection,
    transaction,
    signers,
    {
      skipPreflight: false,
      commitment: connection.commitment || "recent",
      preflightCommitment: connection.commitment || "recent",
    }
  );
  console.info(`TxSig: ${txSig}`);
  return txSig;
};
