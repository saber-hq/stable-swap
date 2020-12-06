#!/usr/bin/env bash

cd bin/bpf-sdk/dependencies/

rm rust-bpf-linux/bin/rustc
ln -s $(which rustc) rust-bpf-linux/bin/rustc

rm rust-bpf-linux/bin/cargo
ln -s $(which cargo) rust-bpf-linux/bin/cargo

rm llvm-native/bin/clang
ln -s $(which clang) llvm-native/bin/clang

rm llvm-native/bin/llvm-ar
ln -s $(which llvm-ar) llvm-native/bin/llvm-ar

rm llvm-native/bin/llvm-objcopy
ln -s $(which llvm-objcopy) llvm-native/bin/llvm-objcopy

rm -f llvm-native/bin/ld.lld
ln -s $(which ld.lld) llvm-native/bin/ld.lld
