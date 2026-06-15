import type { BmsbChartRenderer } from "../../application/bmsb-chart.ts";
import type { BmsbPoint } from "../../domain/indicators/bmsb.ts";

const WIDTH = 1_200;
const HEIGHT = 700;
const MARGIN = { top: 80, right: 70, bottom: 80, left: 100 };

export class BmsbSvgChartRenderer implements BmsbChartRenderer {
  render(points: readonly BmsbPoint[], market: string): Buffer {
    if (points.length < 2) {
      throw new RangeError("The BMSB chart requires at least two points");
    }

    const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
    const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
    const values = points.flatMap((point) => [point.close, point.sma20, point.ema21]);
    const rawMinimum = Math.min(...values);
    const rawMaximum = Math.max(...values);
    const padding = Math.max((rawMaximum - rawMinimum) * 0.08, rawMaximum * 0.01, 1);
    const minimum = rawMinimum - padding;
    const maximum = rawMaximum + padding;

    const x = (index: number): number => MARGIN.left + (index / (points.length - 1)) * plotWidth;
    const y = (value: number): number =>
      MARGIN.top + ((maximum - value) / (maximum - minimum)) * plotHeight;

    const closePath = linePath(points, x, (point) => y(point.close));
    const smaPath = linePath(points, x, (point) => y(point.sma20));
    const emaPath = linePath(points, x, (point) => y(point.ema21));
    const bandPath = areaPath(points, x, y);
    const grid = renderGrid(minimum, maximum, plotHeight, y);
    const labels = renderDateLabels(points, x);
    const latest = points.at(-1);

    if (!latest) {
      throw new Error("The BMSB chart has no latest point");
    }

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="100%" height="100%" fill="#0b1020"/>
  <text x="${MARGIN.left}" y="38" fill="#f8fafc" font-family="sans-serif" font-size="28" font-weight="700">${escapeXml(market)} Bull Market Support Band</text>
  <text x="${MARGIN.left}" y="64" fill="#94a3b8" font-family="sans-serif" font-size="16">Weekly close · SMA 20W · EMA 21W</text>
  ${grid}
  <path d="${bandPath}" fill="#f59e0b" fill-opacity="0.18"/>
  <path d="${closePath}" fill="none" stroke="#f8fafc" stroke-width="3"/>
  <path d="${smaPath}" fill="none" stroke="#22c55e" stroke-width="3"/>
  <path d="${emaPath}" fill="none" stroke="#f59e0b" stroke-width="3"/>
  ${labels}
  <g font-family="sans-serif" font-size="15">
    <circle cx="${MARGIN.left}" cy="${HEIGHT - 30}" r="5" fill="#f8fafc"/><text x="${MARGIN.left + 12}" y="${HEIGHT - 25}" fill="#cbd5e1">Close</text>
    <circle cx="${MARGIN.left + 100}" cy="${HEIGHT - 30}" r="5" fill="#22c55e"/><text x="${MARGIN.left + 112}" y="${HEIGHT - 25}" fill="#cbd5e1">SMA 20W</text>
    <circle cx="${MARGIN.left + 220}" cy="${HEIGHT - 30}" r="5" fill="#f59e0b"/><text x="${MARGIN.left + 232}" y="${HEIGHT - 25}" fill="#cbd5e1">EMA 21W</text>
    <text x="${WIDTH - MARGIN.right}" y="${HEIGHT - 25}" text-anchor="end" fill="#cbd5e1">Latest close: ${formatNumber(latest.close)}</text>
  </g>
</svg>`;

    return Buffer.from(svg, "utf8");
  }
}

function linePath(
  points: readonly BmsbPoint[],
  x: (index: number) => number,
  y: (point: BmsbPoint) => number,
): string {
  return points.map((point, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(2)},${y(point).toFixed(2)}`).join(" ");
}

function areaPath(
  points: readonly BmsbPoint[],
  x: (index: number) => number,
  y: (value: number) => number,
): string {
  const upper = points.map((point, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(2)},${y(point.upper).toFixed(2)}`);
  const lower = [...points]
    .reverse()
    .map((point, reverseIndex) => {
      const index = points.length - reverseIndex - 1;
      return `L${x(index).toFixed(2)},${y(point.lower).toFixed(2)}`;
    });

  return [...upper, ...lower, "Z"].join(" ");
}

function renderGrid(
  minimum: number,
  maximum: number,
  plotHeight: number,
  y: (value: number) => number,
): string {
  return Array.from({ length: 6 }, (_, index) => {
    const value = maximum - (index / 5) * (maximum - minimum);
    const position = y(value);
    return `<line x1="${MARGIN.left}" y1="${position}" x2="${WIDTH - MARGIN.right}" y2="${position}" stroke="#1e293b"/><text x="${MARGIN.left - 12}" y="${position + 5}" text-anchor="end" fill="#94a3b8" font-family="sans-serif" font-size="14">${formatNumber(value)}</text>`;
  }).join("\n  ");
}

function renderDateLabels(points: readonly BmsbPoint[], x: (index: number) => number): string {
  const indexes = [0, Math.floor((points.length - 1) / 2), points.length - 1];

  return indexes.map((index) => {
    const point = points[index];

    if (!point) {
      return "";
    }

    const date = new Date(point.openedAt).toISOString().slice(0, 10);
    return `<text x="${x(index)}" y="${HEIGHT - MARGIN.bottom + 28}" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="14">${date}</text>`;
  }).join("\n  ");
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (character) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    '"': "&quot;",
    "'": "&apos;",
  })[character] ?? character);
}
