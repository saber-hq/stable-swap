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
    dPrev = d;
    const dP =
      d * Math.floor((d / amountA) * n) * Math.floor((d / amountB) * n);
    d = (Ann * S + dP * n) * Math.floor(d / ((Ann - 1) * d + (n + 1) * dP));
  }

  return d;
};
