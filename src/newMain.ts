import { GameClient } from "./gameClient";
import { AssetLoader } from "./assetsLoader";
import { Application, Assets, Sprite, Graphics, Container, Texture } from "pixi.js";
import { GameRenderer } from "./gameRenderer";
import { errorBox } from "./game.utils";
import { GameConstants } from "./GameConstants";
import { updateLoadingProgress } from "./progressUI";
import { LayoutManager } from "./LayoutManager";
import { soundManager } from "./soundManager";

async function loadFont(fontName: string, fontUrl: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const font = new FontFace(fontName, `url(${fontUrl})`);
		font.load().then(loadedFont => {
			document.fonts.add(loadedFont);
			resolve();
		}).catch(reject);
	});
}

async function waitForFonts() {
	if ('fonts' in document) {
		await document.fonts.ready;
	} else {
		await new Promise(resolve => setTimeout(resolve, 1000));
	}
}


async function InitApp() {
	await waitForFonts();
	const container = document.getElementById('app');
  	if (!container) throw new Error('Container bulunamadı');
	const app = new Application();
	let BASE_WIDTH: number;
	let BASE_HEIGHT: number;

	
	const ua = navigator.userAgent || '';
	const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0;
	const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
	const isSmallScreen = Math.min(window.innerWidth, window.innerHeight) < 768;
	const isMobile = isTouch && (isMobileUA || isSmallScreen);
	GameConstants.setIsMobile(isMobile);

	
	if (GameConstants.IS_MOBILE) {
		BASE_WIDTH = GameConstants.MOBILE_SCREEN.BASE_WIDTH;
		BASE_HEIGHT = GameConstants.MOBILE_SCREEN.BASE_HEIGHT;
	} else {
		BASE_WIDTH = GameConstants.SCREEN.BASE_WIDTH;
		BASE_HEIGHT = GameConstants.SCREEN.BASE_HEIGHT;
	}

	
	const initialResolution = isMobile
		? Math.min(1.25, Math.max(1, (window.devicePixelRatio || 1)))
		: (window.devicePixelRatio || 1);

	await app.init({
		width: BASE_WIDTH,
		height: BASE_HEIGHT,
		backgroundColor: 0x000000,
		autoStart: true,
		antialias: !isMobile, 
		resolution: initialResolution,
	});

	
	try {
		app.ticker.maxFPS = 60;
		app.ticker.minFPS = 30;
	} catch {}

	function getViewportRect() {
		const wrapper = document.getElementById('app-container');
		
		const vv: any = (window as any).visualViewport;
		if (vv) {
			const width = Math.floor(vv.width);
			const height = Math.floor(vv.height);
			return { width, height };
		}
		const rect = (wrapper ? wrapper.getBoundingClientRect() : container!.getBoundingClientRect());
		return { width: Math.floor(rect.width), height: Math.floor(rect.height) };
	}

	
	let prevSmallScreen = isSmallScreen;
	let prevIsMobile = isMobile;
	let reloadScheduled = false;
	
	const checkMobileSwitch = () => {
		if (reloadScheduled) return;
		
		const nowSmall = Math.min(window.innerWidth, window.innerHeight) < 768;
		const nowIsTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0;
		const nowIsMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '');
		const nowIsMobile = nowIsTouch && (nowIsMobileUA || nowSmall);
		
		
		if (prevIsMobile !== nowIsMobile || prevSmallScreen !== nowSmall) {
			console.log(`Viewport değişikliği algılandı: ${prevIsMobile ? 'Mobile' : 'Desktop'} -> ${nowIsMobile ? 'Mobile' : 'Desktop'}`);
			reloadScheduled = true;
			setTimeout(() => { 
				try { 
					window.location.reload(); 
				} catch {} 
			}, 100);
		}
		
		prevSmallScreen = nowSmall;
		prevIsMobile = nowIsMobile;
	};

	function resizeGame() {
		const rect = getViewportRect();
	
	

		const scale = Math.min(rect.width / BASE_WIDTH, rect.height / BASE_HEIGHT);
		const cssWidth = Math.max(1, Math.floor(BASE_WIDTH * scale));
		const cssHeight = Math.max(1, Math.floor(BASE_HEIGHT * scale));
		app.stage.scale.set(1);
		app.stage.position.set(0, 0);

		(app.canvas as HTMLCanvasElement).style.width = cssWidth + 'px';
		(app.canvas as HTMLCanvasElement).style.height = cssHeight + 'px';
		
		(app.canvas as HTMLCanvasElement).style.display = 'block';
		(app.canvas as HTMLCanvasElement).style.margin = '0 auto';
		

		setTimeout(checkMobileSwitch, 150);
	}

	resizeGame();
	window.addEventListener('resize', resizeGame);
	window.addEventListener('orientationchange', () => {
		setTimeout(() => {
			resizeGame();
			
			setTimeout(checkMobileSwitch, 300);
		}, 100);
	});
	
	if ((window as any).visualViewport) {
		(window as any).visualViewport.addEventListener('resize', resizeGame);
		(window as any).visualViewport.addEventListener('scroll', resizeGame);
	}
	
	document.addEventListener('fullscreenchange', () => {
		setTimeout(() => {
			resizeGame();
			setTimeout(checkMobileSwitch, 200);
		}, 100);
	});
	document.addEventListener('webkitfullscreenchange', () => {
		setTimeout(() => {
			resizeGame();
			setTimeout(checkMobileSwitch, 200);
		}, 100);
	});

	
	if (window.matchMedia) {
		const mobileMediaQuery = window.matchMedia('(max-width: 768px)');
		const orientationMediaQuery = window.matchMedia('(orientation: portrait)');
		
		mobileMediaQuery.addEventListener('change', () => {
			setTimeout(checkMobileSwitch, 100);
		});
		
		orientationMediaQuery.addEventListener('change', () => {
			setTimeout(checkMobileSwitch, 200);
		});
	}

	
	if (isMobile) {
		attachAdaptiveResolutionTuner(app, BASE_WIDTH, BASE_HEIGHT);
	}

	return app;
}


