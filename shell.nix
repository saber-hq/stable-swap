with import <nixpkgs> { };
let
  rustc-solana = stdenv.mkDerivation rec {
    name = "rustc-solana";
    src = builtins.fetchTarball {
      url =
        "https://github.com/solana-labs/rust-bpf-builder/releases/download/v0.2.5/solana-rust-bpf-linux.tar.bz2";
      sha256 = "0bhj2cdzrd77yg2a46gd9s7jr32jzsvg7bijq0v214kkyjd3a3f4";
    };

    nativeBuildInputs = [ autoPatchelfHook openssl stdenv.cc.cc.lib ];

    installPhase = ''
      mkdir -p $out/lib
      cp -r $src/lib/* $out/lib

      install -m755 -D $src/bin/cargo $out/bin/cargo
      install -m755 -D $src/bin/rustc $out/bin/rustc
    '';
  };

  llvm-solana = stdenv.mkDerivation rec {
    name = "llvm-solana";
    src = builtins.fetchTarball {
      url =
        "https://github.com/solana-labs/llvm-builder/releases/download/v0.0.15/solana-llvm-linux.tar.bz2";
      sha256 = "09bfj3jg97d2xh9c036xynff0fpg648vhg4sva0sabi6rpzp2c8r";
    };

    nativeBuildInputs = [ autoPatchelfHook stdenv.cc.cc.lib ];

    installPhase = ''
      mkdir -p $out/lib
      cp -r $src/lib/* $out/lib

      install -m755 -D $src/bin/clang $out/bin/clang
      install -m755 -D $src/bin/llvm-ar $out/bin/llvm-ar
      install -m755 -D $src/bin/llvm-objcopy $out/bin/llvm-objcopy
      install -m755 -D $src/bin/ld.lld $out/bin/ld.lld
    '';
  };

  bpf-sdk = stdenv.mkDerivation {
    name = "bpf-sdk";
    src = builtins.fetchTarball {
      url = "http://solana-sdk.s3.amazonaws.com/beta/bpf-sdk.tar.bz2";
      sha256 = "0rlagli61zqqdl9d5y5ykmp5qipp0sawljyzrnsfmmx08gzp9fjn";
    };

    nativeBuildInputs = [ llvm-solana rustc-solana ];

    installPhase = ''
      install -m755 -D $src/rust/build.sh $out/bin/solana-build-rust
    '';
  };

in mkShell {
  nativeBuildInputs = [
    rustc-solana
    llvm-solana
    bpf-sdk

    rustup

    yarn
    nodejs
    docker-compose
  ];
}
