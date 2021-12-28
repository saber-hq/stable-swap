import type { Network } from "@saberhq/solana-contrib";
import { DEFAULT_NETWORK_CONFIG_MAP } from "@saberhq/solana-contrib";
import { Percent } from "@saberhq/token-utils";
import type {
  Cluster,
  Connection,
  Signer,
  Transaction,
  TransactionSignature,
} from "@solana/web3.js";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction as realSendAndConfirmTransaction,
} from "@solana/web3.js";
import * as fs from "fs/promises";
import * as os from "os";

import type { Fees } from "../src";
import { DEFAULT_FEE } from "../src";

// Initial amount in each swap token
export const INITIAL_TOKEN_A_AMOUNT = LAMPORTS_PER_SOL;
export const INITIAL_TOKEN_B_AMOUNT = LAMPORTS_PER_SOL;

// Cluster configs
export const CLUSTER_URL = "http://localhost:8899";
export const BOOTSTRAP_TIMEOUT = 300000;
// Pool configs
export const AMP_FACTOR = 100;
export const FEES: Fees = {
  adminTrade: DEFAULT_FEE,
  adminWithdraw: DEFAULT_FEE,
  trade: new Percent(1, 4),
  withdraw: DEFAULT_FEE,
};

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const requestAirdrop = async (
  connection: Connection,
  account: PublicKey,
  lamports: number = LAMPORTS_PER_SOL
): Promise<void> => {
  const txSig = await connection.requestAirdrop(account, lamports);
  await connection.confirmTransaction(txSig);
};

export async function newKeypairWithLamports(
  connection: Connection,
  lamports = LAMPORTS_PER_SOL
): Promise<Keypair> {
  const keypair = Keypair.generate();
  await requestAirdrop(connection, keypair.publicKey, lamports);
  return keypair;
}

export const isCluster = (clusterRaw?: string): clusterRaw is Cluster =>
  clusterRaw !== undefined &&
  (Object.keys(DEFAULT_NETWORK_CONFIG_MAP) as readonly string[]).includes(
    clusterRaw
  );

interface IDeployment {
  cluster: Network;
  programId: PublicKey;
  authority: PublicKey;
}

export const getProgramDeploymentInfo = async (
  cluster: Network
): Promise<IDeployment> => {
  const data = await fs.readFile(
    `${os.homedir()}/stableswap_deployments/${cluster}/program.json`,
    "utf-8"
  );
  const deployInfo = JSON.parse(data) as {
    programId: string;
    authority: string;
  };
  return {
    cluster,
    programId: new PublicKey(deployInfo.programId),
    authority: new PublicKey(deployInfo.authority),
  };
};

export const CLUSTER_API_URLS: { [C in Network]: string } = {
  "mainnet-beta": "https://api.mainnet-beta.solana.com",
  devnet: "https://api.devnet.solana.com",
  testnet: "https://api.testnet.solana.com",
  localnet: "http://127.0.0.1:8899",
};

export const sendAndConfirmTransactionWithTitle = async (
  title: string,
  connection: Connection,
  transaction: Transaction,
  ...signers: Signer[]
): Promise<TransactionSignature> => {
  console.info(`Sending ${title} transaction`);
  const txSig = await realSendAndConfirmTransaction(
    connection,
    transaction,
    signers,
    {
      skipPreflight: false,
      commitment: connection.commitment ?? "recent",
      preflightCommitment: connection.commitment ?? "recent",
    }
  );
  console.info(`TxSig: ${txSig}`);
  const txReceipt = await connection.getConfirmedTransaction(
    txSig,
    "confirmed"
  );
  console.log(`Result: ${txReceipt?.meta?.logMessages?.join("\n") ?? "--"}`);
  return txSig;
};