function attachAdaptiveResolutionTuner(app: Application, logicalW: number, logicalH: number) {
	const renderer = app.renderer as any;
	const dpr = Math.max(1, window.devicePixelRatio || 1);
	
	const MIN_RES = 0.75;
	const MAX_RES = Math.min(1.5, dpr);

	function applyResolution(next: number) {
		const clamped = Math.max(MIN_RES, Math.min(MAX_RES, Number(next.toFixed(2))));
		if (Math.abs(clamped - renderer.resolution) < 0.01) return;
		try {
			renderer.resolution = clamped;
			renderer.resize(logicalW, logicalH);
		} catch {}
	}

	
	const samples: number[] = [];
	const WINDOW_SECONDS = 4;
	const timer = window.setInterval(() => {
		const fps = app.ticker.FPS || 0;
		samples.push(fps);
		if (samples.length > WINDOW_SECONDS) samples.shift();
		const avg = samples.reduce((a, b) => a + b, 0) / samples.length || 0;

		
		if (avg < 48) {
			applyResolution(renderer.resolution * 0.9);
		} else if (avg > 58) {
			applyResolution(renderer.resolution * 1.04);
		}
	}, 1000);

	const cleanup = () => { try { window.clearInterval(timer); } catch {} };
	window.addEventListener('pagehide', cleanup, { once: true } as any);
	window.addEventListener('beforeunload', cleanup, { once: true } as any);
	try {
		if (import.meta && (import.meta as any).hot) {
			(import.meta as any).hot.dispose(() => cleanup());
		}
	} catch {}
}


async function InitGame(gameCli: GameClient, _progressBar: Graphics, _progressBarBg: Graphics, progressFill: Sprite, maxWidth: number, LoadingContainer: Container, loadingBg: Sprite) {
	const steps = [10, 20, 40, 70, 80, 90];
	updateLoadingProgress(steps[0], progressFill, maxWidth);
	await gameCli.initialize();
	if (!gameCli.clientOk)
		{
			errorBox(gameCli.app, "Unable to Load Game!");
			updateLoadingProgress(steps[1], progressFill, maxWidth);
		return ;
	}
	
	await LayoutManager.instance.load();
	const assetLoader = new AssetLoader(gameCli);
	const assetsDone = await assetLoader.loadAssets(steps, progressFill as any, maxWidth);
	if (!assetsDone)
	{
		gameCli.clientOk = false;
		return ;
	}
	
	GameConstants.updateReelSizes(gameCli.app.screen.width, gameCli.app.screen.height);
	const gameRenderer = new GameRenderer(gameCli.app, gameCli, assetLoader);
	destroyLoadingScreen(LoadingContainer, gameCli.app, loadingBg);
	await gameRenderer.setup();
	gameRenderer.drawGrid(gameCli.defaultGrid);
	gameCli.gameRenderer = gameRenderer;
	gameCli.assetsLoader = assetLoader;
	gameCli.InfoGame = gameRenderer.gameInfo;
}

