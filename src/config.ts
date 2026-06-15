const DEFAULT_COINEX_API_BASE_URL = "https://api.coinex.com/v2";
const DEFAULT_BMSB_POLL_INTERVAL_HOURS = 4;

export interface AppConfig {
  coinExApiBaseUrl: string;
  market: string;
  bmsbPollIntervalHours: number;
  telegram?: TelegramConfig;
}

export interface TelegramConfig {
  botId: number;
  chatId: number;
  token: string;
}

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
  const telegram = loadTelegramConfig(environment);

  return {
    coinExApiBaseUrl: environment.COINEX_API_BASE_URL ?? DEFAULT_COINEX_API_BASE_URL,
    market: environment.MARKET ?? "BTCUSDT",
    bmsbPollIntervalHours: environment.BMSB_POLL_INTERVAL_HOURS
      ? parseInteger(environment.BMSB_POLL_INTERVAL_HOURS, "BMSB_POLL_INTERVAL_HOURS", false)
      : DEFAULT_BMSB_POLL_INTERVAL_HOURS,
    ...(telegram ? { telegram } : {}),
  };
}

function loadTelegramConfig(environment: NodeJS.ProcessEnv): TelegramConfig | undefined {
  const token = environment.TELEGRAM_BOT_TOKEN?.trim();
  const botId = environment.TELEGRAM_BOT_ID?.trim();
  const chatId = environment.TELEGRAM_CHAT_ID?.trim();
  const values = [token, botId, chatId];

  if (values.every((value) => !value)) {
    return undefined;
  }

  if (values.some((value) => !value)) {
    throw new Error("TELEGRAM_BOT_TOKEN, TELEGRAM_BOT_ID, and TELEGRAM_CHAT_ID must be configured together");
  }

  return {
    token: token as string,
    botId: parseInteger(botId as string, "TELEGRAM_BOT_ID", false),
    chatId: parseInteger(chatId as string, "TELEGRAM_CHAT_ID", true),
  };
}

function parseInteger(value: string, name: string, allowNegative: boolean): number {
  const parsed = Number(value);
  const validSign = allowNegative ? parsed !== 0 : parsed > 0;

  if (!Number.isSafeInteger(parsed) || !validSign) {
    throw new Error(`${name} must be a ${allowNegative ? "non-zero" : "positive"} integer`);
  }

  return parsed;
}
