declare module "buffer-layout" {
  declare const blob: (amt: number, property: string) => Layout;
  declare const u8: (property: string) => Layout;
  declare const ns64: (property: string) => Layout;

  declare type Layout<T = unknown> = {
    span: number;
    decode: (data: Buffer) => T;
    encode: (data: T, out: Buffer) => number;
  };

  declare function struct<T>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    layouts: Layout<any>[],
    property?: string
  ): Layout<T>;
}
