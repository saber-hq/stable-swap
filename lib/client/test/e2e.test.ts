import fs from "fs";

import { Token } from "@solana/spl-token";
import { Account, Connection, PublicKey } from "@solana/web3.js";

import { StableSwap } from "../src";
import { newAccountWithLamports, sleep } from "./helpers";

// Token Program
const TokenProgramId: PublicKey = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);
// Cluster configs
const CLUSTER_URL = "http://localhost:8899";
const BOOTSTRAP_TIMEOUT = 300000;
// Pool configs
const AMP_FACTOR = 100;
const FEE_NUMERATOR = 1;
const FEE_DENOMINATOR = 4;
// Initial amount in each swap token
let currentSwapTokenA = 1000;
let currentSwapTokenB = 1000;

const getStableSwapAddress = (): string => {
  let data = fs.readFileSync("../../localnet-address.json", "utf-8");
  let addresses = JSON.parse(data);
  return addresses.stableSwap as string;
};

describe("e2e test", () => {
  // Cluster connection
  let connection: Connection;
  // Fee payer
  let payer: Account;
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
  // Stable swap
  let stableSwap: StableSwap;
  let stableSwapAccount: Account;
  let stableSwapProgramId: PublicKey;

  beforeAll(async (done) => {
    // Bootstrap Test Environment ...
    connection = new Connection(CLUSTER_URL, "single");

    stableSwapProgramId = new PublicKey(getStableSwapAddress());

    console.log("Token Program ID", TokenProgramId.toString());
    console.log("StableSwap Program ID", stableSwapProgramId.toString());

    payer = await newAccountWithLamports(connection, 1000000000);
    owner = await newAccountWithLamports(connection, 1000000000);
    stableSwapAccount = new Account();
    try {
      [authority, nonce] = await PublicKey.findProgramAddress(
        [stableSwapAccount.publicKey.toBuffer()],
        stableSwapProgramId
      );
    } catch (e) {
      console.error(e);
    }

    console.log("creating pool mint");
    try {
      tokenPool = await Token.createMint(
        connection,
        payer,
        authority,
        null,
        2,
        TokenProgramId
      );
    } catch (e) {
      console.error(e);
    }

    console.log("creating token A");
    try {
      mintA = await Token.createMint(
        connection,
        payer,
        owner.publicKey,
        null,
        2,
        TokenProgramId
      );
    } catch (e) {
      console.error(e);
    }

    console.log("creating token A account");
    try {
      tokenAccountA = await mintA.createAccount(authority);
    } catch (e) {
      console.error(e);
    }
    try {
      await mintA.mintTo(tokenAccountA, owner, [], currentSwapTokenA);
    } catch (e) {
      console.error(e);
    }

    console.log("creating token B");
    try {
      mintB = await Token.createMint(
        connection,
        payer,
        owner.publicKey,
        null,
        2,
        TokenProgramId
      );
    } catch (e) {
      console.error(e);
    }

    console.log("creating token B account");
    try {
      tokenAccountB = await mintB.createAccount(authority);
    } catch (e) {
      console.error(e);
    }

    console.log("minting token B to swap");
    try {
      await mintB.mintTo(tokenAccountB, owner, [], currentSwapTokenB);
    } catch (e) {
      console.error(e);
    }

    // Sleep to make sure token accounts are credited ...
    await sleep(500);

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
        TokenProgramId,
        nonce,
        AMP_FACTOR,
        FEE_NUMERATOR,
        FEE_DENOMINATOR
      );
    } catch (e) {
      console.error(e);
    }

    done();
  }, BOOTSTRAP_TIMEOUT);

  it("loadStableSwap", async () => {
    const fetchedStableSwap = await StableSwap.loadStableSwap(
      connection,
      stableSwapAccount.publicKey,
      stableSwapProgramId,
      payer
    );
    expect(fetchedStableSwap.stableSwap).toEqual(stableSwapAccount.publicKey);
    expect(fetchedStableSwap.tokenAccountA).toEqual(tokenAccountA);
    expect(fetchedStableSwap.tokenAccountB).toEqual(tokenAccountB);
    // TODO: Uncomment after new spl-token client release
    // expect(fetchedStableSwap.mintA).toEqual(mintA.publicKey);
    // expect(fetchedStableSwap.mintB).toEqual(mintB.publicKey);
    // expect(fetchedStableSwap.poolToken).toEqual(tokenPool.publicKey);
    expect(fetchedStableSwap.ampFactor.toNumber()).toBe(AMP_FACTOR);
    expect(fetchedStableSwap.feeNumerator.toNumber()).toBe(FEE_NUMERATOR);
    expect(fetchedStableSwap.feeDenominator.toNumber()).toBe(FEE_DENOMINATOR);
  });
});
