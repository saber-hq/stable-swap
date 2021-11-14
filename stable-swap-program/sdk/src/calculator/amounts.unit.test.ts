import type { BigintIsh } from "@saberhq/token-utils";
import { Percent, Token as SToken, TokenAmount } from "@saberhq/token-utils";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import JSBI from "jsbi";
import mapValues from "lodash.mapvalues";

import { SWAP_PROGRAM_ID } from "../constants";
import type { IExchangeInfo } from "../entities/exchange";
import { RECOMMENDED_FEES, ZERO_FEES } from "../state/fees";
import {
  calculateEstimatedMintAmount,
  calculateEstimatedSwapOutputAmount,
  calculateEstimatedWithdrawAmount,
  calculateEstimatedWithdrawOneAmount,
  calculateVirtualPrice,
} from "./amounts";

const exchange = {
  swapAccount: new PublicKey("YAkoNb6HKmSxQN9L8hiBE5tPJRsniSSMzND1boHmZxe"),
  programID: SWAP_PROGRAM_ID,
  lpToken: new SToken({
    symbol: "LP",
    name: "StableSwap LP",
    address: "2poo1w1DL6yd2WNTCnNTzDqkC6MBXq7axo77P16yrBuf",
    decimals: 6,
    chainId: 100,
  }),
  tokens: [
    new SToken({
      symbol: "TOKA",
      name: "Token A",
      address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      decimals: 6,
      chainId: 100,
    }),
    new SToken({
      symbol: "TOKB",
      name: "Token B",
      address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
      decimals: 6,
      chainId: 100,
    }),
  ],
} as const;

const makeExchangeInfo = (
  {
    lpTotalSupply = JSBI.BigInt(200_000_000),
    tokenAAmount = JSBI.BigInt(100_000_000),
    tokenBAmount = JSBI.BigInt(100_000_000),
  }: {
    lpTotalSupply?: JSBI;
    tokenAAmount?: JSBI;
    tokenBAmount?: JSBI;
  } = {
    lpTotalSupply: JSBI.BigInt(200_000_000),
    tokenAAmount: JSBI.BigInt(100_000_000),
    tokenBAmount: JSBI.BigInt(100_000_000),
  }
): IExchangeInfo => ({
  ampFactor: JSBI.BigInt(100),
  fees: ZERO_FEES,
  lpTotalSupply: new TokenAmount(exchange.lpToken, lpTotalSupply),
  reserves: [
    {
      reserveAccount: new PublicKey(
        "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"
      ),
      adminFeeAccount: new PublicKey(
        "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"
      ),
      amount: new TokenAmount(exchange.tokens[0], tokenAAmount),
    },
    {
      reserveAccount: new PublicKey(
        "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"
      ),
      adminFeeAccount: new PublicKey(
        "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"
      ),
      amount: new TokenAmount(exchange.tokens[1], tokenBAmount),
    },
  ],
});

const exchangeInfo = makeExchangeInfo();

const exchangeInfoWithFees = {
  ...exchangeInfo,
  fees: RECOMMENDED_FEES,
} as const;

const assertTokenAmounts = (actual: TokenAmount, expected: TokenAmount) => {
  expect(actual.equalTo(expected) && actual.token.equals(expected.token)).toBe(
    true
  );
};

const assertTokenAmount = (actual: TokenAmount, expected: BigintIsh) => {
  expect(actual.raw.toString()).toEqual(expected.toString());
};

