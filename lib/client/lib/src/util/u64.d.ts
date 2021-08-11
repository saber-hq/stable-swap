/// <reference types="node" />
import BN from "bn.js";
/**
 * Some amount of tokens
 */
export declare class NumberU64 extends BN {
  constructor(n: number | NumberU64);
  /**
   * Convert to Buffer representation
   */
  toBuffer(): Buffer;
  /**
   * Construct a Numberu64 from Buffer representation
   */
  static fromBuffer(buffer: Buffer): NumberU64;
}
//# sourceMappingURL=u64.d.ts.map
