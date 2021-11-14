import type { Network, Provider } from "@saberhq/solana-contrib";
import {
  DEFAULT_NETWORK_CONFIG_MAP,
  SignerWallet,
  SolanaProvider,
} from "@saberhq/solana-contrib";
import type { TokenAccountData } from "@saberhq/token-utils";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  SPLToken,
  TOKEN_PROGRAM_ID,
  u64,
} from "@saberhq/token-utils";
import type { Signer } from "@solana/web3.js";
import {
  Account,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import base58 from "bs58";
import * as fs from "fs/promises";
import * as os from "os";
import path from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { RECOMMENDED_FEES } from "..";
import { DEFAULT_TOKEN_DECIMALS } from "../constants";
import type { ISeedPoolAccountsFn } from "../util";
import { deployNewSwap } from "../util";
import { deployTestTokens } from "../util/deployTestTokens";

const DEFAULT_AMP_FACTOR = 100;
export const DEFAULT_INITIAL_TOKEN_A_AMOUNT =
  1_000_000 * Math.pow(10, DEFAULT_TOKEN_DECIMALS);
export const DEFAULT_INITIAL_TOKEN_B_AMOUNT =
  1_000_000 * Math.pow(10, DEFAULT_TOKEN_DECIMALS);

const readKeyfile = async (path: string): Promise<Keypair> =>
  Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(await fs.readFile(path, "utf-8")))
  );

const run = async ({
  provider,
  programID,
  adminAccount,
  outfile,

  ampFactor,
  swapAccountSigner,
  poolTokenMintSigner,
  initialLiquidityProvider,
  useAssociatedAccountForInitialLP,
  tokenAMint,
  tokenBMint,
  seedPoolAccounts,

  minterPrivateKey,
}: {
  provider: Provider;
  programID: PublicKey;
  adminAccount: PublicKey;
  outfile: string;
  ampFactor: number;

  swapAccountSigner?: Signer;
  poolTokenMintSigner?: Signer;
  initialLiquidityProvider?: PublicKey;
  useAssociatedAccountForInitialLP?: boolean;
  tokenAMint: PublicKey;
  tokenBMint: PublicKey;
  seedPoolAccounts: ISeedPoolAccountsFn;
  minterPrivateKey?: string;
}) => {
  const fees = RECOMMENDED_FEES;
  const { swap: newSwap } = await deployNewSwap({
    provider,
    swapProgramID: programID,
    adminAccount,
    tokenAMint,
    tokenBMint,
    ampFactor: new u64(ampFactor),
    fees,

    swapAccountSigner,
    poolTokenMintSigner,
    initialLiquidityProvider,
    useAssociatedAccountForInitialLP,
    seedPoolAccounts,
  });

  const accounts = {
    ...(minterPrivateKey
      ? {
          MinterPrivateKey: minterPrivateKey,
        }
      : {}),

    TokenAMint: tokenAMint.toString(),
    TokenBMint: tokenBMint.toString(),
    SwapAddress: newSwap.config.swapAccount.toString(),
    ProgramID: newSwap.config.swapProgramID.toString(),
    Fees: fees,
    AdminAccount: adminAccount.toString(),
    LPTokenMint: newSwap.state.poolTokenMint.toString(),
    AdminFeeAccountA: newSwap.state.tokenA.adminFeeAccount.toString(),
    AdminFeeAccountB: newSwap.state.tokenB.adminFeeAccount.toString(),
  };

  // write the file
  const jsonRepr = JSON.stringify(accounts, null, 2);
  await fs.mkdir(path.dirname(outfile), { recursive: true });
  await fs.writeFile(outfile, jsonRepr);
  console.log("Swap deploy successful! Info:");
  console.log(jsonRepr);
  console.log(`File written to ${outfile}.`);
};

