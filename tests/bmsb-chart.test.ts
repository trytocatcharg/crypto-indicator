import assert from "node:assert/strict";
import test from "node:test";

import { createBmsbChart } from "../src/application/bmsb-chart.ts";
import type { BmsbPoint } from "../src/domain/indicators/bmsb.ts";
import type { MarketDataProvider } from "../src/domain/market/market-data-provider.ts";
import type { WeeklyCandle } from "../src/domain/market/weekly-candle.ts";
import { BmsbPngChartRenderer } from "../src/infrastructure/charts/bmsb-png-chart-renderer.ts";
import { BmsbSvgChartRenderer } from "../src/infrastructure/charts/bmsb-svg-chart-renderer.ts";

test("creates a Telegram-compatible PNG chart from weekly market data", async () => {
  const provider: MarketDataProvider = {
    async getWeeklyCandles(_market, limit) {
      assert.equal(limit, 200);
      return Array.from({ length: 80 }, (_, index) => candle(index));
    },
  };

  const chart = await createBmsbChart(provider, new BmsbPngChartRenderer(), "BTCUSDT");

  assert.equal(chart.filename, "btcusdt-bmsb.png");
  assert.equal(chart.contentType, "image/png");
  assert.match(chart.caption, /SMA 20W/);
  assert.deepEqual([...chart.content.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
});

test("escapes the market label in the SVG", () => {
  const renderer = new BmsbSvgChartRenderer();
  const points: BmsbPoint[] = [
    { openedAt: 1, close: 100, sma20: 90, ema21: 95, lower: 90, upper: 95 },
    { openedAt: 2, close: 110, sma20: 92, ema21: 97, lower: 92, upper: 97 },
  ];

  const svg = renderer.render(points, "BTC<&").toString("utf8");

  assert.match(svg, /BTC&lt;&amp;/);
  assert.doesNotMatch(svg, /BTC<&/);
});

function candle(index: number): WeeklyCandle {
  const close = 20_000 + index * 500;
  return {
    market: "BTCUSDT",
    openedAt: Date.UTC(2024, 0, 1 + index * 7),
    open: close - 100,
    close,
    high: close + 200,
    low: close - 200,
    volume: 1,
    value: close,
  };
}
