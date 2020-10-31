import type { Account, PublicKey, Transaction } from "@solana/web3.js";

/**
 * Signer can sign transactions. @project-serum/sol-wallet-adapter implements this interface.
 */
export interface Signer {
  publicKey: PublicKey;
  /**
   * Signs the transaction
   * @param tx
   */
  signTransaction(tx: Transaction): Promise<Transaction>;
}

export type SignerOrAccount = Signer | Account;
