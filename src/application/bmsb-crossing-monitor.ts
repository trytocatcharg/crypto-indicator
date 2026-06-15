import { calculateBmsb } from "../domain/indicators/bmsb.ts";
import type { MarketDataProvider } from "../domain/market/market-data-provider.ts";
import {
  classifyBmsbPosition,
  detectBmsbCrossing,
  type BmsbCrossingEvent,
  type BmsbPosition,
} from "../domain/signals/bmsb-crossing.ts";

const HISTORY_CANDLES = 200;

export interface BmsbCrossingEvaluation {
  currentPosition: BmsbPosition;
  event?: BmsbCrossingEvent;
  initialized: boolean;
}

export class BmsbCrossingMonitor {
  private readonly marketDataProvider: MarketDataProvider;
  private readonly market: string;
  private previousPosition?: BmsbPosition;

  constructor(marketDataProvider: MarketDataProvider, market: string) {
    this.marketDataProvider = marketDataProvider;
    this.market = market;
  }

  async evaluate(): Promise<BmsbCrossingEvaluation> {
    const candles = await this.marketDataProvider.getWeeklyCandles(this.market, HISTORY_CANDLES);
    const latestPoint = calculateBmsb(candles).at(-1);

    if (!latestPoint) {
      throw new Error(`No BMSB point is available for ${this.market}`);
    }

    const currentPosition = classifyBmsbPosition(latestPoint);
    const previousPosition = this.previousPosition;
    this.previousPosition = currentPosition;

    if (!previousPosition) {
      return { currentPosition, initialized: true };
    }

    const event = detectBmsbCrossing(previousPosition, latestPoint);
    return {
      currentPosition,
      initialized: false,
      ...(event ? { event } : {}),
    };
  }
}
