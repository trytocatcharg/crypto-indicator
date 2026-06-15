import assert from "node:assert/strict";
import test from "node:test";

import { loadConfig } from "../src/config.ts";

test("loads complete Telegram access configuration", () => {
  const config = loadConfig({
    TELEGRAM_BOT_TOKEN: "token",
    TELEGRAM_BOT_ID: "123456",
    TELEGRAM_CHAT_ID: "-987654",
  });

  assert.deepEqual(config.telegram, {
    token: "token",
    botId: 123456,
    chatId: -987654,
  });
});

test("rejects partial Telegram access configuration", () => {
  assert.throws(
    () => loadConfig({ TELEGRAM_BOT_TOKEN: "token" }),
    /must be configured together/,
  );
});

test("loads and validates the current-candle polling interval", () => {
  assert.equal(loadConfig({ BMSB_POLL_INTERVAL_HOURS: "8" }).bmsbPollIntervalHours, 8);
  assert.throws(() => loadConfig({ BMSB_POLL_INTERVAL_HOURS: "0" }), /positive integer/);
});
