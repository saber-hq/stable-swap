export type Fees = {
  adminTradeFeeNumerator: number;
  adminTradeFeeDenominator: number;
  adminWithdrawFeeNumerator: number;
  adminWithdrawFeeDenominator: number;
  tradeFeeNumerator: number;
  tradeFeeDenominator: number;
  withdrawFeeNumerator: number;
  withdrawFeeDenominator: number;
};

export const DEFAULT_FEE_NUMERATOR = 0;
export const DEFAULT_FEE_DENOMINATOR = 1000;
export const DEFAULT_FEES: Fees = {
  adminTradeFeeNumerator: DEFAULT_FEE_NUMERATOR,
  adminTradeFeeDenominator: DEFAULT_FEE_DENOMINATOR,
  adminWithdrawFeeNumerator: DEFAULT_FEE_NUMERATOR,
  adminWithdrawFeeDenominator: DEFAULT_FEE_DENOMINATOR,
  tradeFeeNumerator: DEFAULT_FEE_NUMERATOR,
  tradeFeeDenominator: DEFAULT_FEE_DENOMINATOR,
  withdrawFeeNumerator: DEFAULT_FEE_NUMERATOR,
  withdrawFeeDenominator: DEFAULT_FEE_DENOMINATOR,
};
