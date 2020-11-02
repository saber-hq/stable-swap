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
Airdrop requested: 2NPNAF2x8wmpmMrX2QSZXxpZZ95X6w9hpSGhfyc91RQb81PFotZwP3YxRXmkkHVknmUkanTYAPcgptECFDCq8yAd
Airdrop requested: cevMnapmgWVTwwdBXh1wxzrL6dm4iKetKodCnGWXhJzsYGUQcHv3sEdvi4Csq2vTxYYgm3dumj47pHmbym89qPN
Sending createAccount and InitializeSwap transaction
TxSig: NjNvJ6JoLoBS7vNi8LwZSr2WaRjEf6njGFPaWiE9QULCnXtceiE2JuurmQcCHXz6eRrbRsLDZEQ663kQedW7PNk
Payer KP:  106,197,94,230,70,18,45,245,235,81,28,75,228,8,53,57,218,123,204,95,222,38,119,165,146,153,9,203,125,92,167,66,127,73,48,196,220,144,153,255,39,97,231,198,16,26,26,23,71,242,194,126,217,157,138,87,1,60,252,124,24,197,88,20
Owner KP:  55,243,66,30,165,203,227,193,53,66,123,231,143,103,40,217,82,21,19,23,59,71,27,116,55,155,58,199,175,216,122,97,234,39,5,111,25,224,110,1,6,149,220,66,47,22,167,160,149,25,128,10,82,92,146,86,85,220,231,108,181,37,210,236
ProgramID:  D1jwGRnE59kcDWuyqVoKmZdBPfc2PfsrTDugB5mio3gr
Address:  GJiRyMheXzQeKnr54WEQ5RpeUXUuwfXLvmeFp94aDj2b

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
