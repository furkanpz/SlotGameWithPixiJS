import { DisposableStore } from "./disposables";

const isBenignError = (error: unknown): boolean => {
  try {
    const message = error instanceof Error ? error.message : String(error ?? "");
    const name = error instanceof Error ? error.name : "";
    if (/NotAllowedError|AbortError|NotSupportedError|SecurityError/i.test(name)) {
      return true;
    }
    if (/play\(\) request|autoplay|user gesture|The operation was aborted|interrupted by a new|pause\(\)/i.test(message)) {
      return true;
    }
    return /ResizeObserver loop limit exceeded/i.test(message);
  } catch {
    return false;
  }
};

export class RecoveryController {
  private disposables = new DisposableStore();
  private autoRestartCount = 0;
  private readonly maxAutoRestarts = 1;
  private overlay: HTMLDivElement | null = null;
  private button: HTMLButtonElement | null = null;
  private label: HTMLDivElement | null = null;

  public constructor(private readonly restart: () => Promise<void>) {}

  public install(): void {
    const keydownHandler = (event: KeyboardEvent) => {
      if (event.altKey && event.shiftKey && event.code === "KeyR") {
        void this.retry();
      }
    };

    const errorHandler = (event: ErrorEvent) => {
      const reason = event.error || event.message || event;
      if (isBenignError(reason)) {
        return;
      }
      this.handleRuntimeFailure(reason);
    };

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      const reason = event.reason ?? event;
      if (isBenignError(reason)) {
        return;
      }
      this.handleRuntimeFailure(reason);
    };

    window.addEventListener("keydown", keydownHandler);
    window.addEventListener("error", errorHandler);
    window.addEventListener("unhandledrejection", rejectionHandler);

    this.disposables.add(() => window.removeEventListener("keydown", keydownHandler));
    this.disposables.add(() => window.removeEventListener("error", errorHandler));
    this.disposables.add(() => window.removeEventListener("unhandledrejection", rejectionHandler));
  }

  private ensureOverlay(): void {
    if (this.overlay) {
      return;
    }
    this.overlay = document.createElement("div");
    this.overlay.id = "game-recover-overlay";
    this.overlay.style.cssText =
      "position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.72);font-family:Arial,sans-serif;color:#fff;";

    const panel = document.createElement("div");
    panel.style.cssText =
      "display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:28px 32px;background:rgba(0,0,0,0.72);border:1px solid rgba(255,255,255,0.16);min-width:280px;";

    this.label = document.createElement("div");
    this.label.style.cssText = "font-size:14px;letter-spacing:0.06em;text-transform:uppercase;text-align:center;";
    panel.appendChild(this.label);

    this.button = document.createElement("button");
    this.button.type = "button";
    this.button.textContent = "Retry";
    this.button.style.cssText =
      "display:none;border:0;background:#fe7743;color:#000;font-weight:700;padding:12px 20px;cursor:pointer;font-size:13px;text-transform:uppercase;letter-spacing:0.04em;";
    this.button.addEventListener("click", () => {
      void this.retry();
    });
    panel.appendChild(this.button);

    this.overlay.appendChild(panel);
    document.body.appendChild(this.overlay);
  }

  public showRecovering(message = "Recovering…"): void {
    this.ensureOverlay();
    if (this.label) {
      this.label.textContent = message;
    }
    if (this.button) {
      this.button.style.display = "none";
      this.button.disabled = true;
    }
  }

  public showFatal(error: unknown): void {
    this.ensureOverlay();
    if (this.label) {
      const message = error instanceof Error ? error.message : "Unable to start the game";
      this.label.textContent = message || "Unable to start the game";
    }
    if (this.button) {
      this.button.style.display = "inline-flex";
      this.button.disabled = false;
    }
  }

  public markHealthy(): void {
    this.autoRestartCount = 0;
    if (this.overlay) {
      try { this.overlay.remove(); } catch {}
    }
    this.overlay = null;
    this.button = null;
    this.label = null;
  }

  private handleRuntimeFailure(reason: unknown): void {
    if (this.autoRestartCount >= this.maxAutoRestarts) {
      this.showFatal(reason);
      return;
    }
    this.autoRestartCount += 1;
    this.showRecovering("Recovering…");
    void this.restart().catch((error) => {
      this.showFatal(error);
    });
  }

  public async retry(): Promise<void> {
    this.autoRestartCount = 0;
    this.showRecovering("Retrying…");
    try {
      await this.restart();
    } catch (error) {
      this.showFatal(error);
    }
  }

  public dispose(): void {
    this.disposables.dispose();
    this.markHealthy();
  }
}
