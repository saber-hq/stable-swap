# StableSwap Program

An adaptation of the Solana [token-swap](https://github.com/solana-labs/solana-program-library/tree/master/token-swap/program) program implementing Curve's [StableSwap](https://www.curve.fi/stableswap-paper.pdf) invariant.

Click [here](https://stableswap.pro) to try it out live on the Solana testnet!

## Development

_We recommend using the included Nix flake to develop within this repo._

Download or update the Solana SDK by running:

```bash
solana-install init 1.8.11
```

To build the program, run:

```bash
anchor build --program-name stable_swap
```

### Testing

Run the unit tests contained within the project via:

```bash
./do.sh test
```

Running end-to-end tests:

```
./do.sh e2e-test
```

[View instructions for running fuzz tests here.](../fuzz)

### Clippy

Run the [Clippy linter](https://github.com/rust-lang/rust-clippy) via:

```bash
cargo clippy
```

## Deployment

To deploy, run:

```bash
# On Vagrant/build environment only
anchor build --program-name stable_swap

# On your machine
./scripts/deploy-program.sh <cluster>
./scripts/deploy-test-pools.sh <cluster>

# If mainnet
./scripts/deploy-mainnet-pools.sh <cluster>
```

### Upgrades

To upgrade the program, run:

```
# Write the buffer. This returns the buffer address.
solana program write-buffer ./target/deploy/stable_swap.so

# Change the buffer authority to the same address as the upgrade authority. (Ledger)
solana program set-buffer-authority $BUFFER_ADDR --new-buffer-authority $UPGRADE_AUTHORITY

# Swap out the program for the new buffer.
solana program deploy --buffer $BUFFER_ADDR --program-id $PROGRAM_ID --keypair $UPGRADE_AUTHORITY_KEYPAIR
```

## TODO

- [ ] Generalize swap pool to support `n` tokens
- [ ] Implement [`remove_liquidity_imbalance`](https://github.com/curvefi/curve-contract/blob/4aa3832a4871b1c5b74af7f130c5b32bdf703af5/contracts/pool-templates/base/SwapTemplateBase.vy#L539)

## Documentation

Detailed information on how to build on Saber can be found on the [Saber developer documentation website](https://docs.saber.so/docs/developing/overview).

## License

Saber StableSwap is licensed under the Apache License, Version 2.0.
