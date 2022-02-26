import { SignerWallet } from "@saberhq/solana-contrib";
import type { IExchange } from "@saberhq/stableswap-sdk";
import {
  calculateVirtualPrice,
  deployNewSwap,
  loadExchangeInfo,
  parseEventLogs,
  StableSwap,
  SWAP_PROGRAM_ID,
} from "@saberhq/stableswap-sdk";
import {
  SPLToken,
  Token as SToken,
  TOKEN_PROGRAM_ID,
  u64,
} from "@saberhq/token-utils";
import type { PublicKey, Signer, TransactionResponse } from "@solana/web3.js";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  Transaction,
} from "@solana/web3.js";

import { deployTestTokens } from "./deployTestTokens";
import {
  AMP_FACTOR,
  BOOTSTRAP_TIMEOUT,
  CLUSTER_URL,
  FEES,
  INITIAL_TOKEN_A_AMOUNT,
  INITIAL_TOKEN_B_AMOUNT,
  newKeypairWithLamports,
  sendAndConfirmTransactionWithTitle,
  sleep,
} from "./helpers";

describe("e2e test", () => {
  // Cluster connection
  let connection: Connection;
  // Fee payer
  let payer: Signer;
  // owner of the user accounts
  let owner: Signer;
  // Token pool
  let tokenPool: SPLToken;
  let userPoolAccount: PublicKey;
  // Tokens swapped
  let mintA: SPLToken;
  let mintB: SPLToken;
  let tokenAccountA: PublicKey;
  let tokenAccountB: PublicKey;
  // Admin fee accounts
  let adminFeeAccountA: PublicKey;
  let adminFeeAccountB: PublicKey;
  // Stable swap
  let exchange: IExchange;
  let stableSwap: StableSwap;
  let stableSwapAccount: Keypair;
  let stableSwapProgramId: PublicKey;

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
      initialTokenAAmount: INITIAL_TOKEN_A_AMOUNT,
      initialTokenBAmount: INITIAL_TOKEN_B_AMOUNT,
    });

    stableSwapProgramId = SWAP_PROGRAM_ID;
    stableSwapAccount = Keypair.generate();

    const { swap: newSwap, initializeArgs } = await deployNewSwap({
      provider,
      swapProgramID: stableSwapProgramId,
      adminAccount: owner.publicKey,
      tokenAMint,
      tokenBMint,
      ampFactor: new u64(AMP_FACTOR),
      fees: FEES,

      initialLiquidityProvider: owner.publicKey,
      useAssociatedAccountForInitialLP: true,
      seedPoolAccounts,

      swapAccountSigner: stableSwapAccount,
    });

    exchange = {
      programID: stableSwapProgramId,
      swapAccount: stableSwapAccount.publicKey,
      lpToken: new SToken({
        symbol: "LP",
        name: "StableSwap LP",
        address: initializeArgs.poolTokenMint.toString(),
        decimals: 6,
        chainId: 100,
      }),
      tokens: [
        new SToken({
          symbol: "TOKA",
          name: "Token A",
          address: initializeArgs.tokenA.mint.toString(),
          decimals: 6,
          chainId: 100,
        }),
        new SToken({
          symbol: "TOKB",
          name: "Token B",
          address: initializeArgs.tokenB.mint.toString(),
          decimals: 6,
          chainId: 100,
        }),
      ],
    };

    stableSwap = newSwap;
    tokenPool = new SPLToken(
      connection,
      initializeArgs.poolTokenMint,
      TOKEN_PROGRAM_ID,
      payer
    );

    mintA = new SPLToken(
      connection,
      initializeArgs.tokenA.mint,
      TOKEN_PROGRAM_ID,
      payer
    );
    mintB = new SPLToken(
      connection,
      initializeArgs.tokenB.mint,
      TOKEN_PROGRAM_ID,
      payer
    );
    tokenAccountA = initializeArgs.tokenA.reserve;
    tokenAccountB = initializeArgs.tokenB.reserve;
    adminFeeAccountA = initializeArgs.tokenA.adminFeeAccount;
    adminFeeAccountB = initializeArgs.tokenB.adminFeeAccount;

    userPoolAccount = initializeArgs.destinationPoolTokenAccount;
  }, BOOTSTRAP_TIMEOUT);

  it("bootstrapper's LP balance", async () => {
    const info = await tokenPool.getAccountInfo(userPoolAccount);
    expect(info.amount.toNumber()).toEqual(
      INITIAL_TOKEN_A_AMOUNT + INITIAL_TOKEN_B_AMOUNT
    );
  });

  it("loadStableSwap", async () => {
    const fetchedStableSwap = await StableSwap.load(
      connection,
      stableSwapAccount.publicKey,
      stableSwapProgramId
    );

    expect(fetchedStableSwap.config.swapAccount).toEqual(
      stableSwapAccount.publicKey
    );
    const { state } = fetchedStableSwap;
    expect(state.tokenA.adminFeeAccount).toEqual(adminFeeAccountA);
    expect(state.tokenB.adminFeeAccount).toEqual(adminFeeAccountB);
    expect(state.tokenA.reserve).toEqual(tokenAccountA);
    expect(state.tokenB.reserve).toEqual(tokenAccountB);
    expect(state.tokenA.mint).toEqual(mintA.publicKey);
    expect(state.tokenB.mint).toEqual(mintB.publicKey);
    expect(state.poolTokenMint).toEqual(tokenPool.publicKey);
    expect(state.initialAmpFactor.toNumber()).toEqual(AMP_FACTOR);
    expect(state.targetAmpFactor.toNumber()).toEqual(AMP_FACTOR);
    expect(state.fees).toEqual(FEES);
  });

  it("getVirtualPrice", async () => {
    const exchangeInfo = await loadExchangeInfo(
      connection,
      exchange,
      stableSwap
    );
    expect(calculateVirtualPrice(exchangeInfo)?.toFixed(4)).toBe("1.0000");
  });

  it("deposit", async () => {
    const depositAmountA = LAMPORTS_PER_SOL;
    const depositAmountB = LAMPORTS_PER_SOL;
    // Creating depositor token a account
    const userAccountA = await mintA.createAccount(owner.publicKey);
    await mintA.mintTo(userAccountA, owner, [], depositAmountA);
    // Creating depositor token b account
    const userAccountB = await mintB.createAccount(owner.publicKey);
    await mintB.mintTo(userAccountB, owner, [], depositAmountB);
    // Make sure all token accounts are created and approved
    await sleep(500);

    let txReceipt: TransactionResponse | null = null;
    // Depositing into swap
    const txn = new Transaction().add(
      stableSwap.deposit({
        userAuthority: owner.publicKey,
        sourceA: userAccountA,
        sourceB: userAccountB,
        poolTokenAccount: userPoolAccount,
        tokenAmountA: new u64(depositAmountA),
        tokenAmountB: new u64(depositAmountB),
        minimumPoolTokenAmount: new u64(0), // To avoid slippage errors
      })
    );
    const txSig = await sendAndConfirmTransactionWithTitle(
      "deposit",
      connection,
      txn,
      payer,
      owner
    );
    txReceipt = await connection.getTransaction(txSig, {
      commitment: "confirmed",
    });

    let info = await mintA.getAccountInfo(userAccountA);
    expect(info.amount.toNumber()).toBe(0);
    info = await mintB.getAccountInfo(userAccountB);
    expect(info.amount.toNumber()).toBe(0);
    info = await mintA.getAccountInfo(tokenAccountA);
    expect(info.amount.toNumber()).toBe(
      INITIAL_TOKEN_A_AMOUNT + depositAmountA
    );
    info = await mintB.getAccountInfo(tokenAccountB);
    expect(info.amount.toNumber()).toBe(
      INITIAL_TOKEN_B_AMOUNT + depositAmountB
    );
    info = await tokenPool.getAccountInfo(userPoolAccount);
    expect(info.amount.toNumber()).toBe(4_000_000_000);

    const logMessages = parseEventLogs(txReceipt?.meta?.logMessages);
    expect(logMessages).toEqual([
      {
        type: "Deposit",
        tokenAAmount: new u64(depositAmountA),
        tokenBAmount: new u64(depositAmountB),
        poolTokenAmount: new u64(2_000_000_000),
      },
    ]);
  });

  it("withdraw", async () => {
    const withdrawalAmount = 100000;
    const poolMintInfo = await tokenPool.getMintInfo();
    const oldSupply = poolMintInfo.supply.toNumber();
    const oldSwapTokenA = await mintA.getAccountInfo(tokenAccountA);
    const oldSwapTokenB = await mintB.getAccountInfo(tokenAccountB);
    const oldPoolToken = await tokenPool.getAccountInfo(userPoolAccount);
    const expectedWithdrawA = Math.floor(
      (oldSwapTokenA.amount.toNumber() * withdrawalAmount) / oldSupply
    );
    const expectedWithdrawB = Math.floor(
      (oldSwapTokenB.amount.toNumber() * withdrawalAmount) / oldSupply
    );

    // Creating withdraw token A account
    const userAccountA = await mintA.createAccount(owner.publicKey);
    // Creating withdraw token B account
    const userAccountB = await mintB.createAccount(owner.publicKey);
    // Make sure all token accounts are created and approved
    await sleep(500);

    let txReceipt = null;
    // Withdrawing pool tokens for A and B tokens
    const txn = new Transaction().add(
      stableSwap.withdraw({
        userAuthority: owner.publicKey,
        userAccountA,
        userAccountB,
        sourceAccount: userPoolAccount,
        poolTokenAmount: new u64(withdrawalAmount),
        minimumTokenA: new u64(0), // To avoid slippage errors
        minimumTokenB: new u64(0), // To avoid spliiage errors
      })
    );
    const txSig = await sendAndConfirmTransactionWithTitle(
      "withdraw",
      connection,
      txn,
      payer,
      owner
    );
    txReceipt = await connection.getTransaction(txSig, {
      commitment: "confirmed",
    });

    let info = await mintA.getAccountInfo(userAccountA);
    expect(info.amount.toNumber()).toBe(expectedWithdrawA);
    info = await mintB.getAccountInfo(userAccountB);
    expect(info.amount.toNumber()).toBe(expectedWithdrawB);
    info = await tokenPool.getAccountInfo(userPoolAccount);
    expect(info.amount.toNumber()).toBe(
      oldPoolToken.amount.toNumber() - withdrawalAmount
    );
    const newSwapTokenA = await mintA.getAccountInfo(tokenAccountA);
    expect(newSwapTokenA.amount.toNumber()).toBe(
      oldSwapTokenA.amount.toNumber() - expectedWithdrawA
    );
    const newSwapTokenB = await mintB.getAccountInfo(tokenAccountB);
    expect(newSwapTokenB.amount.toNumber()).toBe(
      oldSwapTokenB.amount.toNumber() - expectedWithdrawB
    );

    const logMessages = parseEventLogs(txReceipt?.meta?.logMessages ?? []);
    expect(logMessages).toEqual([
      {
        type: "WithdrawA",
        tokenAAmount: new u64(expectedWithdrawA),
      },
      {
        type: "WithdrawB",
        tokenBAmount: new u64(expectedWithdrawB),
      },
      {
        type: "Burn",
        poolTokenAmount: new u64(withdrawalAmount),
      },
    ]);
  });

  it("swap A->B", async () => {
    // Swap accounts before swap
    const oldSwapTokenA = await mintA.getAccountInfo(tokenAccountA);
    const oldSwapTokenB = await mintB.getAccountInfo(tokenAccountB);
    // Amount passed to swap instruction
    const SWAP_AMOUNT_IN = 100000;
    // Creating swap token a account
    const userAccountA = await mintA.createAccount(owner.publicKey);
    await mintA.mintTo(userAccountA, owner, [], SWAP_AMOUNT_IN);
    // Creating swap token b account
    const userAccountB = await mintB.createAccount(owner.publicKey);
    // Make sure all token accounts are created and approved
    await sleep(500);

    let txReceipt = null;
    // Swapping
    const txn = new Transaction().add(
      stableSwap.swap({
        userAuthority: owner.publicKey,
        userSource: userAccountA, // User source token account            | User source -> Swap source
        poolSource: tokenAccountA, // Swap source token account
        poolDestination: tokenAccountB, // Swap destination token account | Swap dest -> User dest
        userDestination: userAccountB, // User destination token account
        amountIn: new u64(SWAP_AMOUNT_IN),
        minimumAmountOut: new u64(0), // To avoid slippage errors
      })
    );
    const txSig = await sendAndConfirmTransactionWithTitle(
      "swap",
      connection,
      txn,
      payer,
      owner
    );
    txReceipt = await connection.getTransaction(txSig, {
      commitment: "confirmed",
    });
    // Make sure swap was complete
    await sleep(500);

    let info = await mintA.getAccountInfo(userAccountA);
    expect(info.amount.toNumber()).toBe(0);
    info = await mintA.getAccountInfo(tokenAccountA);
    expect(info.amount.toNumber()).toBe(
      oldSwapTokenA.amount.toNumber() + SWAP_AMOUNT_IN
    );
    const EXPECTED_AMOUNT_OUT = 75000; // EXPECTED_AMOUNT_OUT = SWAP_AMOUNT_IN * (1 - FEES)
    info = await mintB.getAccountInfo(userAccountB);
    expect(info.amount.toNumber()).toBe(EXPECTED_AMOUNT_OUT);
    info = await mintB.getAccountInfo(tokenAccountB);
    expect(info.amount.toNumber()).toBe(
      oldSwapTokenB.amount.toNumber() - EXPECTED_AMOUNT_OUT
    );

    const logMessages = parseEventLogs(txReceipt?.meta?.logMessages);
    expect(logMessages).toEqual([
      {
        type: "SwapAToB",
        tokenAAmount: new u64(SWAP_AMOUNT_IN),
        tokenBAmount: new u64(EXPECTED_AMOUNT_OUT),
        fee: new u64(0x61a7),
      },
    ]);
  });

  it("swap B->A", async () => {
    // Swap accounts before swap
    const oldSwapTokenA = await mintA.getAccountInfo(tokenAccountA);
    const oldSwapTokenB = await mintB.getAccountInfo(tokenAccountB);
    // Amount passed to swap instruction
    const SWAP_AMOUNT_IN = 100000;
    // Creating swap token b account
    const userAccountB = await mintB.createAccount(owner.publicKey);
    await mintB.mintTo(userAccountB, owner, [], SWAP_AMOUNT_IN);
    // Creating swap token a account
    const userAccountA = await mintA.createAccount(owner.publicKey);
    // Make sure all token accounts are created and approved
    await sleep(500);

    let txReceipt = null;
    // Swapping;
    const txn = new Transaction().add(
      stableSwap.swap({
        userAuthority: owner.publicKey,
        userSource: userAccountB, // User source token account       | User source -> Swap source
        poolSource: tokenAccountB, // Swap source token account
        poolDestination: tokenAccountA, // Swap destination token account | Swap dest -> User dest
        userDestination: userAccountA, // User destination token account
        amountIn: new u64(SWAP_AMOUNT_IN),
        minimumAmountOut: new u64(0), // To avoid slippage errors
      })
    );
    const txSig = await sendAndConfirmTransactionWithTitle(
      "swap",
      connection,
      txn,
      payer,
      owner
    );
    txReceipt = await connection.getTransaction(txSig, {
      commitment: "confirmed",
    });

    // Make sure swap was complete
    await sleep(500);

    let info = await mintB.getAccountInfo(userAccountB);
    expect(info.amount.toNumber()).toBe(0);
    info = await mintB.getAccountInfo(tokenAccountB);
    expect(info.amount.toNumber()).toBe(
      oldSwapTokenB.amount.toNumber() + SWAP_AMOUNT_IN
    );
    const EXPECTED_AMOUNT_OUT = 75000; // EXPECTED_AMOUNT_OUT = SWAP_AMOUNT_IN * (1 - FEES)
    info = await mintA.getAccountInfo(userAccountA);
    expect(info.amount.toNumber()).toBe(EXPECTED_AMOUNT_OUT);
    info = await mintA.getAccountInfo(tokenAccountA);
    expect(info.amount.toNumber()).toBe(
      oldSwapTokenA.amount.toNumber() - EXPECTED_AMOUNT_OUT
    );

    const logMessages = parseEventLogs(txReceipt?.meta?.logMessages);
    expect(logMessages).toEqual([
      {
        type: "SwapBToA",
        tokenAAmount: new u64(EXPECTED_AMOUNT_OUT),
        tokenBAmount: new u64(SWAP_AMOUNT_IN),
        fee: new u64(0x61a8),
      },
    ]);
  });

  it("withdrawOne A", async () => {
    const withdrawalAmount = 100000;
    // Accounts before swap
    const oldPoolToken = await tokenPool.getAccountInfo(userPoolAccount);
    const oldSwapTokenA = await mintA.getAccountInfo(tokenAccountA);
    const oldSwapTokenB = await mintB.getAccountInfo(tokenAccountB);

    // Creating withdraw account for token a
    const userAccountA = await mintA.createAccount(owner.publicKey);
    // Make sure all token accounts are created and approved
    await sleep(500);

    let txReceipt = null;
    try {
      // Withdrawing pool tokens for token A
      const txn = new Transaction().add(
        stableSwap.withdrawOne({
          userAuthority: owner.publicKey,
          baseTokenAccount: tokenAccountA,
          destinationAccount: userAccountA,
          sourceAccount: userPoolAccount,
          poolTokenAmount: new u64(withdrawalAmount),
          minimumTokenAmount: new u64(0), // To avoid slippage errors
        })
      );
      const txSig = await sendAndConfirmTransactionWithTitle(
        "withdrawOne",
        connection,
        txn,
        payer,
        owner
      );
      txReceipt = await connection.getTransaction(txSig, {
        commitment: "confirmed",
      });
    } catch (e) {
      console.error(e);
      throw e;
    }

    const expectedWithdrawA = withdrawalAmount;
    let info = await mintA.getAccountInfo(userAccountA);
    expect(info.amount.toNumber()).toBe(expectedWithdrawA);
    info = await tokenPool.getAccountInfo(userPoolAccount);
    expect(info.amount.toNumber()).toBe(
      oldPoolToken.amount.toNumber() - withdrawalAmount
    );
    const newSwapTokenA = await mintA.getAccountInfo(tokenAccountA);
    expect(newSwapTokenA.amount.toNumber()).toBe(
      oldSwapTokenA.amount.toNumber() - expectedWithdrawA
    );
    const newSwapTokenB = await mintB.getAccountInfo(tokenAccountB);
    expect(newSwapTokenB.amount.toNumber()).toBe(
      oldSwapTokenB.amount.toNumber()
    );

    const logMessages = parseEventLogs(txReceipt?.meta?.logMessages);
    expect(logMessages).toEqual([
      {
        type: "WithdrawA",
        tokenAAmount: new u64(expectedWithdrawA),
        fee: new u64(1),
      },
      {
        type: "Burn",
        poolTokenAmount: new u64(withdrawalAmount),
      },
    ]);
  });

  it("withdrawOne B", async () => {
    const withdrawalAmount = 100000;
    // Accounts before swap
    const oldPoolToken = await tokenPool.getAccountInfo(userPoolAccount);
    const oldSwapTokenA = await mintA.getAccountInfo(tokenAccountA);
    const oldSwapTokenB = await mintB.getAccountInfo(tokenAccountB);

    // Creating withdraw account for token B
    const userAccountB = await mintB.createAccount(owner.publicKey);
    // Make sure all token accounts are created and approved
    await sleep(500);

    let txReceipt = null;
    try {
      // Withdrawing pool tokens for token B
      const txn = new Transaction().add(
        stableSwap.withdrawOne({
          userAuthority: owner.publicKey,
          baseTokenAccount: tokenAccountB,
          destinationAccount: userAccountB,
          sourceAccount: userPoolAccount,
          poolTokenAmount: new u64(withdrawalAmount),
          minimumTokenAmount: new u64(0), // To avoid slippage errors
        })
      );
      const txSig = await sendAndConfirmTransactionWithTitle(
        "withdrawOne",
        connection,
        txn,
        payer,
        owner
      );
      txReceipt = await connection.getTransaction(txSig, {
        commitment: "confirmed",
      });
    } catch (e) {
      console.error(e);
      throw e;
    }

    const expectedWithdrawB = withdrawalAmount + 1;
    let info = await mintB.getAccountInfo(userAccountB);
    expect(info.amount.toNumber()).toBe(expectedWithdrawB);
    info = await tokenPool.getAccountInfo(userPoolAccount);
    expect(info.amount.toNumber()).toBe(
      oldPoolToken.amount.toNumber() - withdrawalAmount
    );
    const newSwapTokenA = await mintA.getAccountInfo(tokenAccountA);
    expect(newSwapTokenA.amount.toNumber()).toBe(
      oldSwapTokenA.amount.toNumber()
    );
    const newSwapTokenB = await mintB.getAccountInfo(tokenAccountB);
    expect(newSwapTokenB.amount.toNumber()).toBe(
      oldSwapTokenB.amount.toNumber() - expectedWithdrawB
    );

    const logMessages = parseEventLogs(txReceipt?.meta?.logMessages);
    expect(logMessages).toEqual([
      {
        type: "WithdrawB",
        tokenBAmount: new u64(expectedWithdrawB),
        fee: new u64(1),
      },
      {
        type: "Burn",
        poolTokenAmount: new u64(withdrawalAmount),
      },
    ]);
  });
});
