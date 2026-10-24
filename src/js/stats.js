export function summary(sessions) {
  const attempts = sessions.flatMap((s) => s.attempts);
  const successful = attempts.filter(
    (a) => a.outcome === 'completed' && a.durationMs >= a.targetMs,
  ).length;
  const daily = new Map();
  for (const a of attempts) {
    const day = a.startTime.slice(0, 10);
    const row = daily.get(day) ?? { day, attempts: 0, successful: 0, best: 0 };
    row.attempts++;
    row.successful += Number(
      a.outcome === 'completed' && a.durationMs >= a.targetMs,
    );
    row.best = Math.max(row.best, a.durationMs);
    daily.set(day, row);
  }
  return {
    sessions: sessions.length,
    attempts: attempts.length,
    successful,
    rate: attempts.length ? successful / attempts.length : 0,
    average: attempts.length
      ? attempts.reduce((sum, a) => sum + a.durationMs, 0) / attempts.length
      : 0,
    best: Math.max(0, ...attempts.map((a) => a.durationMs)),
    daily: [...daily.values()].sort((a, b) => b.day.localeCompare(a.day)),
  };
}