async function loadLoadingScreenBG(app: Application): Promise<Sprite> {
	const isMobile = GameConstants.IS_MOBILE;
	let bgPath = isMobile ? 'assets/mobile_progressbg.jpg' : 'assets/progressbg.jpg';
	try {
		await Assets.load(bgPath);
	} catch {
		
		bgPath = 'assets/progressbg.jpg';
		await Assets.load(bgPath);
	}
	const bgTexture = Sprite.from(bgPath);
	
	(bgTexture as any).__assetId = bgPath;
	await Assets.load("assets/logo.png");
	await Assets.load("assets/gamelogo.png");
	await loadFont("Bebas Neue", "fonts/BebasNeue-Regular.ttf");
	await loadFont("Cinzel Decorative", "fonts/CinzelDecorative-Regular.ttf");
	bgTexture.width = app.screen.width;
	bgTexture.height = app.screen.height;
	bgTexture.x = 0;
	bgTexture.y = 0;
	app.stage.addChild(bgTexture);
	return bgTexture;
  }


function createLoadingScreen(app: Application) {
	const loadingContainer = new Container();
	const gamelogo = Sprite.from("assets/gamelogo.png");
	const logo = Sprite.from("assets/logo.png");

	const isMobile = GameConstants.IS_MOBILE;
	
	const barWidth = isMobile ? Math.max(160, Math.floor(app.screen.width * 0.75)) : 500;
	const barHeight = isMobile ? Math.max(12, Math.floor(app.screen.height * 0.02)) : 40;
	const dynamicX = Math.floor(app.screen.width / 2 - barWidth / 2);
	
	let dynamicY = Math.floor((app.screen.height / 2 - barHeight / 2) * 1.38);
	const progressBar = new Graphics(); 
	const progressBarBg = new Graphics(); 
	const progressFill = new Sprite(Texture.WHITE);
	progressFill.tint = 0xD7D7D7;
	progressFill.height = barHeight;
	progressFill.width = 0;
	

	
	const strokeWidth = isMobile ? 4 : 6;
	
	gamelogo.anchor.set(0.5);
	gamelogo.scale.set(isMobile ? 1.2 : 1.7);
	gamelogo.x = Math.floor(app.screen.width / 2);
	gamelogo.y = isMobile ? Math.floor(app.screen.height * 0.46) : Math.floor(app.screen.height / 2);
	
	logo.anchor.set(0.5);
	logo.x = Math.floor(app.screen.width / 2);
	logo.y = isMobile
		? Math.floor(gamelogo.y + gamelogo.height * 0.30)
		: Math.floor(gamelogo.y + (gamelogo.height / 3));

	if (isMobile) {
		
		dynamicY = Math.floor(logo.y + logo.height * 0.45);
	}

	
	progressFill.x = dynamicX;
	progressFill.y = dynamicY;

	
	progressBar.clear();
	progressBar.rect(0, 0, barWidth, barHeight);
	progressBar.fill({ color: 0xFE7743, alpha: isMobile ? 0.25 : 0.3 });
	progressBar.x = dynamicX;
	progressBar.y = dynamicY;

	
	progressBarBg.clear();
	progressBarBg.rect(0, 0, barWidth, barHeight);
	progressBarBg.stroke({ color: 0xFE7743, width: strokeWidth });
	progressBarBg.x = dynamicX;
	progressBarBg.y = dynamicY;

	
	loadingContainer.addChild(progressBar);
	loadingContainer.addChild(progressFill);
	loadingContainer.addChildAt(progressBarBg, 2);

	loadingContainer.addChild(gamelogo);
	loadingContainer.addChild(logo);
	app.stage.addChild(loadingContainer);
	return {loadingContainer, progressBar, progressBarBg, progressFill, barWidth};
}


function destroyLoadingScreen(loadingContainer: Container, app: Application, bgTexture?: Sprite) {
    if (!loadingContainer) return;

	loadingContainer.destroy({ children: true, texture: false });
	if (bgTexture) {
		try { app.stage.removeChild(bgTexture); } catch {}
		try { bgTexture.destroy({ children: false, texture: false }); } catch {}
		
		const loadedId = (bgTexture as any).__assetId as string | undefined;
		if (loadedId) {
			try { Assets.unload(loadedId); } catch {}
		}
	}
	app.stage.removeChild(loadingContainer);
}


