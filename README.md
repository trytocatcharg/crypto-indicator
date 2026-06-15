# Crypto Indicator

A Bitcoin monitor that detects crossings of the **Bull Market Support Band (BMSB)** and emits notifications.

## Current status

The project calculates the BMSB from CoinEx's current weekly `BTCUSDT` candle, monitors crossings, and sends protected Telegram notifications.

## Current behavior

1. Fetch and validate weekly BTC candles.
2. Calculate SMA 20W, EMA 21W, and the BMSB.
3. Evaluate the current in-progress weekly candle every four hours.
4. Log and notify when price breaks above or below the band.
5. Provide `/bmsb`, `/status`, and a Monday 10:00 Madrid chart.

## Agreed stack

- Node.js and TypeScript.
- Yarn; do not use npm.
- Native `fetch`; do not use Axios.
- CoinEx API v2 as the initial BTC market-data provider.
- Telegram bot with the `/bmsb` chart command.
- MariaDB and Drizzle ORM only when persistence is demonstrably needed.

## Documentation

- [Product](docs/PRODUCT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Agent guidelines](AGENTS.md)

## Development

Only TypeScript and Node.js type definitions are installed as development dependencies. Runtime market requests use native `fetch`.

Copy `.env.example` to `.env` for local configuration. Public CoinEx candlestick requests do not require credentials.

Set `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_ID`, and `TELEGRAM_CHAT_ID` to start the Telegram bot. Only the configured chat receives responses. `/bmsb` sends the indicator as an inline PNG chart and `/status` reports the running service state.

`BMSB_POLL_INTERVAL_HOURS` controls current-candle crossing evaluation and defaults to `4`.

While the bot is running, it also sends the BMSB chart automatically every Monday at 10:00 in `Europe/Madrid`.

```bash
yarn dev
yarn typecheck
yarn test
yarn start
```
