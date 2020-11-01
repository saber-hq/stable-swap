const N_COINS = 2; // n

// TODO: Rewrite this module using bn.js

/**
 * Compute the StableSwap invariant
 * @param ampFactor Amplification coefficient (A)
 * @param amountA Swap balance of token A
 * @param amountB Swap balance of token B
 * Reference: https://github.com/curvefi/curve-contract/blob/7116b4a261580813ef057887c5009e22473ddb7d/tests/simulation.py#L31
 */
export const computeD = (
  ampFactor: number,
  amountA: number,
  amountB: number
): number => {
  const Ann = ampFactor * N_COINS; // A*n^n
  const S = amountA + amountB; // sum(x_i), a.k.a S
  if (S === 0) {
    return 0;
  }

  let dPrev = 0;
  let d = S;
  while (Math.abs(d - dPrev) > 1) {
    dPrev = d;
    let dP = d;
    dP = Math.floor((dP * d) / (amountA * N_COINS));
    dP = Math.floor((dP * d) / (amountB * N_COINS));
    d = Math.floor(
      ((Ann * S + dP * N_COINS) * d) / ((Ann - 1) * d + (N_COINS + 1) * dP)
    );
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
