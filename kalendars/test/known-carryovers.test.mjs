import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../js/known-carryovers.js", import.meta.url), "utf8");
const scope = {};
new Function("window", source)(scope);
const carryovers = scope.MinkaKnownCarryovers;

// Synthetic identities only; production exceptions come from the private API.
const fixture = { '01.02.2040': [{ hours: 8, tokens: ['sample', 'alpha'] }] };

test("no identities are bundled before an authenticated response", () => {
  assert.equal(carryovers.hasKnownCarryovers("01.02.2040"), false);
});

test("API exceptions retain date, hours, all-token and accent matching", () => {
  carryovers.setKnownCarryovers(fixture);
  assert.equal(carryovers.isKnownNightCarryover("Sāmple Ālpha", 8, "1.2.2040"), true);
  assert.equal(carryovers.isKnownNightCarryover("sample alpha", 8, "02.02.2040"), false);
  assert.equal(carryovers.isKnownNightCarryover("sample alpha", 24, "01.02.2040"), false);
  assert.equal(carryovers.isKnownNightCarryover("sample", 8, "01.02.2040"), false);
  assert.equal(carryovers.isKnownNightCarryover("alpha", 8, "01.02.2040"), false);
  assert.equal(carryovers.isKnownNightCarryover("", 8, "01.02.2040"), false);
});

test("replacement snapshots clear obsolete exceptions and reject empty tokens", () => {
  carryovers.setKnownCarryovers({ '01.02.2040': [{ hours: 8, tokens: [] }, { hours: 8, tokens: [''] }] });
  assert.equal(carryovers.hasKnownCarryovers('01.02.2040'), false);
  carryovers.setKnownCarryovers(fixture);
  carryovers.setKnownCarryovers(null);
  assert.equal(carryovers.hasKnownCarryovers('01.02.2040'), false);
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
