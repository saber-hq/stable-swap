import BN from "bn.js";

import { computeD, computeY } from "./calculator";

const assertBN = (actual: BN, expected: BN) => {
  expect(actual.toString()).toEqual(expected.toString());
};

describe("Calculator tests", () => {
  it("computeD", () => {
    assertBN(computeD(new BN(100), new BN(0), new BN(0)), new BN(0));
    assertBN(
      computeD(new BN(100), new BN(1000000000), new BN(1000000000)),
      new BN(2000000000)
    );
    assertBN(computeD(new BN(73), new BN(92), new BN(81)), new BN(173));
    assertBN(
      computeD(new BN(11503), new BN(28338), new BN(78889)),
      new BN(107225)
    );
    assertBN(computeD(new BN(8552), new BN(26), new BN(69321)), new BN(66920));
    assertBN(computeD(new BN(496), new BN(62), new BN(68567)), new BN(57447));
    assertBN(
      computeD(
        new BN("17653203515214796177"),
        new BN("13789683482691983066"),
        new BN("3964443602730479576")
      ),
      new BN("17754127085422462641")
    );
  });

  it("computeY", () => {
    expect(computeY(100, 100, 0)).toBe(0);
    expect(computeY(8, 94, 163)).toBe(69);
    expect(computeY(2137, 905777403660, 830914146046)).toBe(490376033);
  });
});
