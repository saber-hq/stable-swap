import assert from 'assert';
import * as BufferLayout from 'buffer-layout';
import BN from 'bn.js';

/**
 * Layout for a public key
 */
export const publicKey = (property: string = 'publicKey'): object => {
  return BufferLayout.blob(32, property);
};

/**
 * Layout for a 64bit unsigned value
 */
export const uint64 = (property: string = 'uint64'): object => {
  return BufferLayout.blob(8, property);
};

/**
 * Layout for a Rust String type
 */
export const rustString = (property: string = 'string'): object => {
  const rsl = BufferLayout.struct(
    [
      BufferLayout.u32('length'),
      BufferLayout.u32('lengthPadding'),
      BufferLayout.blob(BufferLayout.offset(BufferLayout.u32(), -8), 'chars'),
    ],
    property,
  );
  const _decode = rsl.decode.bind(rsl);
  const _encode = rsl.encode.bind(rsl);

  rsl.decode = (buffer: typeof Buffer, offset: number) => {
    const data = _decode(buffer, offset);
    return data.chars.toString('utf8');
  };

  rsl.encode = (str: string, buffer: typeof Buffer, offset: number) => {
    const data = {
      chars: Buffer.from(str, 'utf8'),
    };
    return _encode(data, buffer, offset);
  };

  return rsl;
};

/**
 * Some amount of tokens
 */
export class Numberu64 extends BN {
    constructor(n: number | Numberu64) {
      super(n);
    }

    /**
     * Convert to Buffer representation
     */
    toBuffer(): Buffer {
      const a = super.toArray().reverse();
      const b = Buffer.from(a);
      if (b.length === 8) {
        return b;
      }
      assert(b.length < 8, 'Numberu64 too large');

      const zeroPad = Buffer.alloc(8);
      b.copy(zeroPad);
      return zeroPad;
    }

    /**
     * Construct a Numberu64 from Buffer representation
     */
    static fromBuffer(buffer: Buffer): Numberu64 {
      assert(buffer.length === 8, `Invalid buffer length: ${buffer.length}`);
      return new BN(
        [...buffer]
          .reverse()
          .map(i => `00${i.toString(16)}`.slice(-2))
          .join(''),
        16,
      );
    }
  }
