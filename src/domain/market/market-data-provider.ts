import type { WeeklyCandle } from "./weekly-candle.ts";

export interface MarketDataProvider {
  getWeeklyCandles(market: string, limit: number): Promise<WeeklyCandle[]>;
}
