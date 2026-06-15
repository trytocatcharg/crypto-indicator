import assert from "node:assert/strict";
import test from "node:test";

import { classifyBmsbPosition, detectBmsbCrossing } from "../src/domain/signals/bmsb-crossing.ts";
import type { BmsbPoint } from "../src/domain/indicators/bmsb.ts";

test("classifies price above, inside, and below the current band", () => {
  assert.equal(classifyBmsbPosition(point(111)), "above");
  assert.equal(classifyBmsbPosition(point(105)), "inside");
  assert.equal(classifyBmsbPosition(point(99)), "below");
});

test("detects breaks out of the band and ignores entry into it", () => {
  assert.equal(detectBmsbCrossing("inside", point(111))?.type, "BMSB_BROKEN_UP");
  assert.equal(detectBmsbCrossing("above", point(99))?.type, "BMSB_BROKEN_DOWN");
  assert.equal(detectBmsbCrossing("above", point(105)), undefined);
});

function point(close: number): BmsbPoint {
  return {
    openedAt: 1,
    close,
    sma20: 100,
    ema21: 110,
    lower: 100,
    upper: 110,
  };
}
