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
Payer KP:  234,125,77,140,65,146,129,52,87,154,208,153,232,166,142,131,242,252,44,67,237,132,17,86,188,19,181,62,222,252,241,81,253,22,152,189,50,28,110,142,95,93,208,101,92,13,203,28,1,180,115,199,7,162,12,139,156,132,169,194,28,138,230,21
Owner KP:  35,48,78,0,253,128,163,181,37,45,41,114,104,250,130,125,96,125,170,220,197,46,37,84,123,236,26,61,12,35,106,2,78,100,25,137,52,25,50,181,133,11,196,103,217,27,64,86,125,14,224,183,154,57,61,138,253,71,140,151,155,82,59,123
MintA:  ET2ZUvdTdrTbkZy7UAZcu3k5BpT1kFK6qz8qJN63JTnu
MintB:  6wYEn3M4j7hzsQdUSBvha2WWYDs6AiNojVfb44ZRJ2S2
Address:  EhZRypMwc7tihjeEjEb86s3xP8PLpVdybVqjbMyX5FbP
ProgramID:  Ar9qd1p7uaBPw8RkX25EF6wYaPCyiFMLNcXcT2u8jkwd
```

## TODO

- [x] Implement [`get_virtual_price`](https://github.com/curvefi/curve-contract/blob/4aa3832a4871b1c5b74af7f130c5b32bdf703af5/contracts/pool-templates/base/SwapTemplateBase.vy#L241)
- [ ] Implement [`remove_liquidity_imbalance`](https://github.com/curvefi/curve-contract/blob/4aa3832a4871b1c5b74af7f130c5b32bdf703af5/contracts/pool-templates/base/SwapTemplateBase.vy#L539)
- [ ] Implement [`remove_liquidity_one_coin`](https://github.com/curvefi/curve-contract/blob/4aa3832a4871b1c5b74af7f130c5b32bdf703af5/contracts/pool-templates/base/SwapTemplateBase.vy#L695)
- [ ] Generalize swap pool to support `n` tokens
- [ ] [Admin functions](https://github.com/curvefi/curve-contract/blob/4aa3832a4871b1c5b74af7f130c5b32bdf703af5/contracts/pool-templates/base/SwapTemplateBase.vy#L732)
