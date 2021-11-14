{ pkgs }:
pkgs.buildEnv {
  name = "stableswap-env";
  paths = with pkgs;
    (pkgs.lib.optionals pkgs.stdenv.isLinux (with stableswap;
      [
        # solana
        # anchor 
        # spl-token-cli
      ])) ++ [
        cargo-deps
        cargo-watch

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

        # vagrant
      ];
}
