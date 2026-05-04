// TimeController.js — Simulation time management

export class TimeController {
  constructor(initialTime = null) {
    this.time = initialTime || {
      day: 1,
      hour: 8,
      minute: 0,
      second: 0,
    };
    this.speed = 1; // 1x, 2x, 5x, 10x
    this.isPaused = false;
    this.listeners = [];
    this._interval = null;
    this._lastRealTime = Date.now();
  }

  start() {
    if (this._interval) return;
    this._lastRealTime = Date.now();
    this._interval = setInterval(() => this._tick(), 100);
  }

  stop() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
  }

  _tick() {
    if (this.isPaused) return;

    // Each real 100ms = speed * 1 simulation second
    const simSecondsPerTick = this.speed;
    this.advanceSeconds(simSecondsPerTick);
    this.notifyListeners();
  }

  advanceSeconds(n) {
    this.time.second += n;
    while (this.time.second >= 60) {
      this.time.second -= 60;
      this.time.minute++;
    }
    while (this.time.minute >= 60) {
      this.time.minute -= 60;
      this.time.hour++;
    }
    while (this.time.hour >= 24) {
      this.time.hour -= 24;
      this.time.day++;
    }
  }

  setSpeed(speed) {
    this.speed = Math.max(1, Math.min(10, speed));
  }

  pause() {
    this.isPaused = true;
  }

  play() {
    this.isPaused = false;
  }

  reset(time) {
    this.time = time || { day: 1, hour: 8, minute: 0, second: 0 };
    this.isPaused = false;
    this.speed = 1;
  }

  getTime() {
    return { ...this.time };
  }

  addListener(fn) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  notifyListeners() {
    const time = this.getTime();
    this.listeners.forEach((fn) => fn(time));
  }
}
