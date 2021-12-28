{ pkgs }:
pkgs.buildEnv {
  name = "stableswap-env";
  paths = with pkgs; [
    solana-install
    anchor-0_19_0

    cargo-deps
    cargo-watch
    cargo-fuzz

    # sdk
    nodejs-16_x
    (yarn.override { nodejs = nodejs-16_x; })
    python3

    pkgconfig
    openssl
    jq
    libiconv
    stdenv
    # libudev

  ];
}
