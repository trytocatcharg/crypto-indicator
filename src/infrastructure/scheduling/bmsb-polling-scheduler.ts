export interface BmsbPollingSchedule {
  stop(): void;
}

export function startBmsbPollingSchedule(
  evaluate: () => Promise<void>,
  intervalHours: number,
): BmsbPollingSchedule {
  const intervalMilliseconds = intervalHours * 60 * 60_000;
  let timer: NodeJS.Timeout | undefined;
  let stopped = false;

  const run = (): void => {
    void evaluate()
      .catch((error: unknown) => {
        console.error("BMSB current-candle evaluation failed", error);
      })
      .finally(() => {
        if (!stopped) {
          timer = setTimeout(run, intervalMilliseconds);
        }
      });
  };

  run();

  return {
    stop() {
      stopped = true;
      if (timer) {
        clearTimeout(timer);
      }
    },
  };
}
