import { Application, Container, Graphics, Sprite } from "pixi.js";
import { AssetLoader } from "../assetsLoader";
import { GameConstants } from "../GameConstants";
import { GameClient } from "../gameClient";
import { errorBox } from "../game.utils";
import { GameRenderer } from "../gameRenderer";
import { LayoutManager } from "../LayoutManager";
import { updateLoadingProgress } from "../progressUI";
import { soundManager } from "../soundManager";
import { DisposableStore } from "./disposables";
import { GameBindings } from "./gameBindings";
import {
  createLoadingScreen,
  destroyLoadingScreen,
  loadLoadingScreenBackground,
  waitForFonts,
} from "./loadingScreen";
import { detectDeviceProfile, PixiViewportController } from "./viewport";

export class GameSession {
  private disposables = new DisposableStore();
  private app: Application | null = null;
  private gameClient: GameClient | null = null;
  private assetLoader: AssetLoader | null = null;
  private gameRenderer: GameRenderer | null = null;
  private loadingContainer: Container | null = null;
  private loadingBackground: Sprite | null = null;
  private destroyed = false;

  public async start(): Promise<void> {
    try {
      await waitForFonts();
      const mountNode = document.getElementById("app");
      if (!mountNode) {
        throw new Error("Unable to locate the game container");
      }

      const profile = detectDeviceProfile();
      const app = new Application();
      this.app = app;

      const initialResolution = profile.isMobile
        ? Math.min(1.25, Math.max(1, window.devicePixelRatio || 1))
        : Math.max(1, window.devicePixelRatio || 1);

      await app.init({
        width: profile.baseWidth,
        height: profile.baseHeight,
        backgroundColor: 0x000000,
        autoStart: true,
        antialias: !profile.isMobile,
        resolution: initialResolution,
      });

      try {
        app.ticker.maxFPS = 60;
        app.ticker.minFPS = 30;
      } catch {}

      const canvas = app.canvas as HTMLCanvasElement;
      canvas.id = "game-canvas";
      const existingCanvas = document.getElementById("game-canvas");
      if (existingCanvas && existingCanvas !== canvas) {
        existingCanvas.remove();
      }
      if (!mountNode.contains(canvas)) {
        mountNode.appendChild(canvas);
      }

      const viewportController = new PixiViewportController(app, mountNode, profile);
      this.disposables.add(() => viewportController.destroy());

      const gameClient = new GameClient(app);
      this.gameClient = gameClient;

      this.loadingBackground = await loadLoadingScreenBackground(app);
      const loadingUi = createLoadingScreen(app);
      this.loadingContainer = loadingUi.loadingContainer;

      await this.initializeGame(gameClient, loadingUi.progressBar, loadingUi.progressBarOutline, loadingUi.progressFill, loadingUi.barWidth);

      if (!gameClient.clientOk || !this.gameRenderer || !this.assetLoader) {
        throw new Error("Unable to initialize the game");
      }

      destroyLoadingScreen(this.loadingContainer, app, this.loadingBackground);
      this.loadingContainer = null;
      this.loadingBackground = null;

      const bindings = new GameBindings(gameClient, this.gameRenderer);
      bindings.attach();
      this.disposables.add(() => bindings.destroy());

      this.assetLoader.preloadDeferredAssets();
    } catch (error) {
      this.destroy();
      throw error;
    }
  }

  private async initializeGame(
    gameClient: GameClient,
    _progressBar: Graphics,
    _progressBarBg: Graphics,
    progressFill: Sprite,
    maxWidth: number,
  ): Promise<void> {
    const steps = [10, 20, 40, 70, 80, 90];
    updateLoadingProgress(steps[0], progressFill, maxWidth);
    await gameClient.initialize();
    if (!gameClient.clientOk) {
      errorBox(gameClient.app, "Unable to Load Game!");
      updateLoadingProgress(steps[1], progressFill, maxWidth);
      throw new Error("Game client initialization failed");
    }

    await LayoutManager.instance.load();
    const assetLoader = new AssetLoader(gameClient);
    this.assetLoader = assetLoader;

    const assetsLoaded = await assetLoader.loadAssets(steps, progressFill, maxWidth);
    if (!assetsLoaded) {
      gameClient.clientOk = false;
      throw new Error("Game assets failed to load");
    }

    GameConstants.updateReelSizes(gameClient.app.screen.width, gameClient.app.screen.height);
    const gameRenderer = new GameRenderer(gameClient.app, gameClient, assetLoader);
    this.gameRenderer = gameRenderer;

    await gameRenderer.setup();
    gameRenderer.drawGrid(gameClient.defaultGrid);
    gameClient.gameRenderer = gameRenderer;
    gameClient.assetsLoader = assetLoader;
    gameClient.InfoGame = gameRenderer.gameInfo;
  }

  public destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.disposables.dispose();
    try { this.gameRenderer?.destroy(); } catch {}
    try { this.assetLoader?.dispose(); } catch {}
    try { this.gameClient?.dispose(); } catch {}
    try { soundManager.dispose(); } catch {}
    if (this.app) {
      destroyLoadingScreen(this.loadingContainer, this.app, this.loadingBackground);
      this.loadingContainer = null;
      this.loadingBackground = null;
      try { this.app.stage.removeChildren(); } catch {}
      try { (this.app as Application & { destroy?: (removeView?: boolean) => void }).destroy?.(true); } catch {}
    }
    this.app = null;
    this.gameClient = null;
    this.assetLoader = null;
    this.gameRenderer = null;
    const canvas = document.getElementById("game-canvas");
    if (canvas) {
      canvas.remove();
    }
  }
}
