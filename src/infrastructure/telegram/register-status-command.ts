import type TelegramBot from "node-telegram-bot-api";

import { createRuntimeStatusReport } from "../../application/runtime-status.ts";

export interface StatusCommandConfig {
  authorizedChatId: number;
  botId: number;
  market: string;
  pollIntervalHours: number;
  startedAt: Date;
}

export function registerStatusCommand(bot: TelegramBot, config: StatusCommandConfig): void {
  bot.onText(/^\/status(?:@\w+)?$/, (message) => {
    if (message.chat.id !== config.authorizedChatId) {
      return;
    }

    const report = createRuntimeStatusReport({
      botId: config.botId,
      market: config.market,
      pollIntervalHours: config.pollIntervalHours,
      startedAt: config.startedAt,
      uptimeSeconds: process.uptime(),
    });

    void bot.sendMessage(message.chat.id, report).catch((error: unknown) => {
      console.error("Failed to send runtime status", error);
    });
  });
}
