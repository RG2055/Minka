import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../js/known-carryovers.js", import.meta.url), "utf8");
const scope = {};
new Function("window", source)(scope);
const carryovers = scope.MinkaKnownCarryovers;

test("names on a listed month boundary are recognised", () => {
  assert.equal(carryovers.isKnownNightCarryover("ANNIJA LAGZDIŅA", 8, "01.09.2026"), true);
  assert.equal(carryovers.isKnownNightCarryover("MARIANNA PETROVA", 8, "01.09.2026"), true);
  // The sheet is inconsistent about the second N and about diacritics.
  assert.equal(carryovers.isKnownNightCarryover("Mariana Petrova", 8, "1.9.2026"), true);
  assert.equal(carryovers.isKnownNightCarryover("Annija Lagzdina", 8, "01.09.2026"), true);
});

test("a listed name is only a carryover on its own date and hours", () => {
  assert.equal(carryovers.isKnownNightCarryover("ANNIJA LAGZDIŅA", 8, "02.09.2026"), false);
  assert.equal(carryovers.isKnownNightCarryover("ANNIJA LAGZDIŅA", 24, "01.09.2026"), false);
});

test("colleagues on the same day are untouched", () => {
  assert.equal(carryovers.isKnownNightCarryover("DARJA REZKOVA", 8, "01.09.2026"), false);
  assert.equal(carryovers.isKnownNightCarryover("", 8, "01.09.2026"), false);
});

test("the June boundary keeps working", () => {
  assert.equal(carryovers.isKnownNightCarryover("KARINA B", 8, "01.06.2026"), true);
  assert.equal(carryovers.isKnownNightCarryover("RENDA C", 8, "01.06.2026"), true);
  assert.equal(carryovers.hasKnownCarryovers("01.06.2026"), true);
  assert.equal(carryovers.hasKnownCarryovers("03.06.2026"), false);
});

test("a short block ending at the 08:00 rollover is last night's tail", () => {
  assert.equal(carryovers.isMorningTailShift({ startTime: "00:00", endTime: "08:00", shift: "8h" }), true);
  assert.equal(carryovers.isMorningTailShift({ startTime: "04:00", endTime: "08:00", shift: "4" }), true);
});

test("real shifts are never mistaken for a tail", () => {
  // Plain day shift.
  assert.equal(carryovers.isMorningTailShift({ startTime: "08:00", endTime: "20:00", shift: "12h" }), false);
  // Fresh evening night — starts after the rollover, so it is today's shift.
  assert.equal(carryovers.isMorningTailShift({ startTime: "20:00", endTime: "08:00", shift: "12h" }), false);
  // A full night wrongly stored as 00:00 is a standalone shift, not a fragment.
  assert.equal(carryovers.isMorningTailShift({ startTime: "00:00", endTime: "08:00", shift: "12h" }), false);
  // Early start but not finishing at the rollover.
  assert.equal(carryovers.isMorningTailShift({ startTime: "07:00", endTime: "15:00", shift: "8h" }), false);
  assert.equal(carryovers.isMorningTailShift({ startTime: "", endTime: "08:00", shift: "8h" }), false);
  assert.equal(carryovers.isMorningTailShift(null), false);
});
