# StableSwap Program

An adaptation of the Solana [token-swap](https://github.com/solana-labs/solana-program-library/tree/master/token-swap/program) program implementing Curve's [StableSwap](https://www.curve.fi/stableswap-paper.pdf) invariant.

Click [here](https://stableswap.pro) to try it out live on the Solana testnet!

## Development

Download or update the Solana SDK by running:

```bash
./do.sh update
```

To build the program, run:

```bash
./do.sh build
```

### Vagrant environment

In the event that you are on an incompatible machine, you may use the Vagrant configuration provided.

To do this, run:

```
vagrant up
vagrant ssh

# in the vagrant box:

cd /vagrant
./scripts/setup-devenv.sh
source $HOME/.cargo/env
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
```

### Testing

Unit tests contained within the project can be built via:

```bash
./do.sh test
```

Running end-to-end tests:

```
./do.sh e2e-test
```

Run fuzz tests

```
cargo install cargo-fuzz
cargo fuzz run fuzz_test
```

### Clippy

Clippy is also supported via:

```bash
cargo clippy
```

## Deployment

To deploy, run:

```bash
# On Vagrant/build environment only
./do.sh build

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
