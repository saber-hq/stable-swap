import type { Provider } from "@saberhq/solana-contrib";
import type { ISeedPoolAccountsFn } from "@saberhq/stableswap-sdk";
import { DEFAULT_TOKEN_DECIMALS } from "@saberhq/stableswap-sdk";
import {
  createInitMintInstructions,
  SPLToken,
  TOKEN_PROGRAM_ID,
} from "@saberhq/token-utils";
import type { PublicKey, Signer, TransactionSignature } from "@solana/web3.js";
import { Account, Keypair } from "@solana/web3.js";

import {
  DEFAULT_INITIAL_TOKEN_A_AMOUNT,
  DEFAULT_INITIAL_TOKEN_B_AMOUNT,
} from "../src/cli";

/**
 * Creates a new token mint
 * @returns
 */
const createMint = async ({
  provider,
  mintAuthority,
  freezeAuthority,
  name,
  decimals,
}: {
  name: string;
  provider: Provider;
  mintAuthority: PublicKey;
  freezeAuthority?: PublicKey;
  decimals: number;
}): Promise<{ mint: PublicKey; txSig: TransactionSignature }> => {
  const mintSigner = Keypair.generate();
  const tx = await createInitMintInstructions({
    provider,
    mintKP: mintSigner,
    mintAuthority,
    freezeAuthority,
    decimals,
  });
  console.log(`Create Mint ${name}`);
  const txSig = (await tx.confirm()).signature;
  return { mint: mintSigner.publicKey, txSig };
};

export const deployTestTokens = async ({
  provider,
  minterSigner = Keypair.generate(),
  initialTokenAAmount = DEFAULT_INITIAL_TOKEN_A_AMOUNT,
  initialTokenBAmount = DEFAULT_INITIAL_TOKEN_B_AMOUNT,
}: {
  provider: Provider;
  minterSigner?: Signer;
  initialTokenAAmount?: number;
  initialTokenBAmount?: number;
}): Promise<{
  minterSigner: Signer;
  mintA: PublicKey;
  mintB: PublicKey;
  seedPoolAccounts: ISeedPoolAccountsFn;
}> => {
  console.log("Deploying test tokens.");
  const [mintA, mintB] = (await Promise.all(
    ["Token A", "Token B"].map(async (tokenName) => {
      return (
        await createMint({
          provider,
          mintAuthority: minterSigner.publicKey,
          name: tokenName,
          decimals: DEFAULT_TOKEN_DECIMALS,
        })
      ).mint;
    })
  )) as [PublicKey, PublicKey];

  // seed the pool accounts with mints
  const seedPoolAccounts: ISeedPoolAccountsFn = ({
    tokenAAccount,
    tokenBAccount,
  }) => ({
    instructions: [
      SPLToken.createMintToInstruction(
        TOKEN_PROGRAM_ID,
        mintA,
        tokenAAccount,
        minterSigner.publicKey,
        [new Account(minterSigner.secretKey)],
        initialTokenAAmount
      ),
      SPLToken.createMintToInstruction(
        TOKEN_PROGRAM_ID,
        mintB,
        tokenBAccount,
        minterSigner.publicKey,
        [new Account(minterSigner.secretKey)],
        initialTokenBAmount
      ),
    ],
    signers: [minterSigner],
  });

  return { minterSigner, mintA, mintB, seedPoolAccounts };
};
