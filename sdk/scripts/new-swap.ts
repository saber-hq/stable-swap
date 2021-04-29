import {
  Connection,
  Account,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import { Token } from "@solana/spl-token";

import { StableSwap } from "../src";
import { DEFAULT_TOKEN_DECIMALS, TOKEN_PROGRAM_ID } from "../src/constants";
import {
  getDeploymentInfo,
  newAccountWithLamports,
  sleep,
} from "../test/helpers";

const AMP_FACTOR = 100;
const INITIAL_TOKEN_A_AMOUNT = 1000000 * Math.pow(10, DEFAULT_TOKEN_DECIMALS);
const INITIAL_TOKEN_B_AMOUNT = 1000000 * Math.pow(10, DEFAULT_TOKEN_DECIMALS);

const run = async () => {
  const { clusterUrl, stableSwapProgramId } = getDeploymentInfo();
  const connection = new Connection(clusterUrl);
  console.log("Requesting airdrop ...");
  const payer = await newAccountWithLamports(connection, LAMPORTS_PER_SOL);
  const owner = await newAccountWithLamports(connection, LAMPORTS_PER_SOL);

  const stableSwapAccount = new Account();
  const [authority, nonce] = await PublicKey.findProgramAddress(
    [stableSwapAccount.publicKey.toBuffer()],
    stableSwapProgramId
  );
  console.log("Creating pool mint ...");
  const tokenPool = await Token.createMint(
    connection,
    payer,
    authority,
    null,
    DEFAULT_TOKEN_DECIMALS,
    TOKEN_PROGRAM_ID
  );
  const userPoolAccount = await tokenPool.createAccount(owner.publicKey);

  console.log("Creating TokenA mint ...");
  const mintA = await Token.createMint(
    connection,
    payer,
    owner.publicKey,
    null,
    DEFAULT_TOKEN_DECIMALS,
    TOKEN_PROGRAM_ID
  );
  console.log("Creating TokenA accounts ...");
  // create token A account then mint to it
  const adminAccountA = await mintA.createAccount(owner.publicKey);
  const tokenAccountA = await mintA.createAccount(authority);
  await mintA.mintTo(tokenAccountA, owner, [], INITIAL_TOKEN_A_AMOUNT);
  console.log("Creating TokenA accounts ...");
  const mintB = await Token.createMint(
    connection,
    payer,
    owner.publicKey,
    null,
    DEFAULT_TOKEN_DECIMALS,
    TOKEN_PROGRAM_ID
  );

  console.log("Creating TokenB accounts ...");
  const adminAccountB = await mintB.createAccount(owner.publicKey);
  const tokenAccountB = await mintB.createAccount(authority);
  await mintB.mintTo(tokenAccountB, owner, [], INITIAL_TOKEN_B_AMOUNT);

  // Sleep to make sure token accounts are created ...
  await sleep(500);

  console.log("Creating new swap ...");
  const newSwap = await StableSwap.createStableSwap(
    connection,
    payer,
    stableSwapAccount,
    authority,
    owner.publicKey,
    adminAccountA,
    adminAccountB,
    mintA.publicKey,
    tokenAccountA,
    mintB.publicKey,
    tokenAccountB,
    tokenPool.publicKey,
    userPoolAccount,
    mintA.publicKey,
    mintB.publicKey,
    stableSwapProgramId,
    TOKEN_PROGRAM_ID,
    nonce,
    AMP_FACTOR
  );

  console.log("Payer KP: ", payer.secretKey.toString());
  console.log("Owner KP: ", owner.secretKey.toString());
  console.log("MintA: ", mintA.publicKey.toString());
  console.log("MintB: ", mintB.publicKey.toString());
  console.log("FeeAccountA: ", newSwap.adminFeeAccountA.toString());
  console.log("FeeAccountB: ", newSwap.adminFeeAccountB.toString());
  console.log("Address: ", newSwap.stableSwap.toString());
  console.log("ProgramID: ", newSwap.swapProgramId.toString());
};

run();
