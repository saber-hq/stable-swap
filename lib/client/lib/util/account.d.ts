/// <reference types="node" />
import type { Connection } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
export declare const loadAccount: (
  connection: Connection,
  address: PublicKey,
  programId: PublicKey
) => Promise<Buffer>;
//# sourceMappingURL=account.d.ts.map
