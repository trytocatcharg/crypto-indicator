import { calculateBmsb, type BmsbPoint } from "../domain/indicators/bmsb.ts";
import type { MarketDataProvider } from "../domain/market/market-data-provider.ts";

const HISTORY_CANDLES = 200;
const CHART_POINTS = 52;

export interface BmsbChartRenderer {
  render(points: readonly BmsbPoint[], market: string): Promise<Buffer> | Buffer;
}

export interface BmsbChartImage {
  caption: string;
  content: Buffer;
  contentType: "image/png";
  filename: string;
}

export async function createBmsbChart(
  marketDataProvider: MarketDataProvider,
  chartRenderer: BmsbChartRenderer,
  market: string,
): Promise<BmsbChartImage> {
  const candles = await marketDataProvider.getWeeklyCandles(market, HISTORY_CANDLES);
  const points = calculateBmsb(candles).slice(-CHART_POINTS);
  const latest = points.at(-1);

  if (!latest) {
    throw new Error(`No BMSB points are available for ${market}`);
  }

  return {
    caption: [
      `${market} Bull Market Support Band`,
      "Evaluation: current weekly candle",
      `Close: ${formatPrice(latest.close)}`,
      `SMA 20W: ${formatPrice(latest.sma20)}`,
      `EMA 21W: ${formatPrice(latest.ema21)}`,
    ].join("\n"),
    content: await chartRenderer.render(points, market),
    contentType: "image/png",
    filename: `${market.toLowerCase()}-bmsb.png`,
  };
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    style: "currency",
    currency: "USD",
  }).format(value);
}
