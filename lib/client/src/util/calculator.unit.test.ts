import { computeD } from "./calculator";

describe("Calculator tests", () => {
  it("computeD", () => {
    expect(computeD(100, 1000000000, 1000000000)).toBe(2000000000);
    expect(computeD(73, 92, 81)).toBe(173);
    expect(computeD(11503, 28338, 78889)).toBe(107225);
    expect(computeD(8552, 26, 69321)).toBe(66920);
    expect(computeD(496, 62, 68567)).toBe(57447);
    expect(
      computeD(17653203515214796177, 13789683482691983066, 3964443602730479576)
    ).toBe(17754127085422462641);
  });
});
