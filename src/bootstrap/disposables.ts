export class DisposableStore {
  private cleanups: Array<() => void> = [];

  public add(cleanup: () => void): void {
    this.cleanups.push(cleanup);
  }

  public dispose(): void {
    while (this.cleanups.length > 0) {
      const cleanup = this.cleanups.pop();
      try {
        cleanup?.();
      } catch {}
    }
  }
}
