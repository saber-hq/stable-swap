# StableSwap Program

An adaptation of the Solana [token-swap](https://github.com/solana-labs/solana-program-library/tree/master/token-swap/program) program implementing Curve's [StableSwap](https://www.curve.fi/stableswap-paper.pdf) invariant.

## Development

Download or update the BPF-SDK by running:

```bash
$ ./do.sh update
```

To build the program, run:

```bash
$ ./do.sh build
```

### Testing

Unit tests contained within the project can be built via:

```bash
$ ./do.sh test
```

Running end-to-end tests:

```
$ ./do.sh e2e-test
```

### Clippy

Clippy is also supported via:

```bash
$ ./do.sh clippy
```

### Deployment

To deploy the program, run:
```bash
$ ./do.sh deploy <network>
```

## TODO

- [ ] Implement [`get_virtual_price`](https://github.com/curvefi/curve-contract/blob/4aa3832a4871b1c5b74af7f130c5b32bdf703af5/contracts/pool-templates/base/SwapTemplateBase.vy#L241)
- [ ] Implement [`remove_liquidity_imbalance`](https://github.com/curvefi/curve-contract/blob/4aa3832a4871b1c5b74af7f130c5b32bdf703af5/contracts/pool-templates/base/SwapTemplateBase.vy#L539)
- [ ] Implement [`remove_liquidity_one_coin`](https://github.com/curvefi/curve-contract/blob/4aa3832a4871b1c5b74af7f130c5b32bdf703af5/contracts/pool-templates/base/SwapTemplateBase.vy#L695)
- [ ] Generalize swap pool to support `n` tokens
- [ ] [Admin functions](https://github.com/curvefi/curve-contract/blob/4aa3832a4871b1c5b74af7f130c5b32bdf703af5/contracts/pool-templates/base/SwapTemplateBase.vy#L732)
