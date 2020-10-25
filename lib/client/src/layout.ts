import * as BufferLayout from "buffer-layout";

/**
 * Layout for a public key
 */
export const PublicKeyLayout = (property: string = "publicKey"): object => {
  return BufferLayout.blob(32, property);
};

/**
 * Layout for stable swap state
 */
export const StableSwapLayout: typeof BufferLayout.Structure = BufferLayout.struct(
  [
    BufferLayout.u8("isInitialized"),
    BufferLayout.u8("nonce"),
    PublicKeyLayout("tokenProgramId"),
    PublicKeyLayout("tokenAccountA"),
    PublicKeyLayout("tokenAccountB"),
    PublicKeyLayout("tokenPool"),
    PublicKeyLayout("mintA"),
    PublicKeyLayout("mintB"),
    BufferLayout.nu64("ampFactor"),
    BufferLayout.nu64("feeNumerator"),
    BufferLayout.nu64("feeDenominator"),
  ]
);
