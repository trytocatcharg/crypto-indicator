import assert from "node:assert/strict";
import test from "node:test";

import { BmsbCrossingMonitor } from "../src/application/bmsb-crossing-monitor.ts";
import type { MarketDataProvider } from "../src/domain/market/market-data-provider.ts";
import type { WeeklyCandle } from "../src/domain/market/weekly-candle.ts";

test("uses the changing close of the current weekly candle and suppresses the initial alert", async () => {
  const latestCloses = [100, 120, 120, 80];
  const provider: MarketDataProvider = {
    async getWeeklyCandles(_market, limit) {
      assert.equal(limit, 200);
      return candles(latestCloses.shift() ?? 80);
    },
  };
  const monitor = new BmsbCrossingMonitor(provider, "BTCUSDT");

  const initial = await monitor.evaluate();
  const upward = await monitor.evaluate();
  const unchanged = await monitor.evaluate();
  const downward = await monitor.evaluate();

  assert.equal(initial.initialized, true);
  assert.equal(initial.event, undefined);
  assert.equal(upward.event?.type, "BMSB_BROKEN_UP");
  assert.equal(unchanged.event, undefined);
  assert.equal(downward.event?.type, "BMSB_BROKEN_DOWN");
});

function candles(currentClose: number): WeeklyCandle[] {
  return Array.from({ length: 21 }, (_, index) => {
    const close = index === 20 ? currentClose : 100;
    return {
      market: "BTCUSDT",
      openedAt: index,
      open: 100,
      close,
      high: Math.max(100, close),
      low: Math.min(100, close),
      volume: 1,
      value: close,
    };
  });
}
