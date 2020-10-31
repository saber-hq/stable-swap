import { PublicKey } from "@solana/web3.js";
import { Token as OrigToken } from "@solana/spl-token";

declare module "@solana/spl-token" {
  export class Token extends OrigToken {
    publicKey: PublicKey;
  }
}