export default async (): Promise<void> => {
  await yargs(hideBin(process.argv))
    .option("cluster", {
      alias: "c",
      type: "string",
      description: "Solana Cluster",
    })
    .choices("cluster", Object.keys(DEFAULT_NETWORK_CONFIG_MAP))
    .demandOption("cluster")

    .command(
      "deploy-pool",
      "Deploys a new StableSwap pool.",
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      (y) =>
        y
          .option("admin_account", {
            type: "string",
            description: "Admin account public key.",
          })
          .demandOption("admin_account")

          .option("initial_amp_factor", {
            type: "number",
            description: "The initial amp factor to set for the pool.",
          })
          .default("initial_amp_factor", DEFAULT_AMP_FACTOR)
          .option("initial_liquidity_provider_keyfile", {
            type: "string",
            description:
              "Keyfile of the initial liquidity provider. This account should possess Token A and Token B.",
          })
          .option("initial_token_a_amount", {
            type: "number",
            description: "Initial amount of token A",
          })
          .default("initial_token_a_amount", DEFAULT_INITIAL_TOKEN_A_AMOUNT)
          .option("initial_token_b_amount", {
            type: "number",
            description: "Initial amount of token B",
          })
          .default("initial_token_b_amount", DEFAULT_INITIAL_TOKEN_B_AMOUNT)

          .option("token_a_mint", {
            type: "string",
            description: "Mint of Token A.",
          })
          .option("token_b_mint", {
            type: "string",
            description: "Mint of Token B.",
          })
          .option("deploy_test_tokens", {
            type: "boolean",
            description: "Deploys test tokens. This cannot be used on mainnet.",
          })
          .option("payer_keyfile", {
            type: "string",
            description: "Path to the JSON private key of the payer account.",
          })
          .option("request_sol_airdrop", {
            type: "boolean",
            description:
              "If specified, requests an airdrop of SOL to the payer account.",
          })

          .option("swap_account_keyfile", {
            type: "string",
            description: "Path to the JSON private key of the swap account.",
          })
          .option("pool_token_mint_keyfile", {
            type: "string",
            description:
              "Path to the JSON private key of the mint of the pool token.",
          })

          .option("program_id", {
            type: "string",
            description: "The program ID of the swap.",
          })
          .demandOption("program_id")

          .option("outfile", {
            type: "string",
            description: "Path to where the accounts file should be written.",
          }),
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      async ({
        cluster,
        admin_account,
        initial_liquidity_provider_keyfile,
        outfile: maybeOutfile,
        payer_keyfile,
        request_sol_airdrop,

        swap_account_keyfile,
        pool_token_mint_keyfile,

        initial_amp_factor,
        program_id,
        token_a_mint,
        token_b_mint,
        initial_token_a_amount,
        initial_token_b_amount,
        deploy_test_tokens,
      }): Promise<void> => {
        const swapAccountSigner = swap_account_keyfile
          ? await readKeyfile(swap_account_keyfile)
          : undefined;
        const poolTokenMintSigner = pool_token_mint_keyfile
          ? await readKeyfile(pool_token_mint_keyfile)
          : undefined;

        const outfile =
          maybeOutfile ??
          `${os.homedir()}/stableswap_deployments/${cluster}/pool-${
            swapAccountSigner?.publicKey.toString() ??
            (Math.random() * 100).toString()
          }.json`;
        if (!maybeOutfile) {
          console.warn(`--outfile not specified. Defaulting to ${outfile}`);
        }

        const payerSigner = payer_keyfile
          ? await readKeyfile(payer_keyfile)
          : Keypair.generate();

        console.log(`Deploying to cluster ${cluster}`);
        const connection = new Connection(
          DEFAULT_NETWORK_CONFIG_MAP[cluster as Network].endpoint
        );
        const provider = new SolanaProvider(
          connection,
          new SignerWallet(payerSigner)
        );

        if (!payer_keyfile) {
          if (cluster === "mainnet-beta") {
            console.error("Must specify `payer_keyfile` on mainnet.");
            return;
          }
          console.warn(
            "`payer_keyfile` not specified. Generating a new keypair."
          );
        }

        if (request_sol_airdrop || !payer_keyfile) {
          if (cluster === "mainnet-beta") {
            console.error("Cannot request an airdrop of SOL on mainnet.");
            return;
          }
          console.log(
            `Requesting an airdrop of SOL to ${payerSigner.publicKey.toString()}`
          );
          const txSig = await connection.requestAirdrop(
            payerSigner.publicKey,
            10 * LAMPORTS_PER_SOL
          );
          await connection.confirmTransaction(txSig);
        }

        // set up tokens
        let tokenAMint: PublicKey;
        let tokenBMint: PublicKey;
        let seedPoolAccounts: ISeedPoolAccountsFn | undefined = undefined;
        let minterPrivateKey: string | undefined = undefined;

        const shouldDeployTestTokens =
          deploy_test_tokens ??
          (!(token_a_mint && token_b_mint) && cluster !== "mainnet-beta");
        if (shouldDeployTestTokens && !deploy_test_tokens) {
          console.warn(
            "Token A and B mints not both specified. Defaulting to deploying test tokens."
          );
        }

        if (shouldDeployTestTokens) {
          if (token_a_mint || token_b_mint) {
            console.error(
              "Mint cannot be specified with `--deploy_test_tokens`."
            );
            return;
          }
          const testTokens = await deployTestTokens({
            provider,
            initialTokenAAmount: initial_token_a_amount,
            initialTokenBAmount: initial_token_b_amount,
          });
          tokenAMint = testTokens.mintA;
          tokenBMint = testTokens.mintB;
          seedPoolAccounts = testTokens.seedPoolAccounts;
          minterPrivateKey = base58.encode(testTokens.minterSigner.secretKey);
        } else if (!token_a_mint || !token_b_mint) {
          console.error("`--token_a_mint` and `--token_b_mint` are required.");
          return;
        } else {
          tokenAMint = new PublicKey(token_a_mint);
          tokenBMint = new PublicKey(token_b_mint);
        }

        // set up initial LP
        let initialLiquidityProvider: PublicKey | undefined;
        if (initial_liquidity_provider_keyfile) {
          const initialLiquidityProviderKP = await readKeyfile(
            initial_liquidity_provider_keyfile
          );
          initialLiquidityProvider = initialLiquidityProviderKP.publicKey;
          const [sourceAccountA, sourceAccountB] = (await Promise.all(
            ([tokenAMint, tokenBMint] as const).map(
              async (mint) =>
                await SPLToken.getAssociatedTokenAddress(
                  ASSOCIATED_TOKEN_PROGRAM_ID,
                  TOKEN_PROGRAM_ID,
                  mint,
                  initialLiquidityProviderKP.publicKey
                )
            )
          )) as [PublicKey, PublicKey];

          const [infoA, infoB] = (await Promise.all(
            [
              [tokenAMint, sourceAccountA] as const,
              [tokenBMint, sourceAccountB] as const,
            ].map(async ([mint, source]) =>
              new SPLToken(
                connection,
                mint,
                TOKEN_PROGRAM_ID,
                new Account(payerSigner.secretKey)
              ).getAccountInfo(source)
            )
          )) as [TokenAccountData, TokenAccountData];

          // check balances for seed
          if (infoA.amount.lt(new u64(initial_token_a_amount))) {
            console.error(
              `Token A balance too low for LP ${initialLiquidityProvider.toString()}`
            );
            process.exit(1);
          }
          if (infoB.amount.lt(new u64(initial_token_b_amount))) {
            console.error(
              `Token B balance too low for LP ${initialLiquidityProvider.toString()}`
            );
            process.exit(1);
          }

          // seed accounts
          seedPoolAccounts = ({ tokenAAccount, tokenBAccount }) => {
            return {
              instructions: [
                SPLToken.createTransferInstruction(
                  TOKEN_PROGRAM_ID,
                  sourceAccountA,
                  tokenAAccount,
                  initialLiquidityProviderKP.publicKey,
                  [new Account(initialLiquidityProviderKP.secretKey)],
                  initial_token_a_amount
                ),
                SPLToken.createTransferInstruction(
                  TOKEN_PROGRAM_ID,
                  sourceAccountB,
                  tokenBAccount,
                  initialLiquidityProviderKP.publicKey,
                  [new Account(initialLiquidityProviderKP.secretKey)],
                  initial_token_b_amount
                ),
              ],
              signers: [initialLiquidityProviderKP],
            };
          };
        } else if (!shouldDeployTestTokens) {
          console.error(
            "No initial LP provided, but there is also no test token deployment."
          );
          process.exit(1);
        }

        if (!seedPoolAccounts) {
          console.error("Seed pool accounts not created.");
          process.exit(1);
        }

        try {
          const programID = new PublicKey(program_id);
          console.log(
            `Deploying new swap with program ID ${programID.toString()}`
          );

          await run({
            provider,
            programID,
            adminAccount: new PublicKey(admin_account),
            outfile,

            ampFactor: initial_amp_factor,
            swapAccountSigner,
            poolTokenMintSigner,
            initialLiquidityProvider,
            useAssociatedAccountForInitialLP: true,
            tokenAMint,
            tokenBMint,
            seedPoolAccounts,
            minterPrivateKey,
          }).catch((err) => {
            console.error("Error deploying new swap.");
            console.error(err);
            process.exit(1);
          });
        } catch (e) {
          if (e instanceof Error && e.message.includes("ENOENT")) {
            console.error(
              `The program deployment info for cluster ${cluster} was not found.`,
              e
            );
          } else {
            console.error(`Could not open deployment info`, e);
          }
        }
      }
    )

    .demandCommand()
    .help().argv;
};
