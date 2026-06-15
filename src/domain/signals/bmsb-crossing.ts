import type { BmsbPoint } from "../indicators/bmsb.ts";

export type BmsbPosition = "above" | "inside" | "below";
export type BmsbCrossingType = "BMSB_BROKEN_UP" | "BMSB_BROKEN_DOWN";

export interface BmsbCrossingEvent {
  type: BmsbCrossingType;
  previousPosition: BmsbPosition;
  currentPosition: BmsbPosition;
  point: BmsbPoint;
}

export function classifyBmsbPosition(point: BmsbPoint): BmsbPosition {
  if (point.close > point.upper) {
    return "above";
  }

  if (point.close < point.lower) {
    return "below";
  }

  return "inside";
}

export function detectBmsbCrossing(
  previousPosition: BmsbPosition,
  point: BmsbPoint,
): BmsbCrossingEvent | undefined {
  const currentPosition = classifyBmsbPosition(point);

  if (currentPosition === "above" && previousPosition !== "above") {
    return { type: "BMSB_BROKEN_UP", previousPosition, currentPosition, point };
  }

  if (currentPosition === "below" && previousPosition !== "below") {
    return { type: "BMSB_BROKEN_DOWN", previousPosition, currentPosition, point };
  }

  return undefined;
}
