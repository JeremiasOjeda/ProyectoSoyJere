import { MAX_CONNECTIONS } from './config.js';

export class ConnectionLimiter {
  private count = 0;
  private queue: string[] = [];

  getCount() {
    return this.count;
  }

  getQueueSize() {
    return this.queue.length;
  }

  tryJoin(sessionId: string) {
    if (this.count < MAX_CONNECTIONS) {
      this.count++;
      return { ok: true as const, queued: false };
    }
    if (!this.queue.includes(sessionId)) this.queue.push(sessionId);
    return { ok: false as const, queued: true, position: this.queue.indexOf(sessionId) + 1 };
  }

  leave(sessionId: string) {
    if (this.count > 0) this.count--;
    const idx = this.queue.indexOf(sessionId);
    if (idx >= 0) this.queue.splice(idx, 1);
    if (this.queue.length > 0 && this.count < MAX_CONNECTIONS) {
      this.count++;
      return this.queue.shift() ?? null;
    }
    return null;
  }
}
