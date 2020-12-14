import * as BufferLayout from "buffer-layout";

/**
 * Layout for a public key
 */
export const PublicKeyLayout = (property: string = "publicKey"): object => {
  return BufferLayout.blob(32, property);
};

/**
 * Layout for a 64bit unsigned value
 */
export const Uint64Layout = (property: string = "uint64"): object => {
  return BufferLayout.blob(8, property);
};

/**
 * Layout for stable swap state
 */
export const StableSwapLayout: typeof BufferLayout.Structure = BufferLayout.struct(
  [
    BufferLayout.u8("isInitialized"),
    BufferLayout.u8("isPaused"),
    BufferLayout.u8("nonce"),
    BufferLayout.nu64("initialAmpFactor"),
    BufferLayout.nu64("targetAmpFactor"),
    BufferLayout.ns64("startRampTs"),
    BufferLayout.ns64("stopRampTs"),
    BufferLayout.ns64("futureAdminDeadline"),
    PublicKeyLayout("futureAdminAccount"),
    PublicKeyLayout("adminAccount"),
    PublicKeyLayout("tokenAccountA"),
    PublicKeyLayout("tokenAccountB"),
    PublicKeyLayout("tokenPool"),
    PublicKeyLayout("mintA"),
    PublicKeyLayout("mintB"),
    PublicKeyLayout("adminFeeAccountA"),
    PublicKeyLayout("adminFeeAccountB"),
    BufferLayout.nu64("adminTradeFeeNumerator"),
    BufferLayout.nu64("adminTradeFeeDenominator"),
    BufferLayout.nu64("adminWithdrawFeeNumerator"),
    BufferLayout.nu64("adminWithdrawFeeDenominator"),
    BufferLayout.nu64("tradeFeeNumerator"),
    BufferLayout.nu64("tradeFeeDenominator"),
    BufferLayout.nu64("withdrawFeeNumerator"),
    BufferLayout.nu64("withdrawFeeDenominator"),
  ]
);
