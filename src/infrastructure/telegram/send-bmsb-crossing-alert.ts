import type TelegramBot from "node-telegram-bot-api";

import type { BmsbCrossingEvent } from "../../domain/signals/bmsb-crossing.ts";

export async function sendBmsbCrossingAlert(
  bot: TelegramBot,
  chatId: number,
  market: string,
  event: BmsbCrossingEvent,
): Promise<void> {
  const direction = event.type === "BMSB_BROKEN_UP" ? "BROKEN ABOVE" : "BROKEN BELOW";

  await bot.sendMessage(chatId, [
    `BMSB ALERT: ${market} ${direction}`,
    "Evaluation: current weekly candle",
    `Position: ${event.previousPosition} -> ${event.currentPosition}`,
    `Current close: ${formatPrice(event.point.close)}`,
    `Band: ${formatPrice(event.point.lower)} - ${formatPrice(event.point.upper)}`,
    `Candle opened at: ${new Date(event.point.openedAt).toISOString()}`,
  ].join("\n"));
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    style: "currency",
    currency: "USD",
  }).format(value);
}
