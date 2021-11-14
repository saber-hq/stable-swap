import type { BigintIsh } from "@saberhq/token-utils";
import JSBI from "jsbi";

import { computeD, computeY } from "./curve";

const assertBN = (actual: BigintIsh, expected: BigintIsh) => {
  expect(actual.toString()).toEqual(expected.toString());
};

describe("Calculator tests", () => {
  it("computeD", () => {
    assertBN(
      computeD(JSBI.BigInt(100), JSBI.BigInt(0), JSBI.BigInt(0)),
      JSBI.BigInt(0)
    );
    assertBN(
      computeD(
        JSBI.BigInt(100),
        JSBI.BigInt(1000000000),
        JSBI.BigInt(1000000000)
      ),
      JSBI.BigInt(2000000000)
    );
    assertBN(
      computeD(JSBI.BigInt(73), JSBI.BigInt(92), JSBI.BigInt(81)),
      JSBI.BigInt(173)
    );
    assertBN(
      computeD(JSBI.BigInt(11503), JSBI.BigInt(28338), JSBI.BigInt(78889)),
      JSBI.BigInt(107225)
    );
    assertBN(
      computeD(JSBI.BigInt(8552), JSBI.BigInt(26), JSBI.BigInt(69321)),
      JSBI.BigInt(66920)
    );
    assertBN(
      computeD(JSBI.BigInt(496), JSBI.BigInt(62), JSBI.BigInt(68567)),
      JSBI.BigInt(57447)
    );
    assertBN(
      computeD(
        JSBI.BigInt("17653203515214796177"),
        JSBI.BigInt("13789683482691983066"),
        JSBI.BigInt("3964443602730479576")
      ),
      JSBI.BigInt("17754127085422462641")
    );
  });

  it("computeY", () => {
    assertBN(
      computeY(JSBI.BigInt(100), JSBI.BigInt(100), JSBI.BigInt(0)),
      JSBI.BigInt(0)
    );
    assertBN(
      computeY(JSBI.BigInt(8), JSBI.BigInt(94), JSBI.BigInt(163)),
      JSBI.BigInt(69)
    );
    assertBN(
      computeY(
        JSBI.BigInt(2137),
        JSBI.BigInt(905777403660),
        JSBI.BigInt(830914146046)
      ),
      JSBI.BigInt(490376033)
    );
    assertBN(
      computeY(
        JSBI.BigInt("17095344176474858097"),
        JSBI.BigInt(383),
        JSBI.BigInt("2276818911077272163")
      ),
      JSBI.BigInt("2276917873767753112")
    );
    assertBN(
      computeY(
        JSBI.BigInt("7644937799120520965"),
        JSBI.BigInt("14818904982296505121"),
        JSBI.BigInt("17480022366793075404")
      ),
      JSBI.BigInt("2661117384496570284")
    );
  });
});
