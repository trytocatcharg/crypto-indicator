# Monitor the Bitcoin Bull Market Support Band

Crypto Indicator monitors Bitcoin against the Bull Market Support Band using CoinEx's **current weekly candle**. It sends Telegram alerts when the live weekly close breaks above or below the band, provides charts on demand, and sends a scheduled weekly chart.

## Current outcome

The authorized Telegram chat receives:

- `/bmsb`: an inline PNG of the current BMSB;
- `/status`: runtime and monitoring status;
- automatic crossing alerts based on the current weekly candle;
- an automatic chart every Monday at 10:00 in `Europe/Madrid`.

## User and need

| Topic | Definition |
|---|---|
| User | A Bitcoin investor following medium- and long-term market structure. |
| Problem | Manual checks consume attention and can miss intrawweek band crossings. |
| Value | Make the current BMSB visible and report live weekly-candle crossings automatically. |

## Implemented capabilities

### Market data and indicator

- Fetch up to 200 weekly `BTCUSDT` candles from the public CoinEx API.
- Validate, normalize, and chronologically order CoinEx responses.
- Include the latest candle returned by CoinEx, even while that week is still in progress.
- Calculate SMA 20W and EMA 21W from weekly closing prices.
- Define the lower and upper band boundaries with the minimum and maximum of both averages.
- Display the latest 52 calculated points in the chart.

### Current-candle crossing alerts

- Evaluate the current weekly candle every four hours by default.
- Allow the interval to be changed through `BMSB_POLL_INTERVAL_HOURS`.
- Classify the current close as `above`, `inside`, or `below` the current band.
- Emit `BMSB_BROKEN_UP` when the position moves from `inside` or `below` to `above`.
- Emit `BMSB_BROKEN_DOWN` when the position moves from `inside` or `above` to `below`.
- Use the first evaluation after startup only to establish the initial position.
- Avoid duplicate alerts while the position remains unchanged.
- Log crossings and send them to the authorized Telegram chat.

Because the candle is in progress, a crossing can reverse before the weekly close. This is intentional: the product prioritizes earlier awareness over closed-candle confirmation.

### Telegram

- Start only when token, expected bot ID, and authorized chat ID are configured together.
- Verify that the token belongs to the expected bot ID.
- Ignore commands from chats other than `TELEGRAM_CHAT_ID`.
- `/bmsb`: send an inline PNG containing current weekly close, SMA 20W, EMA 21W, and the band.
- `/status`: report uptime, start time, market, provider, bot ID, Node.js version, current-candle semantics, polling interval, and weekly schedule.

### Scheduled delivery

- Send the current BMSB chart every Monday at 10:00 in `Europe/Madrid`.
- Respect CET and CEST automatically.

## Indicator definition

| Element | Definition |
|---|---|
| Market | `BTCUSDT` |
| Source | CoinEx weekly candles |
| Signal candle | Latest weekly candle, including the in-progress week |
| SMA | Simple moving average of 20 weekly closes |
| EMA | Exponential moving average of 21 weekly closes |
| Lower boundary | Minimum of SMA 20W and EMA 21W |
| Upper boundary | Maximum of SMA 20W and EMA 21W |

## Current acceptance criteria

- [x] Current CoinEx weekly data is included in calculation and charts.
- [x] SMA 20W, EMA 21W, and band boundaries are tested.
- [x] Price is classified as `above`, `inside`, or `below`.
- [x] Upward and downward crossings generate one event per position change.
- [x] The first evaluation does not create a false startup alert.
- [x] Crossing alerts are sent only to the authorized Telegram chat.
- [x] `/bmsb` sends a visible PNG.
- [x] Weekly scheduling handles Madrid summer and winter time.

## Known limitations

- Crossing state is stored only in memory and resets when the process restarts.
- A restart establishes a new baseline and does not reconstruct missed crossings.
- No persistence or historical audit exists yet.
- The live weekly candle can cross and recross the band before closing.
- If the process is stopped, polling and scheduled delivery do not run.

## Not implemented yet

- Restart-safe alert deduplication.
- Signal and delivery history.
- MariaDB and Drizzle ORM.
- Web dashboard, additional assets, backtesting, or automated trading.

## Next product milestone

Add persistence when restart-safe deduplication and an auditable crossing history become necessary.
