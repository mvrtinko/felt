export type BlindsLevel = {
  level: number;
  sb: number;
  bb: number;
  msIntoLevel: number;
  msRemainingInLevel: number;
  intervalMs: number;
  paused: boolean;
  active: boolean;
};

type Config = {
  initialSb: number;
  initialBb: number;
  intervalMinutes: number;
  sessionStartedAt: number | null;
  pausedAt: number | null;
  totalPausedMs: number;
};

export function computeBlinds(
  config: Config,
  now: number = Date.now(),
): BlindsLevel {
  const intervalMs = config.intervalMinutes * 60 * 1000;
  if (config.sessionStartedAt === null) {
    return {
      level: 0,
      sb: config.initialSb,
      bb: config.initialBb,
      msIntoLevel: 0,
      msRemainingInLevel: intervalMs,
      intervalMs,
      paused: false,
      active: false,
    };
  }
  const paused = config.pausedAt !== null;
  const effectiveNow = paused ? config.pausedAt! : now;
  const elapsed = Math.max(
    0,
    effectiveNow - config.sessionStartedAt - config.totalPausedMs,
  );
  const level = Math.floor(elapsed / intervalMs);
  const msIntoLevel = elapsed % intervalMs;
  const msRemainingInLevel = intervalMs - msIntoLevel;
  const multiplier = Math.pow(2, level);
  return {
    level,
    sb: config.initialSb * multiplier,
    bb: config.initialBb * multiplier,
    msIntoLevel,
    msRemainingInLevel,
    intervalMs,
    paused,
    active: true,
  };
}

export function formatStake(n: number): string {
  if (n >= 1000) {
    return n % 1000 === 0
      ? `${n / 1000}k`
      : `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return String(n);
}

export function formatMs(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
