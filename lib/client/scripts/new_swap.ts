import fs from "fs";
import { StableSwap } from "../src";
import { Connection, Account, PublicKey } from "@solana/web3.js";
import { Token } from "@solana/spl-token";

const ONE_SOL = 1000000000;
const AMP_FACTOR = 100;
const INITIAL_TOKEN_A_AMOUNT = ONE_SOL;
const INITIAL_TOKEN_B_AMOUNT = ONE_SOL;
const TokenProgramId = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

const sleep = async (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const newAccountWithLamports = async (
  connection: Connection,
  lamports: number
) => {
  const account = new Account();

  let retries = 30;
  try {
    const txSig = await connection.requestAirdrop(account.publicKey, lamports);
    console.log(`Airdrop requested: ${txSig}`);
  } catch (e) {
    // tslint:disable:no-console
    console.error(e);
  }
  for (;;) {
    await sleep(1000);
    let balance = await connection.getBalance(account.publicKey);
    if (lamports === balance) {
      return account;
    }
    if (--retries <= 0) {
      break;
    }
  }
  throw new Error(`Airdrop of ${lamports} failed`);
};

const getDeploymentInfo = () => {
  const data = fs.readFileSync("../last-deploy.json", "utf-8");
  const deployInfo = JSON.parse(data);
  return {
    clusterUrl: deployInfo.clusterUrl,
    stableSwapProgramId: new PublicKey(deployInfo.swapProgramId)
  };
};

const run = async () => {
  const { clusterUrl, stableSwapProgramId } = getDeploymentInfo();
  const connection = new Connection(clusterUrl);
  const payer = await newAccountWithLamports(connection, ONE_SOL);
  const owner = await newAccountWithLamports(connection, ONE_SOL);

  const stableSwapAccount = new Account();
  const [authority, nonce] = await PublicKey.findProgramAddress(
    [stableSwapAccount.publicKey.toBuffer()],
    stableSwapProgramId
  );

  // creating pool mint
  const tokenPool = await Token.createMint(
    connection,
    payer,
    authority,
    null,
    2,
    TokenProgramId
  );
  const userPoolAccount = await tokenPool.createAccount(owner.publicKey);

  // creating token A
  const mintA = await Token.createMint(
    connection,
    payer,
    owner.publicKey,
    null,
    2,
    TokenProgramId
  );
  // create token A account then mint to it
  const adminAccountA = await mintA.createAccount(owner.publicKey);
  const tokenAccountA = await mintA.createAccount(authority);
  await mintA.mintTo(tokenAccountA, owner, [], INITIAL_TOKEN_A_AMOUNT);
  // creating token B
  const mintB = await Token.createMint(
    connection,
    payer,
    owner.publicKey,
    null,
    2,
    TokenProgramId
  );

  // creating token B account then mint to it
  const adminAccountB = await mintB.createAccount(owner.publicKey);
  const tokenAccountB = await mintB.createAccount(authority);
  await mintB.mintTo(tokenAccountB, owner, [], INITIAL_TOKEN_B_AMOUNT);
  // Sleep to make sure token accounts are created ...
  await sleep(500);

  // creating stable swap
  const newSwap = await StableSwap.createStableSwap(
    connection,
    payer,
    stableSwapAccount,
    authority,
    adminAccountA,
    adminAccountB,
    tokenAccountA,
    tokenAccountB,
    tokenPool.publicKey,
    userPoolAccount,
    mintA.publicKey,
    mintB.publicKey,
    stableSwapProgramId,
    TokenProgramId,
    nonce,
    AMP_FACTOR
  );

  console.log("Payer PK: ", payer.secretKey.toString());
  console.log("Owner PK: ", owner.secretKey.toString());
  console.log("ProgramID: ", newSwap.swapProgramId.toString());
  console.log("Address: ", newSwap.stableSwap.toString());
};

run();