function eventHandler(gameClient: GameClient, renderer: GameRenderer, isProcessingSpin: boolean)
{
		document.addEventListener('visibilitychange', () => {
			try {
				const hidden = document.hidden;
				if (hidden) {
					gameClient.app.ticker.stop();
				} else {
					gameClient.app.ticker.start();
				}

				try {
					const videos: HTMLVideoElement[] = [];
					const assetsLoader = (gameClient as any).assetsLoader;
					if (assetsLoader) {
						const bgs = (assetsLoader.backgroundFrames || []).concat(assetsLoader.bonusBackgroundFrames || []);
						bgs.forEach((tex: any) => {
							const res = tex?.source?.resource;
							if (res instanceof HTMLVideoElement) videos.push(res);
						});
					}
					try {
						const rbg = (renderer as any)?._backgroundAnimation;
						const res = rbg?.texture?.source?.resource;
						if (res instanceof HTMLVideoElement) videos.push(res);
					} catch (e) {}
					videos.forEach(v => {
						try {
							if (hidden) v.pause();
							else { const p = v.play(); if (p && typeof p.catch === 'function') p.catch(() => {}); }
						} catch (e) {}
					});
				} catch (e) {
				}
				try {
					const bgm = soundManager.find('bgm');
					if (bgm) {
						if (hidden) {
							if (typeof bgm.pause === 'function') bgm.pause();
							else if (typeof bgm.stop === 'function') bgm.stop();
						} else {
							if (typeof bgm.resume === 'function') bgm.resume();
							else if (typeof bgm.play === 'function') bgm.play({ loop: true, volume: 0.2 });
						}
					}
				} catch (e) {
					
				}
			} catch (error) {
				console.warn('Error handling visibility change:', error);
			}
		});
	document.addEventListener("keydown", async (event: KeyboardEvent) => {
		if (event.code === "Space") {
			event.preventDefault();
			if (renderer.isSpinning)
				renderer.forceSuperTurbo();
			await renderer.InitSpin(isProcessingSpin, gameClient.currentSpinType);
		}
	});
	document.addEventListener("keyup", (event: KeyboardEvent) => {
		if (event.code === "Space") {
		}
	});
}

async function game(gameCli: GameClient)
{
	if (!gameCli.gameRenderer || !gameCli.assetsLoader)
	{
		errorBox(gameCli.app, "Unable to Load Game!");
		return;
	}
	const renderer = gameCli.gameRenderer;
	const spinButton = renderer.spinButtonStatic as Sprite;
	
	const isProcessingSpin = gameCli.isProcessingSpin; 
	eventHandler(gameCli, renderer, isProcessingSpin);
	spinButton.on('pointerdown', async () => {
		if (renderer.isSpinning) {
			renderer.forceSuperTurbo();
			return;
		}
		await renderer.InitSpin(isProcessingSpin, gameCli.currentSpinType);
	});

	
}

