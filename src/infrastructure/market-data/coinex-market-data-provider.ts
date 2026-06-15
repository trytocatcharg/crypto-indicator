import type { MarketDataProvider } from "../../domain/market/market-data-provider.ts";
import type { WeeklyCandle } from "../../domain/market/weekly-candle.ts";

interface CoinExKline {
  market: string;
  created_at: number;
  open: string;
  close: string;
  high: string;
  low: string;
  volume: string;
  value: string;
}

interface CoinExKlineResponse {
  code: number;
  data: CoinExKline[];
  message: string;
}

type Fetch = typeof fetch;

export class CoinExMarketDataProvider implements MarketDataProvider {
  private readonly baseUrl: string;
  private readonly fetchImplementation: Fetch;

  constructor(baseUrl: string, fetchImplementation: Fetch = fetch) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.fetchImplementation = fetchImplementation;
  }

  async getWeeklyCandles(market: string, limit: number): Promise<WeeklyCandle[]> {
    if (!Number.isInteger(limit) || limit < 1 || limit > 1_000) {
      throw new RangeError("CoinEx candle limit must be an integer between 1 and 1000");
    }

    const url = new URL(`${this.baseUrl}/spot/kline`);
    url.searchParams.set("market", market);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("period", "1week");

    const response = await this.fetchImplementation(url);

    if (!response.ok) {
      throw new Error(`CoinEx request failed with HTTP ${response.status}`);
    }

    const payload: unknown = await response.json();
    const parsed = parseCoinExKlineResponse(payload);

    if (parsed.code !== 0) {
      throw new Error(`CoinEx request failed: ${parsed.message}`);
    }

    return parsed.data.map(mapCoinExKline).sort((left, right) => left.openedAt - right.openedAt);
  }
}

export function parseCoinExKlineResponse(payload: unknown): CoinExKlineResponse {
  if (!isRecord(payload)) {
    throw new TypeError("CoinEx returned an invalid response");
  }

  const { code, data, message } = payload;

  if (typeof code !== "number" || typeof message !== "string" || !Array.isArray(data)) {
    throw new TypeError("CoinEx returned an invalid response");
  }

  if (!data.every(isCoinExKline)) {
    throw new TypeError("CoinEx returned invalid candlestick data");
  }

  return { code, data, message };
}

function mapCoinExKline(candle: CoinExKline): WeeklyCandle {
  return {
    market: candle.market,
    openedAt: candle.created_at,
    open: parseFiniteNumber(candle.open, "open"),
    close: parseFiniteNumber(candle.close, "close"),
    high: parseFiniteNumber(candle.high, "high"),
    low: parseFiniteNumber(candle.low, "low"),
    volume: parseFiniteNumber(candle.volume, "volume"),
    value: parseFiniteNumber(candle.value, "value"),
  };
}

function isCoinExKline(value: unknown): value is CoinExKline {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.market === "string" &&
    typeof value.created_at === "number" &&
    typeof value.open === "string" &&
    typeof value.close === "string" &&
    typeof value.high === "string" &&
    typeof value.low === "string" &&
    typeof value.volume === "string" &&
    typeof value.value === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseFiniteNumber(value: string, field: string): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new TypeError(`CoinEx returned an invalid ${field} value`);
  }

  return parsed;
}
