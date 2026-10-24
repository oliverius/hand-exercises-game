export const KEY = 'hand-exercises-v1';
const iso = (s) => typeof s === 'string' && Number.isFinite(Date.parse(s));
export function validAttempt(a) {
  return (
    a &&
    iso(a.startTime) &&
    iso(a.endTime) &&
    Number.isFinite(a.durationMs) &&
    a.durationMs >= 0 &&
    Number.isFinite(a.targetMs) &&
    a.targetMs > 0 &&
    ['completed', 'interrupted'].includes(a.outcome) &&
    ['camera', 'manual'].includes(a.detectionMethod) &&
    Date.parse(a.endTime) >= Date.parse(a.startTime)
  );
}
export function load(storage) {
  try {
    const data = JSON.parse(storage.getItem(KEY));
    if (data?.version !== 1 || !Array.isArray(data.sessions))
      return { version: 1, sessions: [] };
    return {
      version: 1,
      sessions: data.sessions
        .filter(
          (s) =>
            s &&
            typeof s.id === 'string' &&
            iso(s.startedAt) &&
            Array.isArray(s.attempts),
        )
        .map((s) => ({
          id: s.id,
          startedAt: s.startedAt,
          attempts: s.attempts.filter(validAttempt),
        })),
    };
  } catch {
    return { version: 1, sessions: [] };
  }
}
export function persist(storage, data) {
  try {
    storage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
