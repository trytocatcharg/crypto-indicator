import TelegramBot from "node-telegram-bot-api";

import { BmsbCrossingMonitor } from "./application/bmsb-crossing-monitor.ts";
import { loadConfig } from "./config.ts";
import { BmsbPngChartRenderer } from "./infrastructure/charts/bmsb-png-chart-renderer.ts";
import { CoinExMarketDataProvider } from "./infrastructure/market-data/coinex-market-data-provider.ts";
import { startBmsbPollingSchedule } from "./infrastructure/scheduling/bmsb-polling-scheduler.ts";
import { startWeeklyBmsbSchedule } from "./infrastructure/scheduling/weekly-bmsb-scheduler.ts";
import { registerBmsbCommand, sendBmsbChart } from "./infrastructure/telegram/register-bmsb-command.ts";
import { registerStatusCommand } from "./infrastructure/telegram/register-status-command.ts";
import { sendBmsbCrossingAlert } from "./infrastructure/telegram/send-bmsb-crossing-alert.ts";

const REQUIRED_BMSB_CANDLES = 21;
const STARTED_AT = new Date();

async function main(): Promise<void> {
  const config = loadConfig();
  const marketDataProvider = new CoinExMarketDataProvider(config.coinExApiBaseUrl);

  if (config.telegram) {
    const telegram = config.telegram;
    const bot = new TelegramBot(telegram.token);
    const botIdentity = await bot.getMe();
    const chartRenderer = new BmsbPngChartRenderer();
    const crossingMonitor = new BmsbCrossingMonitor(marketDataProvider, config.market);

    if (botIdentity.id !== telegram.botId) {
      throw new Error("TELEGRAM_BOT_ID does not match the configured bot token");
    }

    registerBmsbCommand(
      bot,
      marketDataProvider,
      chartRenderer,
      config.market,
      telegram.chatId,
    );
    registerStatusCommand(bot, {
      authorizedChatId: telegram.chatId,
      botId: telegram.botId,
      market: config.market,
      pollIntervalHours: config.bmsbPollIntervalHours,
      startedAt: STARTED_AT,
    });
    await bot.setMyCommands([
      { command: "bmsb", description: "Send the current BMSB chart" },
      { command: "status", description: "Show the service runtime status" },
    ]);
    await bot.startPolling();
    startBmsbPollingSchedule(async () => {
      const evaluation = await crossingMonitor.evaluate();

      if (evaluation.initialized) {
        console.log("BMSB current-candle monitor initialized", {
          market: config.market,
          position: evaluation.currentPosition,
        });
        return;
      }

      if (evaluation.event) {
        console.log("BMSB crossing detected", evaluation.event);
        await sendBmsbCrossingAlert(bot, telegram.chatId, config.market, evaluation.event);
      }
    }, config.bmsbPollIntervalHours);
    startWeeklyBmsbSchedule(() =>
      sendBmsbChart(
        bot,
        telegram.chatId,
        marketDataProvider,
        chartRenderer,
        config.market,
      ),
    );
    console.log("Telegram bot started", {
      botId: telegram.botId,
      commands: ["/bmsb", "/status"],
      market: config.market,
      crossingEvaluation: `Current weekly candle every ${config.bmsbPollIntervalHours} hours`,
      weeklyChart: "Monday 10:00 Europe/Madrid",
    });
    return;
  }

  const candles = await marketDataProvider.getWeeklyCandles(config.market, REQUIRED_BMSB_CANDLES);
  const latestCandle = candles.at(-1);

  if (!latestCandle) {
    throw new Error(`CoinEx returned no weekly candles for ${config.market}`);
  }

  console.log("Weekly market data loaded", {
    market: config.market,
    candleCount: candles.length,
    latestCandleOpenedAt: new Date(latestCandle.openedAt).toISOString(),
    latestClose: latestCandle.close,
  });
}

main().catch((error: unknown) => {
  console.error("Crypto indicator failed", error);
  process.exitCode = 1;
});
