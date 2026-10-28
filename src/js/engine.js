// All timing is monotonic milliseconds. Wall time is used only for records.
export class Exercise {
  constructor({ save = () => {}, wall = () => Date.now() } = {}) {
    this.save = save;
    this.wall = wall;
    this.phase = 'WAITING';
    this.targetMs = 5000;
    this.method = 'camera';
    this.tracking = 'unknown';
    this.entryThreshold = 0.5;
    this.resetSignal();
  }
  resetSignal() {
    this.candidate = 'unknown';
    this.stable = 'unknown';
    this.since = null;
    this.pointSince = null;
    this.lastSample = null;
  }
  start(now, delay = 10000) {
    if (this.phase !== 'WAITING') return;
    this.phase = 'COUNTDOWN';
    this.deadline = now + delay;
    this.resetSignal();
  }
  tick(now) {
    if (this.phase === 'COUNTDOWN' && now >= this.deadline) {
      this.phase = 'ACTIVE';
      this.resetSignal();
    }
    // A stalled video/inference stream cannot add unseen time.
    if (
      this.method === 'camera' &&
      this.lastSample !== null &&
      now - this.lastSample > 500
    ) {
      this.finish(this.lastSample, 'interrupted');
      this.resetSignal();
      this.tracking = 'lost';
    }
  }
  sample(gesture, confidence, now, tracked = true) {
    this.tick(now);
    const threshold = this.thresholdFor(gesture);
    const signal =
      tracked &&
      confidence >= threshold &&
      ['Open_Palm', 'Closed_Fist', 'Pointing_Up'].includes(gesture)
        ? gesture
        : 'unknown';
    if (signal === 'unknown') {
      // End at the last confirmed sample, never after the unknown gap.
      this.finish(this.lastSample ?? now, 'interrupted');
      this.resetSignal();
      this.tracking = tracked ? 'unknown' : 'lost';
      return;
    }
    this.lastSample = now;
    this.tracking = signal;
    if (signal !== this.candidate) {
      this.candidate = signal;
      this.since = now;
      if (signal !== 'Pointing_Up') this.pointSince = null;
    }
    if (this.phase === 'WAITING') {
      if (signal === 'Pointing_Up') {
        this.pointSince ??= now;
        if (now - this.pointSince >= 750) this.start(now, 3000);
      }
      return;
    }
    if (this.phase !== 'ACTIVE' || now - this.since < 150) return;
    this.stable = signal;
    if (signal === 'Open_Palm' && !this.hold) {
      this.hold = { mono: now, iso: new Date(this.wall()).toISOString() };
    } else if (signal === 'Closed_Fist') {
      this.finish(now, 'completed');
    } else if (signal !== 'Open_Palm') {
      this.finish(now, 'interrupted');
    }
  }
  thresholdFor(gesture) {
    return gesture === this.stable
      ? Math.max(0.4, this.entryThreshold - 0.15)
      : this.entryThreshold;
  }
  manual(open, now) {
    if (this.phase !== 'ACTIVE' || this.method !== 'manual') return;
    this.tracking = open ? 'Open_Palm' : 'Closed_Fist';
    if (open && !this.hold)
      this.hold = { mono: now, iso: new Date(this.wall()).toISOString() };
    if (!open) this.finish(now, 'completed');
  }
  elapsed(now) {
    return this.hold ? Math.max(0, now - this.hold.mono) : 0;
  }
  finish(now, outcome) {
    if (!this.hold) return;
    const durationMs = Math.round(this.elapsed(now));
    this.save({
      startTime: this.hold.iso,
      endTime: new Date(Date.parse(this.hold.iso) + durationMs).toISOString(),
      durationMs,
      outcome,
      targetMs: this.targetMs,
      detectionMethod: this.method,
    });
    this.hold = null;
  }
  stop(now) {
    this.tick(now);
    this.finish(now, 'interrupted');
    this.phase = 'WAITING';
    this.resetSignal();
    this.tracking = 'unknown';
  }
}
