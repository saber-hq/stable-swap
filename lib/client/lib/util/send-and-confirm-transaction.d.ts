import type {
  Account,
  Connection,
  Transaction,
  TransactionSignature,
} from "@solana/web3.js";
export declare const sendAndConfirmTransaction: (
  title: string,
  connection: Connection,
  transaction: Transaction,
  ...signers: Account[]
) => Promise<TransactionSignature>;
//# sourceMappingURL=send-and-confirm-transaction.d.ts.map
