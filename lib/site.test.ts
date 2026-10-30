import { test } from "node:test";
import assert from "node:assert/strict";
import { isOpenNow, pickupSlots } from "./site.ts";

// New York is UTC-4 on these dates (EDT).
const ny = (hhmm: string) => new Date(`2026-10-30T${hhmm}:00-04:00`);

test("open from 4:30 PM to 1:00 AM New York time", () => {
  assert.equal(isOpenNow(ny("16:29")), false);
  assert.equal(isOpenNow(ny("16:30")), true);
  assert.equal(isOpenNow(ny("23:59")), true);
  assert.equal(isOpenNow(ny("00:59")), true);
  assert.equal(isOpenNow(ny("01:00")), false);
  assert.equal(isOpenNow(ny("12:00")), false);
});

test("pickup slots run from 4:30 PM to 12:30 AM", () => {
  const s = pickupSlots();
  assert.equal(s[0], "尽快 ASAP");
  assert.equal(s[1], "4:30 PM");
  assert.equal(s.at(-1), "12:30 AM");
  assert.equal(s.length, 1 + 17);
});
