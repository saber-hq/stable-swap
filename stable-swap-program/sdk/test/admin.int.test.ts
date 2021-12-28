import { SignerWallet } from "@saberhq/solana-contrib";
import { u64 } from "@saberhq/token-utils";
import type { Signer } from "@solana/web3.js";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
} from "@solana/web3.js";

import {
  createAdminApplyNewAdminInstruction,
  createAdminCommitNewAdminInstruction,
  StableSwap,
  ZERO_TS,
} from "../src";
import { deployTestTokens } from "../src/util/deployTestTokens";
import { deployNewSwap } from "../src/util/initialize";
import {
  AMP_FACTOR,
  BOOTSTRAP_TIMEOUT,
  CLUSTER_URL,
  getProgramDeploymentInfo,
  newKeypairWithLamports,
  sendAndConfirmTransactionWithTitle,
} from "./helpers";

describe("admin test", () => {
  // Cluster connection
  let connection: Connection;
  // Fee payer
  let payer: Signer;
  // owner of the user accounts
  let owner: Signer;
  // Stable swap
  let stableSwap: StableSwap;
  let stableSwapAccount: Keypair;
  let stableSwapProgramId: PublicKey;

  const newAdmin: Keypair = Keypair.generate();

  beforeAll(async () => {
    // Bootstrap Test Environment ...
    connection = new Connection(CLUSTER_URL, "single");
    payer = await newKeypairWithLamports(connection, LAMPORTS_PER_SOL);
    owner = await newKeypairWithLamports(connection, LAMPORTS_PER_SOL);

    const provider = new SignerWallet(payer).createProvider(connection);
    const {
      mintA: tokenAMint,
      mintB: tokenBMint,
      seedPoolAccounts,
    } = await deployTestTokens({
      provider,
      minterSigner: owner,
    });

    stableSwapProgramId = (await getProgramDeploymentInfo("localnet"))
      .programId;
    stableSwapAccount = Keypair.generate();

    const { swap: newSwap } = await deployNewSwap({
      provider,
      swapProgramID: stableSwapProgramId,
      adminAccount: owner.publicKey,
      tokenAMint,
      tokenBMint,
      ampFactor: new u64(AMP_FACTOR),

      initialLiquidityProvider: owner.publicKey,
      useAssociatedAccountForInitialLP: true,
      seedPoolAccounts,

      swapAccountSigner: stableSwapAccount,
    });

    stableSwap = newSwap;
  }, BOOTSTRAP_TIMEOUT);

  it("Commit new admin", async () => {
    const fetchedStableSwap = await StableSwap.load(
      connection,
      stableSwapAccount.publicKey,
      stableSwapProgramId
    );

    try {
      const txn = new Transaction().add(
        createAdminCommitNewAdminInstruction({
          config: fetchedStableSwap.config,
          state: fetchedStableSwap.state,
          newAdminAccount: newAdmin.publicKey,
        })
      );
      await sendAndConfirmTransactionWithTitle(
        "commit new admin",
        connection,
        txn,
        payer,
        owner
      );
    } catch (e) {
      throw new Error(e);
    }
    await stableSwap.reload(connection);
    expect(stableSwap.state.adminAccount).toEqual(owner.publicKey);
    expect(stableSwap.state.futureAdminAccount).toEqual(newAdmin.publicKey);
    expect(stableSwap.state.futureAdminDeadline).not.toEqual(ZERO_TS);
  });

  it("Apply new admin", async () => {
    const fetchedStableSwap = await StableSwap.load(
      connection,
      stableSwapAccount.publicKey,
      stableSwapProgramId
    );

    try {
      const txn = new Transaction().add(
        createAdminApplyNewAdminInstruction({
          config: fetchedStableSwap.config,
          state: fetchedStableSwap.state,
        })
      );
      await sendAndConfirmTransactionWithTitle(
        "commit new admin",
        connection,
        txn,
        payer,
        owner
      );
    } catch (e) {
      throw new Error(e);
    }
    await stableSwap.reload(connection);
    expect(stableSwap.state.adminAccount).toEqual(newAdmin.publicKey);
    expect(stableSwap.state.futureAdminAccount).toEqual(PublicKey.default);
    expect(stableSwap.state.futureAdminDeadline).toEqual(ZERO_TS);
  });
});
