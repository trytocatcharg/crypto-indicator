import type { WeeklyCandle } from "../market/weekly-candle.ts";

const SMA_PERIOD = 20;
const EMA_PERIOD = 21;
const EMA_MULTIPLIER = 2 / (EMA_PERIOD + 1);

export interface BmsbPoint {
  openedAt: number;
  close: number;
  sma20: number;
  ema21: number;
  lower: number;
  upper: number;
}

export function calculateBmsb(candles: readonly WeeklyCandle[]): BmsbPoint[] {
  if (candles.length < EMA_PERIOD) {
    throw new RangeError(`BMSB requires at least ${EMA_PERIOD} weekly candles`);
  }

  const ordered = [...candles].sort((left, right) => left.openedAt - right.openedAt);
  const closes = ordered.map((candle) => candle.close);
  const smaValues = calculateRollingSma(closes, SMA_PERIOD);
  const emaValues = calculateEma(closes);

  return ordered.slice(EMA_PERIOD - 1).map((candle, offset) => {
    const index = offset + EMA_PERIOD - 1;
    const sma20 = smaValues[index];
    const ema21 = emaValues[index];

    if (sma20 === undefined || ema21 === undefined) {
      throw new Error("BMSB calculation produced an incomplete point");
    }

    return {
      openedAt: candle.openedAt,
      close: candle.close,
      sma20,
      ema21,
      lower: Math.min(sma20, ema21),
      upper: Math.max(sma20, ema21),
    };
  });
}

function calculateRollingSma(values: readonly number[], period: number): Array<number | undefined> {
  const result: Array<number | undefined> = new Array(values.length).fill(undefined);
  let sum = 0;

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];

    if (value === undefined) {
      continue;
    }

    sum += value;

    if (index >= period) {
      sum -= values[index - period] ?? 0;
    }

    if (index >= period - 1) {
      result[index] = sum / period;
    }
  }

  return result;
}

function calculateEma(values: readonly number[]): number[] {
  const first = values[0];

  if (first === undefined) {
    return [];
  }

  const result = [first];

  for (let index = 1; index < values.length; index += 1) {
    const value = values[index];
    const previous = result[index - 1];

    if (value === undefined || previous === undefined) {
      throw new Error("EMA calculation received incomplete values");
    }

    result.push(value * EMA_MULTIPLIER + previous * (1 - EMA_MULTIPLIER));
  }

  return result;
}
