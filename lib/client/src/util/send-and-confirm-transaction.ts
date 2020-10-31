import type {
  Connection,
  Transaction,
  TransactionSignature
} from "@solana/web3.js";
import { sendAndConfirmTransaction as realSendAndConfirmTransaction } from "@solana/web3.js";
import { SignerOrAccount } from "./signerOrAccount";

export const sendAndConfirmTransaction = async (
  title: string,
  connection: Connection,
  transaction: Transaction,
  ...signers: SignerOrAccount[]
): Promise<TransactionSignature> => {
  /* tslint:disable:no-console */
  console.info(`Sending ${title} transaction`);

  // sign the TX
  signers.forEach(signer => {
    if ("signTransaction" in signer) {
      signer.signTransaction(transaction);
    } else {
      transaction.partialSign(signer);
    }
  });

  const txSig = await realSendAndConfirmTransaction(
    connection,
    transaction,
    [],
    {
      skipPreflight: false,
      commitment: connection.commitment || "recent",
      preflightCommitment: connection.commitment || "recent"
    }
  );
  console.info(`TxSig: ${txSig}`);
  return txSig;
};
