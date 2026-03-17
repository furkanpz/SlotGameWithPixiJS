import { Application, Assets, Container, Graphics, Sprite, Texture } from "pixi.js";
import { GameConstants } from "../GameConstants";

const loadFont = async (fontName: string, fontUrl: string): Promise<void> => {
  const font = new FontFace(fontName, `url(${fontUrl})`);
  const loadedFont = await font.load();
  document.fonts.add(loadedFont);
};

export const waitForFonts = async (): Promise<void> => {
  if ("fonts" in document) {
    await document.fonts.ready;
    return;
  }
  await new Promise((resolve) => setTimeout(resolve, 1000));
};

export const loadLoadingScreenBackground = async (app: Application): Promise<Sprite> => {
  let backgroundPath = GameConstants.IS_MOBILE ? "assets/mobile_progressbg.jpg" : "assets/progressbg.jpg";
  try {
    await Assets.load(backgroundPath);
  } catch {
    backgroundPath = "assets/progressbg.jpg";
    await Assets.load(backgroundPath);
  }

  const background = Sprite.from(backgroundPath);
  (background as Sprite & { __assetId?: string }).__assetId = backgroundPath;
  await Assets.load("assets/logo.png");
  await Assets.load("assets/gamelogo.png");
  await loadFont("Bebas Neue", "fonts/BebasNeue-Regular.ttf");
  await loadFont("Cinzel Decorative", "fonts/CinzelDecorative-Regular.ttf");

  background.width = app.screen.width;
  background.height = app.screen.height;
  background.x = 0;
  background.y = 0;
  app.stage.addChild(background);
  return background;
};

export const createLoadingScreen = (app: Application) => {
  const loadingContainer = new Container();
  const gameLogo = Sprite.from("assets/gamelogo.png");
  const logo = Sprite.from("assets/logo.png");
  const isMobile = GameConstants.IS_MOBILE;
  const barWidth = isMobile ? Math.max(160, Math.floor(app.screen.width * 0.75)) : 500;
  const barHeight = isMobile ? Math.max(12, Math.floor(app.screen.height * 0.02)) : 40;
  const progressBarX = Math.floor(app.screen.width / 2 - barWidth / 2);
  let progressBarY = Math.floor((app.screen.height / 2 - barHeight / 2) * 1.38);
  const progressBar = new Graphics();
  const progressBarOutline = new Graphics();
  const progressFill = new Sprite(Texture.WHITE);
  const strokeWidth = isMobile ? 4 : 6;

  progressFill.tint = 0xd7d7d7;
  progressFill.height = barHeight;
  progressFill.width = 0;

  gameLogo.anchor.set(0.5);
  gameLogo.scale.set(isMobile ? 1.2 : 1.7);
  gameLogo.x = Math.floor(app.screen.width / 2);
  gameLogo.y = isMobile ? Math.floor(app.screen.height * 0.46) : Math.floor(app.screen.height / 2);

  logo.anchor.set(0.5);
  logo.x = Math.floor(app.screen.width / 2);
  logo.y = isMobile ? Math.floor(gameLogo.y + gameLogo.height * 0.3) : Math.floor(gameLogo.y + gameLogo.height / 3);

  if (isMobile) {
    progressBarY = Math.floor(logo.y + logo.height * 0.45);
  }

  progressFill.x = progressBarX;
  progressFill.y = progressBarY;

  progressBar.clear();
  progressBar.rect(0, 0, barWidth, barHeight);
  progressBar.fill({ color: 0xfe7743, alpha: isMobile ? 0.25 : 0.3 });
  progressBar.x = progressBarX;
  progressBar.y = progressBarY;

  progressBarOutline.clear();
  progressBarOutline.rect(0, 0, barWidth, barHeight);
  progressBarOutline.stroke({ color: 0xfe7743, width: strokeWidth });
  progressBarOutline.x = progressBarX;
  progressBarOutline.y = progressBarY;

  loadingContainer.addChild(progressBar);
  loadingContainer.addChild(progressFill);
  loadingContainer.addChildAt(progressBarOutline, 2);
  loadingContainer.addChild(gameLogo);
  loadingContainer.addChild(logo);
  app.stage.addChild(loadingContainer);

  return {
    loadingContainer,
    progressBar,
    progressBarOutline,
    progressFill,
    barWidth,
  };
};

export const destroyLoadingScreen = (
  loadingContainer: Container | null,
  app: Application,
  backgroundTexture?: Sprite | null,
): void => {
  if (loadingContainer) {
    try { app.stage.removeChild(loadingContainer); } catch {}
    try { loadingContainer.destroy({ children: true, texture: false }); } catch {}
  }
  if (!backgroundTexture) {
    return;
  }
  try { app.stage.removeChild(backgroundTexture); } catch {}
  try { backgroundTexture.destroy({ children: false, texture: false }); } catch {}
  const assetId = (backgroundTexture as Sprite & { __assetId?: string }).__assetId;
  if (assetId) {
    try { Assets.unload(assetId); } catch {}
  }
};
