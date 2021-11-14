import { Percent, u64 } from "@saberhq/token-utils";

import type { RawFees } from "./layout";

export type Fees = {
  trade: Percent;
  withdraw: Percent;
  adminTrade: Percent;
  adminWithdraw: Percent;
};

export const DEFAULT_FEE = new Percent(0, 10000);

export const ZERO_FEES: Fees = {
  /**
   * Fee per trade
   */
  trade: DEFAULT_FEE,
  withdraw: DEFAULT_FEE,
  adminTrade: DEFAULT_FEE,
  adminWithdraw: DEFAULT_FEE,
};

const recommendedFeesRaw = {
  adminTradeFeeNumerator: 50,
  adminTradeFeeDenominator: 100,
  adminWithdrawFeeNumerator: 50,
  adminWithdrawFeeDenominator: 100,
  tradeFeeNumerator: 20,
  tradeFeeDenominator: 10000,
  withdrawFeeNumerator: 50,
  withdrawFeeDenominator: 10000,
};

export const RECOMMENDED_FEES: Fees = {
  trade: new Percent(
    recommendedFeesRaw.tradeFeeNumerator,
    recommendedFeesRaw.tradeFeeDenominator
  ),
  withdraw: new Percent(
    recommendedFeesRaw.withdrawFeeNumerator,
    recommendedFeesRaw.withdrawFeeDenominator
  ),
  adminTrade: new Percent(
    recommendedFeesRaw.adminTradeFeeNumerator,
    recommendedFeesRaw.adminTradeFeeDenominator
  ),
  adminWithdraw: new Percent(
    recommendedFeesRaw.adminWithdrawFeeNumerator,
    recommendedFeesRaw.adminWithdrawFeeDenominator
  ),
};

export const encodeFees = (fees: Fees): RawFees => ({
  adminTradeFeeNumerator: new u64(
    fees.adminTrade.numerator.toString()
  ).toBuffer(),
  adminTradeFeeDenominator: new u64(
    fees.adminTrade.denominator.toString()
  ).toBuffer(),
  adminWithdrawFeeNumerator: new u64(
    fees.adminWithdraw.numerator.toString()
  ).toBuffer(),
  adminWithdrawFeeDenominator: new u64(
    fees.adminWithdraw.denominator.toString()
  ).toBuffer(),
  tradeFeeNumerator: new u64(fees.trade.numerator.toString()).toBuffer(),
  tradeFeeDenominator: new u64(fees.trade.denominator.toString()).toBuffer(),
  withdrawFeeNumerator: new u64(fees.withdraw.numerator.toString()).toBuffer(),
  withdrawFeeDenominator: new u64(
    fees.withdraw.denominator.toString()
  ).toBuffer(),
});

export const decodeFees = (raw: RawFees): Fees => ({
  adminTrade: new Percent(
    u64.fromBuffer(raw.adminTradeFeeNumerator).toString(),
    u64.fromBuffer(raw.adminTradeFeeDenominator).toString()
  ),
  adminWithdraw: new Percent(
    u64.fromBuffer(raw.adminWithdrawFeeNumerator).toString(),
    u64.fromBuffer(raw.adminWithdrawFeeDenominator).toString()
  ),
  trade: new Percent(
    u64.fromBuffer(raw.tradeFeeNumerator).toString(),
    u64.fromBuffer(raw.tradeFeeDenominator).toString()
  ),
  withdraw: new Percent(
    u64.fromBuffer(raw.withdrawFeeNumerator).toString(),
    u64.fromBuffer(raw.withdrawFeeDenominator).toString()
  ),
});
