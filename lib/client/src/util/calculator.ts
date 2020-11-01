// Reference https://github.com/curvefi/curve-contract/blob/7116b4a261580813ef057887c5009e22473ddb7d/tests/simulation.py#L31
export const computeD = (
  ampFactor: number,
  amountA: number,
  amountB: number
): number => {
  const n = 2; // Number of coins
  const Ann = ampFactor * n; // A*n^n
  const S = amountA + amountB; // sum(x_i), a.k.a S
  if (S === 0) {
    return 0;
  }

  let dPrev = 0;
  let d = S;
  while (Math.abs(d - dPrev) > 1) {
    let dP = d;
    dPrev = d;
    dP = Math.floor(dP * d / (amountA * n))
    dP = Math.floor(dP * d / (amountB * n));
    d = Math.floor((Ann * S + dP * n) * d / ((Ann - 1) * d + (n + 1) * dP));
  }

  return d;
};
