import type { Token } from "@saberhq/token-utils";
import {
  deserializeAccount,
  deserializeMint,
  parseBigintIsh,
  TokenAmount,
} from "@saberhq/token-utils";
import type { Connection, PublicKey } from "@solana/web3.js";
import type JSBI from "jsbi";

import type { StableSwap } from "../stable-swap";
import type { Fees } from "../state/fees";
import { loadProgramAccount } from "../util/account";

/**
 * Reserve information.
 */
export interface IReserve {
  /**
   * Swap account holding the reserve tokens
   */
  reserveAccount: PublicKey;
  /**
   * Destination account of admin fees of this reserve token
   */
  adminFeeAccount: PublicKey;
  /**
   * Amount of tokens in the reserve
   */
  amount: TokenAmount;
}

/**
 * Static definition of an exchange.
 */
export interface IExchange {
  programID: PublicKey;
  swapAccount: PublicKey;
  lpToken: Token;
  tokens: readonly [Token, Token];
}

/**
 * Info loaded from the exchange. This is used by the calculator.
 */
export interface IExchangeInfo {
  ampFactor: JSBI;
  fees: Fees;
  lpTotalSupply: TokenAmount;
  reserves: readonly [IReserve, IReserve];
}

/**
 * Creates an IExchangeInfo from parameters.
 * @returns
 */
export const makeExchangeInfo = ({
  exchange,
  swap,
  accounts,
}: {
  exchange: IExchange;
  swap: StableSwap;
  accounts: {
    reserveA: Buffer;
    reserveB: Buffer;
    poolMint?: Buffer;
  };
}): IExchangeInfo => {
  const swapAmountA = deserializeAccount(
    swap.state.tokenA.reserve,
    accounts.reserveA
  ).amount;
  const swapAmountB = deserializeAccount(
    swap.state.tokenA.reserve,
    accounts.reserveB
  ).amount;

  const poolMintSupply = accounts.poolMint
    ? deserializeMint(accounts.poolMint).supply
    : undefined;

  return {
    // TODO(igm): this should be calculated dynamically
    ampFactor: parseBigintIsh(swap.state.targetAmpFactor.toString()),
    fees: swap.state.fees,
    lpTotalSupply: new TokenAmount(exchange.lpToken, poolMintSupply ?? 0),
    reserves: [
      {
        reserveAccount: swap.state.tokenA.reserve,
        adminFeeAccount: swap.state.tokenA.adminFeeAccount,
        amount: new TokenAmount(exchange.tokens[0], swapAmountA),
      },
      {
        reserveAccount: swap.state.tokenB.reserve,
        adminFeeAccount: swap.state.tokenB.adminFeeAccount,
        amount: new TokenAmount(exchange.tokens[1], swapAmountB),
      },
    ],
  };
};

/**
 * Loads exchange info.
 * @param exchange
 * @param swap
 * @returns
 */
export const loadExchangeInfo = async (
  connection: Connection,
  exchange: IExchange,
  swap: StableSwap
): Promise<IExchangeInfo> => {
  if (!exchange.programID.equals(swap.config.swapProgramID)) {
    throw new Error("Swap program id mismatch");
  }

  let reserveA;
  let reserveB;
  let poolMint;
  try {
    reserveA = await loadProgramAccount(
      connection,
      swap.state.tokenA.reserve,
      swap.config.tokenProgramID
    );
    reserveB = await loadProgramAccount(
      connection,
      swap.state.tokenB.reserve,
      swap.config.tokenProgramID
    );
    poolMint = await loadProgramAccount(
      connection,
      swap.state.poolTokenMint,
      swap.config.tokenProgramID
    );
  } catch (e) {
    throw new Error(e);
  }
  return makeExchangeInfo({
    swap,
    exchange,
    accounts: {
      reserveA,
      reserveB,
      poolMint,
    },
  });
};
