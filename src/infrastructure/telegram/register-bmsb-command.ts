import type TelegramBot from "node-telegram-bot-api";

import { createBmsbChart, type BmsbChartRenderer } from "../../application/bmsb-chart.ts";
import type { MarketDataProvider } from "../../domain/market/market-data-provider.ts";

export function registerBmsbCommand(
  bot: TelegramBot,
  marketDataProvider: MarketDataProvider,
  chartRenderer: BmsbChartRenderer,
  market: string,
  authorizedChatId: number,
): void {
  bot.onText(/^\/bmsb(?:@\w+)?$/, (message) => {
    if (message.chat.id !== authorizedChatId) {
      return;
    }

    void sendBmsbChart(bot, message.chat.id, marketDataProvider, chartRenderer, market);
  });
}

export async function sendBmsbChart(
  bot: TelegramBot,
  chatId: number,
  marketDataProvider: MarketDataProvider,
  chartRenderer: BmsbChartRenderer,
  market: string,
): Promise<void> {
  try {
    await bot.sendChatAction(chatId, "upload_photo");
    const chart = await createBmsbChart(marketDataProvider, chartRenderer, market);

    await bot.sendPhoto(
      chatId,
      chart.content,
      { caption: chart.caption },
      { filename: chart.filename, contentType: chart.contentType },
    );
  } catch (error: unknown) {
    console.error("Failed to send BMSB chart", error);
    await bot.sendMessage(chatId, "The BMSB chart could not be generated. Please try again later.");
  }
}
