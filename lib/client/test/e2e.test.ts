import fs from "mz/fs";

// import { Glob } from "glob";
import { Token } from "@solana/spl-token";
import {
  Account,
  Connection,
  // BpfLoader,
  PublicKey,
  // BPF_LOADER_PROGRAM_ID,
} from "@solana/web3.js";

import { StableSwap } from "../src";

// Cluster configs
const CLUSTER_URL = "http://localhost:8899";
const BOOTSTRAP_TIMEOUT = 300000;
// Pool confgs
const AMP_FACTOR = 100;
const FEE_NUMERATOR = 1;
const FEE_DENOMINATOR = 4;
// Initial amount in each swap token
let currentSwapTokenA = 1000;
let currentSwapTokenB = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function newAccountWithLamports(
  connection: Connection,
  lamports: number = 1000000
): Promise<Account> {
  const account = new Account();

  let retries = 30;
  try {
    await connection.requestAirdrop(account.publicKey, lamports);
  } catch(e) {
    console.error(e)
  }
  for (;;) {
    await sleep(500);
    if (lamports == (await connection.getBalance(account.publicKey))) {
      return account;
    }
    if (--retries <= 0) {
      break;
    }
  }
  throw new Error(`Airdrop of ${lamports} failed`);
}

// async function loadProgram(
//   connection: Connection,
//   path: string
// ): Promise<PublicKey> {
//   const NUM_RETRIES = 500; /* allow some number of retries */
//   const data = await fs.readFile(path);
//   const { feeCalculator } = await connection.getRecentBlockhash();
//   const balanceNeeded =
//     feeCalculator.lamportsPerSignature *
//       (BpfLoader.getMinNumSignatures(data.length) + NUM_RETRIES) +
//     (await connection.getMinimumBalanceForRentExemption(data.length));
//   
//   const from = await newAccountWithLamports(connection, balanceNeeded + 1000000000);
//   const program_account = new Account();
//   console.log("Loading program:", path);
//   try {
//     await BpfLoader.load(
//       connection,
//       from,
//       program_account,
//       data,
//       BPF_LOADER_PROGRAM_ID
//     );
//   } catch(e) {
//     console.error(e);
//   }
//   return program_account.publicKey;
// }

// async function GetStableSwapProgram(
//   connection: Connection
// ): Promise<PublicKey> {
// // ): Promise<[PublicKey, PublicKey]> {
//   return await loadProgram(
//     connection,
//     "../../target/bpfel-unknown-unknown/release/stable_swap.so"
//   );
//   // const findSPLTokenSol = new Glob("../../target/bpfel-unknown-unknown/release/deps/spl_token-*.so")
//   // console.log(findSPLTokenSol);
//   // const tokenProgramId = await loadProgram(
//   //   connection,
//   //   findSPLTokenSol.found[0]
//   // );
//   // return [tokenProgramId, tokenSwapProgramId];
// }

describe("e2e test", () => {
  // Cluster connection
  let connection: Connection;
  // Fee payer
  let payer: Account;
  // Stable swap
  let stableSwap: StableSwap;
  // authority of the token and accounts
  let authority: PublicKey;
  // nonce used to generate the authority public key
  let nonce: number;
  // owner of the user accounts
  let owner: Account;
  // Token pool
  let tokenPool: Token;
  // Tokens swapped
  let mintA: Token;
  let mintB: Token;
  let tokenAccountA: PublicKey;
  let tokenAccountB: PublicKey;
  // Programs
  let stableSwapAccount: Account;
  // let stableSwapProgramId: PublicKey;
  const stableSwapProgramId: PublicKey = new PublicKey("5EtkXMSgEtBNZpY8LenSYoYrDNxKPT3gCRfbTGm3vu5G")
  const tokenProgramId: PublicKey = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

  beforeAll(async done => {
    connection = new Connection(CLUSTER_URL, "single");
    // stableSwapProgramId = await GetStableSwapProgram(connection);
    
    console.log("Token Program ID", tokenProgramId.toString());
    console.log("StableSwap Program ID", stableSwapProgramId.toString());

    payer = await newAccountWithLamports(connection, 1000000000);
    owner = await newAccountWithLamports(connection, 1000000000);
    stableSwapAccount = new Account();
    try {
      [authority, nonce] = await PublicKey.findProgramAddress(
        [stableSwapAccount.publicKey.toBuffer()],
        stableSwapProgramId
      );
    } catch(e) {
      console.error(e)
    }

    console.log("creating pool mint");
    try {
      tokenPool = await Token.createMint(
        connection,
        payer,
        authority,
        null,
        2,
        tokenProgramId
      );
    } catch(e) {
      console.error(e)
    }

    console.log("creating token A");
    try {
      mintA = await Token.createMint(
        connection,
        payer,
        owner.publicKey,
        null,
        2,
        tokenProgramId
      );
    } catch(e) {
      console.error(e)
    }

    console.log("creating token A account");
    try {
      tokenAccountA = await mintA.createAccount(authority);
    } catch(e) {
      console.error(e)
    }
    try{
      await mintA.mintTo(tokenAccountA, owner, [], currentSwapTokenA);
    } catch(e) {
      console.error(e)
    }

    console.log("creating token B");
    try {
      mintB = await Token.createMint(
        connection,
        payer,
        owner.publicKey,
        null,
        2,
        tokenProgramId
      );
    } catch(e) {
      console.error(e)
    }

    console.log("creating token B account");
    try {
      tokenAccountB = await mintB.createAccount(authority);
    } catch(e) {
      console.error(e)
    }

    console.log("minting token B to swap");
    try {
      await mintB.mintTo(tokenAccountB, owner, [], currentSwapTokenB);
    } catch(e) {
      console.error(e)
    }

    console.log("creating token swap");
    try {
      stableSwap = await StableSwap.createStableSwap(
        connection,
        payer,
        stableSwapAccount,
        authority,
        tokenAccountA,
        tokenAccountB,
        tokenPool.publicKey,
        mintA.publicKey,
        mintB.publicKey,
        stableSwapProgramId,
        tokenProgramId,
        nonce,
        AMP_FACTOR,
        FEE_NUMERATOR,
        FEE_DENOMINATOR,
      );
    } catch(e) {
      console.error(e)
    }

    done()
  }, BOOTSTRAP_TIMEOUT);

  it("loadStableSwap", async() => {
    const fetchedStableSwap = await StableSwap.loadStableSwap(
      connection,
      stableSwapAccount.publicKey,
      stableSwapProgramId,
      payer,
    );
    expect(fetchedStableSwap.stableSwap).toEqual(stableSwapAccount.publicKey);
    expect(fetchedStableSwap.tokenAccountA).toEqual(tokenAccountA);
    expect(fetchedStableSwap.tokenAccountB).toEqual(tokenAccountB);
    // TODO: Uncomment after new spl-token client
    // expect(fetchedStableSwap.mintA).toEqual(mintA.publicKey);
    // expect(fetchedStableSwap.mintB).toEqual(mintB.publicKey);
    // expect(fetchedStableSwap.poolToken).toEqual(tokenPool.publicKey);
    expect(
      fetchedStableSwap.ampFactor.toNumber()
    ).toBe(AMP_FACTOR);
    expect(
      fetchedStableSwap.feeNumerator.toNumber(),
    ).toBe(FEE_NUMERATOR);
    expect(
      fetchedStableSwap.feeDenominator.toNumber(),
    ).toBe(FEE_DENOMINATOR);
  })
});
