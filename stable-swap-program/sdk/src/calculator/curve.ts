import { ONE, ZERO } from "@saberhq/token-utils";
import JSBI from "jsbi";

const N_COINS = JSBI.BigInt(2); // n

const abs = (a: JSBI): JSBI => {
  if (JSBI.greaterThan(a, ZERO)) {
    return a;
  }
  return JSBI.unaryMinus(a);
};

// maximum iterations of newton's method approximation
const MAX_ITERS = 20;

/**
 * Compute the StableSwap invariant
 * @param ampFactor Amplification coefficient (A)
 * @param amountA Swap balance of token A
 * @param amountB Swap balance of token B
 * Reference: https://github.com/curvefi/curve-contract/blob/7116b4a261580813ef057887c5009e22473ddb7d/tests/simulation.py#L31
 */
export const computeD = (
  ampFactor: JSBI,
  amountA: JSBI,
  amountB: JSBI
): JSBI => {
  const Ann = JSBI.multiply(ampFactor, N_COINS); // A*n^n
  const S = JSBI.add(amountA, amountB); // sum(x_i), a.k.a S
  if (JSBI.equal(S, ZERO)) {
    return ZERO;
  }

  let dPrev = ZERO;
  let d = S;

  for (
    let i = 0;
    JSBI.greaterThan(abs(JSBI.subtract(d, dPrev)), ONE) && i < MAX_ITERS;
    i++
  ) {
    dPrev = d;
    let dP = d;
    dP = JSBI.divide(JSBI.multiply(dP, d), JSBI.multiply(amountA, N_COINS));
    dP = JSBI.divide(JSBI.multiply(dP, d), JSBI.multiply(amountB, N_COINS));

    const dNumerator = JSBI.multiply(
      d,
      JSBI.add(JSBI.multiply(Ann, S), JSBI.multiply(dP, N_COINS))
    );
    const dDenominator = JSBI.add(
      JSBI.multiply(d, JSBI.subtract(Ann, ONE)),
      JSBI.multiply(dP, JSBI.add(N_COINS, ONE))
    );
    d = JSBI.divide(dNumerator, dDenominator);
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
export const computeY = (ampFactor: JSBI, x: JSBI, d: JSBI): JSBI => {
  const Ann = JSBI.multiply(ampFactor, N_COINS); // A*n^n
  // sum' = prod' = x
  const b = JSBI.subtract(JSBI.add(x, JSBI.divide(d, Ann)), d); // b = sum' - (A*n**n - 1) * D / (A * n**n)
  const c = JSBI.divide(
    JSBI.multiply(
      JSBI.multiply(
        d, // c =  D ** (n + 1) / (n ** (2 * n) * prod' * A)
        d
      ),
      d
    ),
    JSBI.multiply(N_COINS, JSBI.multiply(N_COINS, JSBI.multiply(x, Ann)))
  );

  let yPrev = ZERO;
  let y = d;
  for (
    let i = 0;
    i < MAX_ITERS && JSBI.greaterThan(abs(JSBI.subtract(y, yPrev)), ONE);
    i++
  ) {
    yPrev = y;
    y = JSBI.divide(
      JSBI.add(JSBI.multiply(y, y), c),
      JSBI.add(JSBI.multiply(N_COINS, y), b)
    );
  }

  return y;
};
