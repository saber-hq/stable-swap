import BN from "bn.js";

const ZERO = new BN(0);
const ONE = new BN(1);
const N_COINS = new BN(2); // n

// TODO: Rewrite this module using bn.js

/**
 * Compute the StableSwap invariant
 * @param ampFactor Amplification coefficient (A)
 * @param amountA Swap balance of token A
 * @param amountB Swap balance of token B
 * Reference: https://github.com/curvefi/curve-contract/blob/7116b4a261580813ef057887c5009e22473ddb7d/tests/simulation.py#L31
 */
export const computeD = (ampFactor: BN, amountA: BN, amountB: BN): BN => {
  const Ann = ampFactor.mul(N_COINS); // A*n^n
  const S = amountA.add(amountB); // sum(x_i), a.k.a S
  if (S.isZero()) {
    return S;
  }

  let dPrev = ZERO;
  let d = S;
  while (d.sub(dPrev).abs().gt(ONE)) {
    dPrev = d;
    let dP = d;
    dP = dP.mul(d).div(new BN(amountA.mul(N_COINS)));
    dP = dP.mul(d).div(new BN(amountB.mul(N_COINS)));

    const dNumerator = d.mul(new BN(Ann.mul(S).add(new BN(dP.mul(N_COINS)))));
    const dDenominator = d
      .mul(new BN(Ann.sub(ONE)))
      .add(dP.mul(new BN(N_COINS.add(ONE))));
    d = dNumerator.div(dDenominator);
  }

  return d;
};

/**
 * Compute Y amount in respect to X on the StableSwap curve
 * @param ampFactor Amplification coefficient (A)
 * @param x The quantity of underlying asset
 * @param d StableSwap invariant
 * Reference: https://github.com/curvefi/curve-contract/blob/7116b4a261580813ef057887c5009e22473ddb7d/tests/simulation.py#L55
 */
export const computeY = (ampFactor: number, x: number, d: number): number => {
  const Ann = ampFactor * N_COINS; // A*n^n
  // sum' = prod' = x
  const b = Math.floor(x + d / Ann - d); // b = sum' - (A*n**n - 1) * D / (A * n**n)
  const c = Math.floor((d * d * d) / (N_COINS * N_COINS * x * Ann)); // c =  D ** (n + 1) / (n ** (2 * n) * prod' * A)

  let yPrev = 0;
  let y = d;
  while (Math.abs(y - yPrev) > 1) {
    yPrev = y;
    y = Math.floor((y * y + c) / (2 * y + b));
  }

  return y;
};
