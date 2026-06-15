# Architecture of the current-candle BMSB monitor

Crypto Indicator is a modular Node.js process that evaluates Bitcoin's Bull Market Support Band from CoinEx's current weekly candle. It detects live crossings, sends protected Telegram alerts, renders PNG charts, and schedules a weekly chart without a database or application framework.

## Runtime flows

### Current-candle monitoring

```text
startup and every N minutes
  -> fetch 200 CoinEx weekly candles
  -> include latest in-progress candle
  -> calculate SMA 20W + EMA 21W
  -> classify close as above / inside / below
  -> compare with previous in-memory position
  -> log and notify Telegram only on an outward crossing
```

The first evaluation initializes the previous position and never alerts.

### Telegram commands and weekly chart

```text
/bmsb or Monday 10:00 Europe/Madrid
  -> authorize or select configured chat
  -> fetch current weekly data
  -> calculate BMSB
  -> compose SVG
  -> convert to PNG
  -> Telegram sendPhoto
```

`/status` reports runtime metadata, current-candle semantics, polling interval, and weekly schedule.

## Implemented modules

| Module | Responsibility | Dependencies |
|---|---|---|
| `domain/market` | Internal weekly candle model and market-data port. | None. |
| `domain/indicators` | Pure SMA 20W, EMA 21W, and BMSB calculation. | Domain only. |
| `domain/signals` | Position classification and crossing detection. | Domain only. |
| `application/bmsb-crossing-monitor` | Retain the previous position and evaluate current data. | Domain ports. |
| `application/bmsb-chart` | Coordinate candles, calculation, renderer, and caption. | Domain ports. |
| `application/runtime-status` | Build a secret-free runtime report. | Native APIs. |
| `infrastructure/market-data` | Fetch and validate CoinEx API v2 candles. | Native `fetch`. |
| `infrastructure/charts` | Compose SVG and convert it to PNG. | Sharp. |
| `infrastructure/telegram` | Authorize commands and deliver charts, status, and alerts. | `node-telegram-bot-api`. |
| `infrastructure/scheduling` | Run current-candle polling and Madrid weekly delivery. | `Intl` and native timers. |

## Current-candle signal semantics

The latest candle returned by CoinEx is treated as the signal candle even when the week is still open. Its changing `close` participates in both the current BMSB values and the position comparison.

| Current close | Position |
|---|---|
| Greater than the upper boundary | `above` |
| Between both boundaries, inclusive | `inside` |
| Lower than the lower boundary | `below` |

| Previous position | Current position | Event |
|---|---|---|
| `inside` or `below` | `above` | `BMSB_BROKEN_UP` |
| `inside` or `above` | `below` | `BMSB_BROKEN_DOWN` |
| Any | `inside` | No event |
| Same position | Same position | No event |

This design intentionally favors early signals. It can produce a break and a later reversal during the same weekly candle.

## Monitoring lifecycle

`BmsbCrossingMonitor` keeps the previous position in process memory. The polling scheduler runs immediately at startup and then recursively after each completed evaluation, preventing overlapping requests when CoinEx or Telegram is slow.

The default interval is four hours and can be changed with `BMSB_POLL_INTERVAL_HOURS`. Evaluation errors are logged; the next polling cycle still runs.

Restart behavior is deliberate but limited:

- previous position is lost;
- the first post-restart evaluation establishes a new baseline;
- no startup alert is sent;
- crossings that happened while offline are not reconstructed.

## External and security boundaries

### CoinEx

The adapter calls public API v2 `GET /spot/kline` with `market=BTCUSDT` and `period=1week`. Values are validated, converted from strings to numbers, and chronologically ordered before entering the domain.

CoinEx credentials are reserved for possible private endpoints and must never appear in logs, source control, Telegram messages, documentation values, or Engram.

### Telegram

`TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_ID`, and `TELEGRAM_CHAT_ID` must be configured together. Startup verifies the token identity through `getMe()`. Every command authorizes the chat before performing work; unauthorized chats are silently ignored.

Crossing alerts contain direction, previous and current positions, current close, band boundaries, and the current candle's opening timestamp. They never contain secrets or the authorized chat ID.

## Chart and scheduling decisions

Charts use the same current weekly candle as signal evaluation. SVG keeps composition testable; Sharp converts it to PNG for an inline Telegram preview.

Weekly chart delivery runs every Monday at 10:00 in `Europe/Madrid`. `Intl.DateTimeFormat` handles CET/CEST, and native timers avoid a cron dependency. Both polling and weekly delivery require the process to remain running.

## Persistence decision

No database is used. Current in-memory state is sufficient for basic duplicate suppression during one process lifetime. MariaDB and Drizzle become justified for restart-safe deduplication, event history, delivery auditing, multiple users, or operational queries.

## Configuration

| Variable | Required | Purpose |
|---|---|---|
| `COINEX_API_BASE_URL` | No | Override the public CoinEx API base URL. |
| `MARKET` | No | Market to monitor; defaults to `BTCUSDT`. |
| `BMSB_POLL_INTERVAL_HOURS` | No | Current-candle evaluation interval; defaults to `4`. |
| `COINEX_ACCESS_ID` | No | Reserved for possible private CoinEx endpoints. |
| `COINEX_SECRET_KEY` | No | Reserved for possible private CoinEx endpoints. |
| `TELEGRAM_BOT_TOKEN` | Together | Authenticate the Telegram bot. |
| `TELEGRAM_BOT_ID` | Together | Verify the expected bot identity. |
| `TELEGRAM_CHAT_ID` | Together | Select the only chat allowed to receive responses and alerts. |

## Dependency and platform policy

- Yarn is the only package manager.
- Every direct dependency uses an exact version; `^`, `~`, `*`, and floating tags are forbidden.
- Native `fetch` replaces Axios.
- Native Node.js watch mode powers `yarn dev`.
- Native Node.js tests verify domain and infrastructure behavior.
- No web or application framework is installed.

## Failure behavior

| Failure | Behavior |
|---|---|
| Invalid CoinEx response | Fail the current evaluation and log the error. |
| Wrong Telegram bot ID | Stop startup. |
| Unauthorized Telegram chat | Ignore silently. |
| Crossing evaluation failure | Log and retry on the next interval. |
| Alert delivery failure | Log the error; state remains updated to avoid duplicate event loops. |
| Chart generation or delivery failure | Log and send a safe message when possible. |
| Weekly delivery failure | Log and schedule the next week. |

## Verification

Automated tests cover CoinEx mapping, BMSB calculation, position classification, crossing transitions, initial baseline suppression, changing current-candle closes, Telegram authorization, PNG output, runtime status, configuration, and CET/CEST scheduling.

```bash
yarn typecheck
yarn test
```

## Current structure

```text
src/
  application/
  domain/
    indicators/
    market/
    signals/
  infrastructure/
    charts/
    market-data/
    scheduling/
    telegram/
tests/
docs/
```

## Next architectural milestone

Introduce MariaDB with Drizzle only when the product requires crossing state and history to survive process restarts.