describe("Calculated amounts", () => {
  describe("#calculateVirtualPrice", () => {
    it("works", () => {
      const result = calculateVirtualPrice(exchangeInfo);
      expect(result?.toFixed(4)).toBe("1.0000");
    });

    it("is symmetric", () => {
      const result = calculateVirtualPrice(
        makeExchangeInfo({
          lpTotalSupply: JSBI.BigInt(200_000_000),
          tokenAAmount: JSBI.BigInt(10_000_000),
          tokenBAmount: JSBI.BigInt(190_000_000),
        })
      );
      expect(result?.toFixed(4)).toBe("0.9801");

      const result2 = calculateVirtualPrice(
        makeExchangeInfo({
          lpTotalSupply: JSBI.BigInt(200_000_000),
          tokenAAmount: JSBI.BigInt(190_000_000),
          tokenBAmount: JSBI.BigInt(10_000_000),
        })
      );
      expect(result2?.toFixed(4)).toBe("0.9801");
    });

    it("can quote both prices", () => {
      const exchange = makeExchangeInfo({
        lpTotalSupply: JSBI.BigInt(200_000_000),
        tokenAAmount: JSBI.BigInt(10_000_000),
        tokenBAmount: JSBI.BigInt(190_000_000),
      });

      const result = calculateVirtualPrice(exchange);
      expect(result?.toFixed(4)).toBe("0.9801");
    });
  });

  describe("#calculateEstimatedSwapOutputAmount", () => {
    it("no fees", () => {
      const result = calculateEstimatedSwapOutputAmount(
        exchangeInfo,
        new TokenAmount(exchange.tokens[0], JSBI.BigInt(10_000_000))
      );

      assertTokenAmounts(result.outputAmount, result.outputAmountBeforeFees);
    });

    it("fees are different", () => {
      const result = calculateEstimatedSwapOutputAmount(
        {
          ...exchangeInfoWithFees,
          fees: {
            ...exchangeInfoWithFees.fees,
            trade: new Percent(50, 100),
          },
        },
        new TokenAmount(exchange.tokens[0], JSBI.BigInt(100))
      );

      // 50 percent fee
      assertTokenAmount(result.outputAmountBeforeFees, JSBI.BigInt(100));
      assertTokenAmount(result.outputAmount, JSBI.BigInt(50));
    });
  });

  describe("#calculateEstimatedMintAmount", () => {
    it("no fees if equal liquidity provision", () => {
      const result = calculateEstimatedMintAmount(
        {
          ...exchangeInfo,
          fees: {
            ...ZERO_FEES,
            trade: new Percent(50, 100),
          },
        },
        JSBI.BigInt(100),
        JSBI.BigInt(100)
      );

      assertTokenAmounts(result.mintAmount, result.mintAmountBeforeFees);
    });

    it("fees if unequal liquidity provision", () => {
      const result = calculateEstimatedMintAmount(
        {
          ...exchangeInfo,
          fees: {
            ...ZERO_FEES,
            trade: new Percent(50, 100),
          },
        },
        JSBI.BigInt(100_000),
        JSBI.BigInt(0)
      );

      assertTokenAmount(result.mintAmountBeforeFees, new BN(99_999));
      // 3/4 because only half of the swapped amount (100 tokens) should have fees on it (so 1/4)
      const expectedMintAmount = JSBI.divide(
        JSBI.multiply(result.mintAmountBeforeFees.raw, JSBI.BigInt(3)),
        JSBI.BigInt(4)
      );
      assertTokenAmount(result.mintAmount, expectedMintAmount);

      assertTokenAmount(
        result.fees,
        JSBI.subtract(result.mintAmountBeforeFees.raw, expectedMintAmount)
      );
    });
  });

  describe("#calculateEstimatedWithdrawAmount", () => {
    it("works", () => {
      calculateEstimatedWithdrawAmount({
        ...exchangeInfo,
        poolTokenAmount: new TokenAmount(exchange.lpToken, 100_000),
      });
    });

    it("works with fees", () => {
      calculateEstimatedWithdrawAmount({
        ...exchangeInfoWithFees,
        poolTokenAmount: new TokenAmount(exchange.lpToken, 100_000),
      });
    });

    it("works zero with fees", () => {
      calculateEstimatedWithdrawAmount({
        ...exchangeInfoWithFees,
        poolTokenAmount: new TokenAmount(exchange.lpToken, 0),
      });
    });
  });

  describe("#calculateEstimatedWithdrawOneAmount", () => {
    it("works", () => {
      calculateEstimatedWithdrawOneAmount({
        exchange: exchangeInfo,
        poolTokenAmount: new TokenAmount(exchange.lpToken, 100_000),
        withdrawToken: exchange.tokens[0],
      });
    });

    it("works with fees", () => {
      const result = calculateEstimatedWithdrawOneAmount({
        exchange: exchangeInfoWithFees,
        poolTokenAmount: new TokenAmount(exchange.lpToken, 100_000),
        withdrawToken: exchange.tokens[0],
      });

      const resultMapped = mapValues(result, (q) => q.raw.toString());
      expect(resultMapped).toEqual({
        withdrawAmount: "99301",
        withdrawAmountBeforeFees: "99900",
        swapFee: "100",
        withdrawFee: "500",
        lpSwapFee: "50",
        lpWithdrawFee: "250",
        adminSwapFee: "50",
        adminWithdrawFee: "250",
      });
    });

    it("works zero with fees", () => {
      const result = calculateEstimatedWithdrawOneAmount({
        exchange: exchangeInfoWithFees,
        poolTokenAmount: new TokenAmount(exchange.lpToken, 0),
        withdrawToken: exchange.tokens[0],
      });

      const resultMapped = mapValues(result, (q) => q.raw.toString());
      expect(resultMapped).toEqual({
        withdrawAmount: "0",
        withdrawAmountBeforeFees: "0",
        swapFee: "0",
        withdrawFee: "0",
        lpSwapFee: "0",
        lpWithdrawFee: "0",
        adminSwapFee: "0",
        adminWithdrawFee: "0",
      });
    });
  });
});
