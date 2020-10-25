import * as BufferLayout from "buffer-layout";

/**
 * Layout for a public key
 */
export const publicKey = (property: string = "publicKey"): object => {
  return BufferLayout.blob(32, property);
};
