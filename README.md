# stable-swap

[![License](https://img.shields.io/crates/l/stable-swap-anchor)](https://github.com/saber-hq/stable-swap/blob/master/LICENSE)
[![Build Status](https://img.shields.io/github/workflow/status/saber-hq/stable-swap/Program/master)](https://github.com/saber-hq/stable-swap/actions/workflows/program.yml?query=branch%3Amaster)
[![Contributors](https://img.shields.io/github/contributors/saber-hq/stable-swap)](https://github.com/saber-hq/stable-swap/graphs/contributors)

<div align="center">
    <img src="/assets/banner.png" />
</div>

<div align="center">
    An automated market maker for mean-reverting trading pairs.
</div>

## Documentation

Detailed information on how to build on Saber can be found on the [Saber developer documentation website](https://docs.saber.so/docs/developing/overview).

Automatically generated documentation for Rust Crates is available below.

## Rust Crates

| Package              | Description                                                                          | Version                                                                                                         | Docs                                                                                           |
| :------------------- | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------- |
| `stable-swap`        | Saber StableSwap program.                                                            | [![crates](https://img.shields.io/crates/v/stable-swap)](https://crates.io/crates/stable-swap)                  | [![Docs.rs](https://docs.rs/stable-swap/badge.svg)](https://docs.rs/stable-swap)               |
| `stable-swap-anchor` | Anchor bindings for the StableSwap Rust client.                                      | [![Crates.io](https://img.shields.io/crates/v/stable-swap-anchor)](https://crates.io/crates/stable-swap-anchor) | [![Docs.rs](https://docs.rs/stable-swap-anchor/badge.svg)](https://docs.rs/stable-swap-anchor) |
| `stable-swap-client` | StableSwap Rust client.                                                              | [![crates](https://img.shields.io/crates/v/stable-swap-client)](https://crates.io/crates/stable-swap-client)    | [![Docs.rs](https://docs.rs/stable-swap-client/badge.svg)](https://docs.rs/stable-swap-client) |
| `stable-swap-fuzz`   | Fuzz tests for the Saber StableSwap program.                                         | [![crates](https://img.shields.io/crates/v/stable-swap-fuzz)](https://crates.io/crates/stable-swap-fuzz)        | [![Docs.rs](https://docs.rs/stable-swap-fuzz/badge.svg)](https://docs.rs/stable-swap-fuzz)     |
| `stable-swap-math`   | Calculations for the StableSwap invariant                                            | [![crates](https://img.shields.io/crates/v/stable-swap-math)](https://crates.io/crates/stable-swap-math)        | [![Docs.rs](https://docs.rs/stable-swap-math/badge.svg)](https://docs.rs/stable-swap-math)     |
| `stable-swap-sim`    | Simulations of the StableSwap invariant compared to Curve's reference implementation | [![crates](https://img.shields.io/crates/v/stable-swap-sim)](https://crates.io/crates/stable-swap-sim)          | [![Docs.rs](https://docs.rs/stable-swap-sim/badge.svg)](https://docs.rs/stable-swap-sim)       |

## JavaScript/Web3.js

To use StableSwap with your frontend or Node.js project, use [the JavaScript SDK.](https://github.com/saber-hq/saber-common/tree/master/packages/stableswap-sdk)

## Audit

Saber's [stable-swap-program](https://github.com/saber-hq/stable-swap/tree/master/stable-swap-program) has been audited by [Bramah Systems](https://www.bramah.systems/). View the audit report [here](https://github.com/saber-hq/stable-swap/blob/master/audit/bramah-systems.pdf).

## Developing

### Tests

To run the tests, run:

```
./stable-swap-program/do.sh e2e-test
```

## Archive

The original Saber StableSwap program can be found on the [archive branch](https://github.com/saber-hq/stable-swap/tree/archive).

## License

Saber StableSwap is licensed under the Apache License, Version 2.0.
