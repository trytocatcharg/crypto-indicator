export interface RuntimeStatusInput {
  botId: number;
  market: string;
  pollIntervalHours?: number;
  now?: Date;
  startedAt: Date;
  uptimeSeconds?: number;
}

export function createRuntimeStatusReport(input: RuntimeStatusInput): string {
  const now = input.now ?? new Date();
  const uptimeSeconds = input.uptimeSeconds ?? Math.max(0, Math.floor((now.getTime() - input.startedAt.getTime()) / 1_000));

  return [
    "Crypto Indicator is running",
    `Market: ${input.market}`,
    "Market provider: CoinEx",
    "Signal candle: current weekly candle",
    `Crossing evaluation: every ${input.pollIntervalHours ?? 4} hours`,
    "Weekly BMSB chart: Monday 10:00 Europe/Madrid",
    `Telegram bot ID: ${input.botId}`,
    `Started at: ${input.startedAt.toISOString()}`,
    `Uptime: ${formatDuration(uptimeSeconds)}`,
    `Node.js: ${process.version}`,
  ].join("\n");
}

function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  const remainingSeconds = seconds % 60;

  return `${days}d ${hours}h ${minutes}m ${remainingSeconds}s`;
}
