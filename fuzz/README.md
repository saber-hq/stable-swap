# `stable-swap-fuzz`

Fuzz tests for the Saber StableSwap program.

## Running

If you are using a recent nightly version, use the following command:

```
RUSTFLAGS="-Znew-llvm-pass-manager=no" cargo fuzz run --dev fuzz_test
```

## Documentation

Detailed information on how to build on Saber can be found on the [Saber developer documentation website](https://docs.saber.so/docs/developing/overview).

## License

Saber StableSwap is licensed under the Apache License, Version 2.0.
