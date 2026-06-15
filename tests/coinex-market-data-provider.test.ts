import assert from "node:assert/strict";
import test from "node:test";

import { CoinExMarketDataProvider } from "../src/infrastructure/market-data/coinex-market-data-provider.ts";

test("maps and orders CoinEx weekly candles", async () => {
  const fetchMock: typeof fetch = async (input) => {
    const url = new URL(String(input));

    assert.equal(url.pathname, "/v2/spot/kline");
    assert.equal(url.searchParams.get("market"), "BTCUSDT");
    assert.equal(url.searchParams.get("period"), "1week");
    assert.equal(url.searchParams.get("limit"), "2");

    return Response.json({
      code: 0,
      message: "OK",
      data: [
        {
          market: "BTCUSDT",
          created_at: 2000,
          open: "102",
          close: "103",
          high: "104",
          low: "101",
          volume: "12.5",
          value: "1287.5",
        },
        {
          market: "BTCUSDT",
          created_at: 1000,
          open: "100",
          close: "102",
          high: "103",
          low: "99",
          volume: "10",
          value: "1010",
        },
      ],
    });
  };

  const provider = new CoinExMarketDataProvider("https://api.coinex.com/v2/", fetchMock);
  const candles = await provider.getWeeklyCandles("BTCUSDT", 2);

  assert.deepEqual(candles, [
    {
      market: "BTCUSDT",
      openedAt: 1000,
      open: 100,
      close: 102,
      high: 103,
      low: 99,
      volume: 10,
      value: 1010,
    },
    {
      market: "BTCUSDT",
      openedAt: 2000,
      open: 102,
      close: 103,
      high: 104,
      low: 101,
      volume: 12.5,
      value: 1287.5,
    },
  ]);
});

test("rejects invalid CoinEx candle payloads", async () => {
  const fetchMock: typeof fetch = async () =>
    Response.json({
      code: 0,
      message: "OK",
      data: [{ market: "BTCUSDT" }],
    });

  const provider = new CoinExMarketDataProvider("https://api.coinex.com/v2", fetchMock);

  await assert.rejects(() => provider.getWeeklyCandles("BTCUSDT", 1), {
    name: "TypeError",
    message: "CoinEx returned invalid candlestick data",
  });
});

test("rejects unsupported candle limits before requesting CoinEx", async () => {
  const fetchMock: typeof fetch = async () => {
    throw new Error("fetch must not be called");
  };

  const provider = new CoinExMarketDataProvider("https://api.coinex.com/v2", fetchMock);

  await assert.rejects(() => provider.getWeeklyCandles("BTCUSDT", 0), RangeError);
  await assert.rejects(() => provider.getWeeklyCandles("BTCUSDT", 1001), RangeError);
});
