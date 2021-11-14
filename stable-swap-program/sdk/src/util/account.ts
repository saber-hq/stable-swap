import type { Connection, PublicKey } from "@solana/web3.js";

/**
 * Loads the account info of an account owned by a program.
 * @param connection
 * @param address
 * @param programId
 * @returns
 */
export const loadProgramAccount = async (
  connection: Connection,
  address: PublicKey,
  programId: PublicKey
): Promise<Buffer> => {
  const accountInfo = await connection.getAccountInfo(address);
  if (accountInfo === null) {
    throw new Error("Failed to find account");
  }

  if (!accountInfo.owner.equals(programId)) {
    throw new Error(
      `Invalid owner: expected ${programId.toBase58()}, found ${accountInfo.owner.toBase58()}`
    );
  }

  return Buffer.from(accountInfo.data);
};