const main = async () => {
	if ((window as any).__LOR_MAIN_STARTED__) return;
	(window as any).__LOR_MAIN_STARTED__ = true;

	
	if (!(window as any).__LOR_ERROR_RECOVERY__) {
		(window as any).__LOR_ERROR_RECOVERY__ = true;
		const MAX_RESTARTS = 3;
		let restartCount = 0;
		let lastRestart = 0;
		const COOLDOWN_MS = 2_000;
		const logPrefix = '[GLOBAL-RECOVERY]';

		
		const isBenignError = (err: any): boolean => {
			try {
				const msg = (err && (err.message || err.toString())) || '';
				const name = (err && (err.name || '')) || '';
				
				if (/NotAllowedError|AbortError|NotSupportedError|SecurityError/i.test(name)) return true;
				if (/play\(\) request|autoplay|user gesture|The operation was aborted|interrupted by a new|pause\(\)/i.test(msg)) return true;
				
				if (/ResizeObserver loop limit exceeded/i.test(msg)) return true;
				
				if (/AVPlayerItem|MediaError|decode error/i.test(msg)) return false; 
				return false;
			} catch { return false; }
		};

		const ensureRecoveryOverlay = () => {
			let overlay = document.getElementById('game-recover-overlay');
			if (!overlay) {
				overlay = document.createElement('div');
				overlay.id = 'game-recover-overlay';
				overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:#00000080;font-family:Arial;color:#fff;font-size:14px;gap:12px;';
				const spinner = document.createElement('div');
				spinner.style.cssText = 'width:42px;height:42px;border:5px solid #ffffff30;border-top-color:#FE7743;border-radius:50%;animation:lorSpin 0.9s linear infinite';
				const text = document.createElement('div');
				text.textContent = 'Reconnecting...';
				overlay.appendChild(spinner); overlay.appendChild(text);
				const style = document.createElement('style');
				style.textContent = '@keyframes lorSpin{to{transform:rotate(360deg)}}';
				document.head.appendChild(style);
				document.body.appendChild(overlay);
			}
		};

		const clearRecoveryOverlay = () => {
			const overlay = document.getElementById('game-recover-overlay');
			if (overlay) try { overlay.remove(); } catch {}
		};
		(window as any).__LOR_CLEAR_RECOVERY__ = clearRecoveryOverlay;

		(window as any).__LOR_RESTART_COUNT__ = 0;
		const attemptRestart = (reason: string, err?: any) => {
			try { console.error(logPrefix, reason, err); } catch {}
			const now = Date.now();
			if (restartCount >= MAX_RESTARTS) {
				console.warn(logPrefix, 'Max restart limit reached. Staying on recovery overlay.');
				ensureRecoveryOverlay();
				return; 
			}
			if (now - lastRestart < COOLDOWN_MS) {
				
				clearTimeout((window as any).__LOR_PENDING_RESTART__);
				(window as any).__LOR_PENDING_RESTART__ = setTimeout(() => attemptRestart('debounced'), COOLDOWN_MS);
				return;
			}
			restartCount += 1;
			(window as any).__LOR_RESTART_COUNT__ = restartCount;
			lastRestart = now;
			ensureRecoveryOverlay();
			
			try {
				const oldApp: Application | undefined = (window as any).__LOR_APP__;
				if (oldApp) {
					try { oldApp.stage.removeChildren(); } catch {}
					try { (oldApp as any).destroy?.(true); } catch {}
				}
				const canvas = document.getElementById('game-canvas');
				if (canvas && canvas.parentElement) canvas.parentElement.removeChild(canvas);
			} catch {}
			try { (window as any).__LOR_MAIN_STARTED__ = false; } catch {}
			setTimeout(() => { try { main(); } catch (e) { console.error(logPrefix, 'Restart failed', e); } }, 150);
		};
		(window as any).__LOR_FORCE_RESTART__ = (reason = 'manual') => attemptRestart(reason + '_FORCE');
		(window.addEventListener as any)('keydown', (ev: KeyboardEvent) => {
			if (ev.altKey && ev.shiftKey && ev.code === 'KeyR') {
				attemptRestart('hotkey');
			}
		});

		window.addEventListener('error', (e) => {
			const reason: any = (e as any).error || (e as any).message || e;
			if (isBenignError(reason)) return; 
			attemptRestart('window.onerror', reason);
		});
		window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
			const reason: any = e && (e.reason ?? e);
			if (isBenignError(reason)) return; 
			attemptRestart('unhandledrejection', reason);
		});
	}
	const app = await InitApp();
	if (!app) return;
	const gameClient = new GameClient(app);
	(window as any).__LOR_APP__ = app; 
	const gameDiv = document.getElementById('app');
	(app.canvas as HTMLCanvasElement).id = 'game-canvas';
	const existingCanvas = document.getElementById('game-canvas');
	if (existingCanvas && existingCanvas !== app.canvas) {
		existingCanvas.parentElement?.removeChild(existingCanvas);
	}
	if (gameDiv) {
		if (!gameDiv.contains(app.canvas)) gameDiv.appendChild(app.canvas);
	} else {
		if (!document.body.contains(app.canvas)) document.body.appendChild(app.canvas);
	}
	if (import.meta && (import.meta as any).hot) {
		(import.meta as any).hot.dispose(() => {
			(window as any).__LOR_MAIN_STARTED__ = false;
			try { (app as any).destroy?.(true); } catch {}
			const canvas = document.getElementById('game-canvas');
			if (canvas) canvas.remove();
		});
	}
	window.dispatchEvent(new Event('resize'));
	const loadingBg = await loadLoadingScreenBG(app);
	const {loadingContainer, progressBar, progressBarBg, progressFill, barWidth} = createLoadingScreen(app);
	await InitGame(gameClient, progressBar, progressBarBg, progressFill, barWidth, loadingContainer, loadingBg);
	if (gameClient.clientOk)
	{
		game(gameClient);
		try { (window as any).__LOR_CLEAR_RECOVERY__?.(); } catch {}
	}

};

main();