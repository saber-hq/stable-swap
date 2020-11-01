import BN from "bn.js";
import { assert } from "console";

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
    assertBN(computeY(new BN(100), new BN(100), new BN(0)), new BN(0));
    assertBN(computeY(new BN(8), new BN(94), new BN(163)), new BN(69));
    assertBN(
      computeY(new BN(2137), new BN(905777403660), new BN(830914146046)),
      new BN(490376033)
    );
    assertBN(
      computeY(
        new BN("17095344176474858097"),
        new BN(383),
        new BN("2276818911077272163")
      ),
      new BN("2276917873767753112")
    );
    assertBN(
      computeY(
        new BN("7644937799120520965"),
        new BN("14818904982296505121"),
        new BN("17480022366793075404")
      ),
      new BN("2661117384496570284")
    );
  });
});
