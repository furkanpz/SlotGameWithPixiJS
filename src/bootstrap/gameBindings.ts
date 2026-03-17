import { GameClient } from "../gameClient";
import { GameRenderer } from "../gameRenderer";
import { soundManager } from "../soundManager";
import { DisposableStore } from "./disposables";

export class GameBindings {
  private disposables = new DisposableStore();
  private spinButtonHandler: (() => Promise<void>) | null = null;

  public constructor(
    private readonly gameClient: GameClient,
    private readonly renderer: GameRenderer,
  ) {}

  public attach(): void {
    const visibilityHandler = () => {
      const hidden = document.hidden;
      try {
        if (hidden) {
          this.gameClient.app.ticker.stop();
        } else {
          this.gameClient.app.ticker.start();
        }
      } catch {}

      const videos: HTMLVideoElement[] = [];
      const assetsLoader = this.gameClient.assetsLoader;
      if (assetsLoader) {
        for (const texture of [...assetsLoader.backgroundFrames, ...assetsLoader.bonusBackgroundFrames]) {
          const resource = texture?.source?.resource;
          if (resource instanceof HTMLVideoElement) {
            videos.push(resource);
          }
        }
      }

      const backgroundResource = this.renderer.currentBackgroundVideo;
      if (backgroundResource instanceof HTMLVideoElement) {
        videos.push(backgroundResource);
      }

      for (const video of videos) {
        try {
          if (hidden) {
            video.pause();
          } else {
            const playPromise = video.play();
            if (playPromise && typeof playPromise.catch === "function") {
              playPromise.catch(() => {});
            }
          }
        } catch {}
      }

      const backgroundMusic = soundManager.find("bgm");
      if (!backgroundMusic) {
        return;
      }
      try {
        if (hidden) {
          if (typeof backgroundMusic.pause === "function") {
            backgroundMusic.pause();
          } else if (typeof backgroundMusic.stop === "function") {
            backgroundMusic.stop();
          }
        } else if (typeof backgroundMusic.resume === "function") {
          backgroundMusic.resume();
        } else if (typeof backgroundMusic.play === "function") {
          backgroundMusic.play({ loop: true, volume: 0.2 });
        }
      } catch {}
    };

    document.addEventListener("visibilitychange", visibilityHandler);
    this.disposables.add(() => document.removeEventListener("visibilitychange", visibilityHandler));

    const keydownHandler = async (event: KeyboardEvent) => {
      if (event.code !== "Space") {
        return;
      }
      event.preventDefault();
      await this.triggerSpin();
    };

    document.addEventListener("keydown", keydownHandler);
    this.disposables.add(() => document.removeEventListener("keydown", keydownHandler));

    const spinButton = this.renderer.spinButtonStatic;
    if (spinButton) {
      this.spinButtonHandler = async () => {
        await this.triggerSpin();
      };
      spinButton.on("pointerdown", this.spinButtonHandler);
      this.disposables.add(() => {
        if (this.spinButtonHandler) {
          spinButton.off("pointerdown", this.spinButtonHandler);
        }
      });
    }
  }

  private async triggerSpin(): Promise<void> {
    if (this.renderer.isSpinning) {
      this.renderer.forceSuperTurbo();
      return;
    }
    await this.renderer.InitSpin(this.gameClient.isProcessingSpin, this.gameClient.currentSpinType);
  }

  public destroy(): void {
    this.disposables.dispose();
    this.spinButtonHandler = null;
  }
}
