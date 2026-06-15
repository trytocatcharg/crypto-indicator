import assert from "node:assert/strict";
import test from "node:test";

import { calculateBmsb } from "../src/domain/indicators/bmsb.ts";
import type { WeeklyCandle } from "../src/domain/market/weekly-candle.ts";

test("calculates SMA 20W, EMA 21W, and ordered band boundaries", () => {
  const candles = Array.from({ length: 21 }, (_, index) => candle(index + 1, index + 1));
  const [point] = calculateBmsb(candles);

  assert.ok(point);
  assert.equal(point.openedAt, 21);
  assert.equal(point.close, 21);
  assert.equal(point.sma20, 11.5);
  assert.ok(Math.abs(point.ema21 - 12.486436280241435) < 1e-12);
  assert.equal(point.lower, point.sma20);
  assert.equal(point.upper, point.ema21);
});

test("requires at least 21 weekly candles", () => {
  const candles = Array.from({ length: 20 }, (_, index) => candle(index, 100));

  assert.throws(() => calculateBmsb(candles), RangeError);
});

function candle(openedAt: number, close: number): WeeklyCandle {
  return {
    market: "BTCUSDT",
    openedAt,
    open: close,
    close,
    high: close,
    low: close,
    volume: 1,
    value: close,
  };
}
