import assert from "node:assert/strict";
import test from "node:test";
import type TelegramBot from "node-telegram-bot-api";

import type { BmsbChartRenderer } from "../src/application/bmsb-chart.ts";
import type { MarketDataProvider } from "../src/domain/market/market-data-provider.ts";
import { registerBmsbCommand } from "../src/infrastructure/telegram/register-bmsb-command.ts";
import { registerStatusCommand } from "../src/infrastructure/telegram/register-status-command.ts";
import { sendBmsbCrossingAlert } from "../src/infrastructure/telegram/send-bmsb-crossing-alert.ts";

test("ignores BMSB requests from an unauthorized chat", async () => {
  const fake = createFakeBot();
  const provider: MarketDataProvider = {
    async getWeeklyCandles() {
      throw new Error("market data must not be requested");
    },
  };
  const renderer: BmsbChartRenderer = {
    render() {
      throw new Error("chart must not be rendered");
    },
  };

  registerBmsbCommand(fake.bot, provider, renderer, "BTCUSDT", 42);
  fake.trigger("/bmsb", 99);
  await Promise.resolve();

  assert.equal(fake.sentMessages.length, 0);
  assert.equal(fake.sentPhotos.length, 0);
});

test("sends the BMSB chart as a photo to the authorized chat", async () => {
  const fake = createFakeBot();
  const provider: MarketDataProvider = {
    async getWeeklyCandles() {
      return Array.from({ length: 21 }, (_, index) => ({
        market: "BTCUSDT",
        openedAt: index,
        open: 100 + index,
        close: 100 + index,
        high: 100 + index,
        low: 100 + index,
        volume: 1,
        value: 100 + index,
      }));
    },
  };
  const renderer: BmsbChartRenderer = {
    render() {
      return Buffer.from("png");
    },
  };

  registerBmsbCommand(fake.bot, provider, renderer, "BTCUSDT", 42);
  fake.trigger("/bmsb", 42);
  await new Promise((resolve) => setImmediate(resolve));

  assert.deepEqual(fake.sentPhotos, [42]);
});

test("returns status only to the authorized chat", async () => {
  const fake = createFakeBot();
  registerStatusCommand(fake.bot, {
    authorizedChatId: 42,
    botId: 123,
    market: "BTCUSDT",
    pollIntervalHours: 4,
    startedAt: new Date("2026-06-15T10:00:00.000Z"),
  });

  fake.trigger("/status", 99);
  fake.trigger("/status", 42);
  await Promise.resolve();

  assert.equal(fake.sentMessages.length, 1);
  assert.equal(fake.sentMessages[0]?.chatId, 42);
  assert.match(fake.sentMessages[0]?.text ?? "", /Crypto Indicator is running/);
});

test("sends a current-candle crossing alert", async () => {
  const fake = createFakeBot();

  await sendBmsbCrossingAlert(fake.bot, 42, "BTCUSDT", {
    type: "BMSB_BROKEN_UP",
    previousPosition: "inside",
    currentPosition: "above",
    point: {
      openedAt: Date.UTC(2026, 5, 15),
      close: 70_000,
      sma20: 65_000,
      ema21: 66_000,
      lower: 65_000,
      upper: 66_000,
    },
  });

  assert.equal(fake.sentMessages[0]?.chatId, 42);
  assert.match(fake.sentMessages[0]?.text ?? "", /BMSB ALERT: BTCUSDT BROKEN ABOVE/);
  assert.match(fake.sentMessages[0]?.text ?? "", /Evaluation: current weekly candle/);
});

function createFakeBot(): {
  bot: TelegramBot;
  sentPhotos: number[];
  sentMessages: Array<{ chatId: number; text: string }>;
  trigger: (text: string, chatId: number) => void;
} {
  const handlers: Array<{ regexp: RegExp; callback: (message: { chat: { id: number } }) => void }> = [];
  const sentPhotos: number[] = [];
  const sentMessages: Array<{ chatId: number; text: string }> = [];
  const bot = {
    onText(regexp: RegExp, callback: (message: { chat: { id: number } }) => void) {
      handlers.push({ regexp, callback });
    },
    async sendMessage(chatId: number, text: string) {
      sentMessages.push({ chatId, text });
      return {};
    },
    async sendChatAction() {
      return true;
    },
    async sendPhoto(chatId: number) {
      sentPhotos.push(chatId);
      return {};
    },
  } as unknown as TelegramBot;

  return {
    bot,
    sentPhotos,
    sentMessages,
    trigger(text, chatId) {
      for (const handler of handlers) {
        if (handler.regexp.test(text)) {
          handler.callback({ chat: { id: chatId } });
        }
      }
    },
  };
}
