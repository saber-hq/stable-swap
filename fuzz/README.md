# `stable-swap-fuzz`

Fuzz tests for the Saber StableSwap program.

## Running

If you are using a recent nightly version, use the following command:

```
RUSTFLAGS="-Znew-llvm-pass-manager=no" cargo fuzz run --dev fuzz_test
```
