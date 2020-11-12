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

Deployments:

```bash
# Devnet
Payer KP:  154,183,126,229,182,45,22,195,142,79,21,239,194,167,28,88,235,228,17,128,12,168,140,198,122,136,213,173,177,1,120,143,138,189,56,109,166,185,36,144,182,174,244,154,233,45,48,115,250,56,250,146,141,156,76,184,164,1,90,19,75,151,15,51
Owner KP:  80,48,185,216,162,213,185,194,124,56,127,40,142,152,91,99,20,188,196,219,83,180,82,9,177,106,231,225,7,224,1,16,212,28,58,239,62,198,6,244,132,114,230,21,155,15,169,229,65,220,69,39,240,73,121,142,109,101,1,205,198,40,91,56
MintA:  HqrhXafTxwqk9G1nf47YWDvTpB5jDtmUnWTsU7mse41S
MintB:  4dY4fUtB7vGQXRfQd5m4KR8fcT4U2yWLT3xCQM5qgFhS
Address:  BKFeciwmNpazwRNhkErWEprsAzAVPSnEKeZTom5Z1hZ6
ProgramID:  D1jwGRnE59kcDWuyqVoKmZdBPfc2PfsrTDugB5mio3gr


# Testnet
Airdrop requested: G5STmnvMxwUyuFX96jv6ijUFQton3fcg8fA6kRVfVmM7uqwS18QJNoTwKEM1NujPV8GBtMf1rdZ3rwpHHHLK24y
Airdrop requested: 65nttZAiqmFKLbFPB7U9qp114jMds4AtiCB4JSxsRswC9QTbHSVbmsmmW3CDHovEa4rvvRwefYS4Vh1A71C3P3QZ
Sending createAccount and InitializeSwap transaction
TxSig: ZKmHNksJSVPN7J8hpBXL9YnFYwEyEvQbnABwZg24jBwAB1RCX24rm5t3PTeiNC4XFGkTAjphrwsu7dbGUTARu4v
Payer KP:  173,13,143,60,248,95,32,128,237,114,24,157,26,148,206,190,198,75,207,15,223,20,242,225,180,183,230,168,178,123,230,31,39,163,88,199,115,50,104,246,149,173,14,37,120,233,172,119,205,59,40,1,100,3,52,44,15,43,179,37,203,76,184,26
Owner KP:  183,118,120,221,40,47,144,214,206,218,14,200,71,7,125,78,182,127,104,39,130,136,114,185,196,251,158,170,53,171,63,242,49,114,191,129,218,164,197,75,171,130,250,107,65,190,109,33,116,66,174,213,235,239,241,36,19,229,150,133,137,179,2,232
ProgramID:  Ar9qd1p7uaBPw8RkX25EF6wYaPCyiFMLNcXcT2u8jkwd
Address:  GNWKGyvYApqGqHkueTSBmmHTZ9wk4EyrymxZh8sHhwUw
```

## TODO

- [x] Implement [`get_virtual_price`](https://github.com/curvefi/curve-contract/blob/4aa3832a4871b1c5b74af7f130c5b32bdf703af5/contracts/pool-templates/base/SwapTemplateBase.vy#L241)
- [ ] Implement [`remove_liquidity_imbalance`](https://github.com/curvefi/curve-contract/blob/4aa3832a4871b1c5b74af7f130c5b32bdf703af5/contracts/pool-templates/base/SwapTemplateBase.vy#L539)
- [ ] Implement [`remove_liquidity_one_coin`](https://github.com/curvefi/curve-contract/blob/4aa3832a4871b1c5b74af7f130c5b32bdf703af5/contracts/pool-templates/base/SwapTemplateBase.vy#L695)
- [ ] Generalize swap pool to support `n` tokens
- [ ] [Admin functions](https://github.com/curvefi/curve-contract/blob/4aa3832a4871b1c5b74af7f130c5b32bdf703af5/contracts/pool-templates/base/SwapTemplateBase.vy#L732)
