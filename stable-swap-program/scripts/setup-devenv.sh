#!/usr/bin/env bash

cd $(dirname $0)/../

# From the README at https://github.com/solana-labs/solana
sudo apt update
sudo apt-get install libssl-dev libudev-dev pkg-config zlib1g-dev llvm clang make

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
rustup component add rustfmt

# Install the Solana SDK
./do.sh update
