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
