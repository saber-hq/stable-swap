# StableSwap Program

An adaptation of the Solana [token-swap](https://github.com/solana-labs/solana-program-library/tree/master/token-swap/program) program implementing Curve's [StableSwap](https://www.curve.fi/stableswap-paper.pdf) invariant.

Click [here](https://stableswap.pro) to try it out live on the Solana testnet!

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

Run fuzz tests
```
cd fuzz
cargo install cargo-fuzz
cargo fuzz run fuzz_test
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
Payer KP:  46,1,253,168,152,143,118,64,202,81,118,207,125,161,104,245,45,252,241,16,98,177,34,66,251,26,30,189,209,53,179,84,134,204,147,202,147,12,51,80,207,225,160,255,228,9,122,121,171,46,65,234,193,9,166,131,101,139,144,25,32,245,79,148
Owner KP:  124,236,102,153,108,26,69,216,197,69,209,200,188,36,7,43,104,243,96,99,206,64,33,154,197,124,76,233,213,42,147,14,19,21,231,229,169,253,200,173,201,254,15,189,5,202,4,40,45,148,166,119,135,40,115,136,180,110,8,97,50,28,27,196
MintA:  AVmVqtjCxfZcN2kc9vDmaZTYbuZoCoRjMU3mvDEpBmr4
MintB:  A8F2nRNUzX7o3RxSZCm2wig7uEdUy5NnBEKXxGARSvqs
Address:  44WmEqKSkvy7cdXvj1y1v3sNfqcYMQReNutLDjFia1dx
ProgramID:  FdvDz15ZPtnVxj8J3fKSyY9erkFehF6SUPv15yFkdfTii
```

## TODO

- [x] Implement [`get_virtual_price`](https://github.com/curvefi/curve-contract/blob/4aa3832a4871b1c5b74af7f130c5b32bdf703af5/contracts/pool-templates/base/SwapTemplateBase.vy#L241)
- [x] Implement [`remove_liquidity_one_coin`](https://github.com/curvefi/curve-contract/blob/4aa3832a4871b1c5b74af7f130c5b32bdf703af5/contracts/pool-templates/base/SwapTemplateBase.vy#L695)
- [x] [Admin functions](https://github.com/curvefi/curve-contract/blob/4aa3832a4871b1c5b74af7f130c5b32bdf703af5/contracts/pool-templates/base/SwapTemplateBase.vy#L732)

## Out of scope for v1

- [ ] Generalize swap pool to support `n` tokens
- [ ] Implement [`remove_liquidity_imbalance`](https://github.com/curvefi/curve-contract/blob/4aa3832a4871b1c5b74af7f130c5b32bdf703af5/contracts/pool-templates/base/SwapTemplateBase.vy#L539)
