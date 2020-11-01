import { PublicKey, Connection, Account, PublicKey } from "@solana/web3.js";
import { Token } from "@solana/spl-token";

declare module "@solana/spl-token" {
  export class Token2 extends Token {
    publicKey: PublicKey;
  }
}
