import { Account, PublicKey } from "@solana/web3.js";
import type { Connection } from "@solana/web3.js";
export declare function sleep(ms: number): Promise<void>;
export declare function newAccountWithLamports(
  connection: Connection,
  lamports?: number
): Promise<Account>;
export declare const getDeploymentInfo: () => {
  clusterUrl: any;
  stableSwapProgramId: PublicKey;
};
//# sourceMappingURL=helpers.d.ts.map
