import sharp from "sharp";

import type { BmsbChartRenderer } from "../../application/bmsb-chart.ts";
import type { BmsbPoint } from "../../domain/indicators/bmsb.ts";
import { BmsbSvgChartRenderer } from "./bmsb-svg-chart-renderer.ts";

export class BmsbPngChartRenderer implements BmsbChartRenderer {
  private readonly svgRenderer = new BmsbSvgChartRenderer();

  async render(points: readonly BmsbPoint[], market: string): Promise<Buffer> {
    const svg = this.svgRenderer.render(points, market);

    return sharp(svg)
      .png({ compressionLevel: 9 })
      .toBuffer();
  }
}
