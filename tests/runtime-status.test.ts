import assert from "node:assert/strict";
import test from "node:test";

import { createRuntimeStatusReport } from "../src/application/runtime-status.ts";

test("reports runtime identity and uptime", () => {
  const report = createRuntimeStatusReport({
    botId: 123,
    market: "BTCUSDT",
    pollIntervalHours: 4,
    startedAt: new Date("2026-06-15T10:00:00.000Z"),
    now: new Date("2026-06-16T12:02:03.000Z"),
  });

  assert.match(report, /Crypto Indicator is running/);
  assert.match(report, /Market: BTCUSDT/);
  assert.match(report, /Telegram bot ID: 123/);
  assert.match(report, /Signal candle: current weekly candle/);
  assert.match(report, /Crossing evaluation: every 4 hours/);
  assert.match(report, /Uptime: 1d 2h 2m 3s/);
});
