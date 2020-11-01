const N_COINS = 2; // n

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
    let dP = d;
    dPrev = d;
    dP = Math.floor((dP * d) / (amountA * N_COINS));
    dP = Math.floor((dP * d) / (amountB * N_COINS));
    d = Math.floor(
      ((Ann * S + dP * N_COINS) * d) / ((Ann - 1) * d + (N_COINS + 1) * dP)
    );
  }

  return d;
};
