import { describe, it, expect } from "vitest";
import { hdiCounts, isEvidenceHerb } from "../hdi";
import { normalizeMedicineName } from "../medical";

describe("herb recognition", () => {
  for (const n of ["Green Tea", "Camellia sinensis", "Ginseng", "Panax ginseng", "Chamomile", "Matricaria chamomilla", "Piperine", "Piper nigrum"])
    it(`${n} is a recognized herb`, () => {
      expect(normalizeMedicineName(n).kind).toBe("herb");
      expect(isEvidenceHerb(n)).toBe(true);
    });
});

describe("unique record counting", () => {
  it("Valerian with two benzodiazepines counts Record 27 once but two pairs", () => {
    const c = hdiCounts(["Valerian"], ["Alprazolam", "Diazepam"]);
    expect(c.confirmed.pairs + c.mixed.pairs + c.noEffect.pairs).toBe(2);
    expect(c.totalRecords).toBe(1);
  });
});

describe("latest test prescription counts", () => {
  const c = hdiCounts(
    ["St. John's Wort", "Ginkgo biloba", "Ginseng", "Turmeric", "Chamomile", "Green Tea", "Piperine"],
    ["Warfarin", "Phenytoin", "Tacrolimus", "Nadolol"],
  );
  it("confirmed records R2 R7 R8 R11 R12 R25 R28", () => expect(c.confirmed.records.map(Number)).toEqual([2, 7, 8, 11, 12, 25, 28]));
  it("mixed record R20", () => expect(c.mixed.records.map(Number)).toEqual([20]));
  it("no-effect record R9", () => expect(c.noEffect.records.map(Number)).toEqual([9]));
  it("9 unique records total", () => expect(c.totalRecords).toBe(9));
  it("7 confirmed pairs, 2 mixed/no-effect pairs", () => {
    expect(c.confirmed.pairs).toBe(7);
    expect(c.mixed.pairs + c.noEffect.pairs).toBe(2);
  });
});
