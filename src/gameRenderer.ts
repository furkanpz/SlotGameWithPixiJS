import { Application, Container, AnimatedSprite, Sprite, Graphics, Text, Texture, Rectangle } from "pixi.js";
import { LayoutManager } from "./LayoutManager";
import { GameClient, spinType } from "./gameClient";
import { AssetLoader } from "./assetsLoader";
import { scalePx } from "./game.utils";
import { gameInfo } from "./GameUI";
import { GameAnimations } from "./gameAnimations";
import type { WildPosition, WinDetail } from "./gameAnimations";
import type { GroupedSymbol } from "./types";
import { GameConstants } from "./GameConstants";
import { ReelAnimator } from "./reelAnimations";
import { soundManager } from "./soundManager";
import { SpritePool } from "./objPool";
import { ObjectPool } from "./objPool";


export class GameRenderer {
	private container: Container;
	private layerBack: Container;   
	private layerFrame: Container;  
	private layerFrameBg: Container;  
	private layerGrid: Container;   
	private layerAnimations: Container;   
	private layerReels: Container;  
	private layerFX: Container;     
	private layerUI: Container;     
	private layerOverlay: Container; 

	
	private app: Application;
	private client: GameClient;
	private assetLoader: AssetLoader;
	private _animatedSpinButton: AnimatedSprite | null = null;
	private _isSpinning: boolean = false;
	private initialGrid: Record<string, any> = {};
	private reelAnimators: ReelAnimator[] = [];
	private _gameUI: gameInfo;
	private hasAccelerated: boolean = false;
	private _isWin: boolean = false;
	private _winAmount: number = 0;
	private spinButton: Sprite | null = null;
	private wildPositions: WildPosition[] = [];
	private winDetails: WinDetail[] = [];
	
	private _scatterHighlightSprites: Sprite[] = [];
	private _scatterGlowGfx: Graphics[] = [];


	private _isInFreespin: spinType = spinType.NORMAL;
	private _freespinData: any[] = [];
	private _currentFreespinIndex: number = 0;
	private _freespinOverlayShown: boolean = false;

	
	private _remainingFreespins: number = 0;
	private _totalFreespins: number = 0;
	private _totalFreespinWin: number = 0;
	private _isMainSpinForFreespin: boolean = false;
	private _freespinCompletionPending: boolean = false;
	private _currentReelSetType: string = "default";

	private _frameSprite: Sprite | null = null;
	private _framebg: Sprite | null = null;
	private _gridLines: Graphics | null = null;
	private _backgroundAnimation: Sprite | null = null;
	private _bgMask: Graphics | null = null;

	private offsetX: number = (GameConstants.REEL_SIZE * GameConstants.GRID_COLS) / 2;
	private offsetY: number = (GameConstants.REEL_SIZE * GameConstants.GRID_ROWS) / 2;
	private coordinateGrid: { x: number; y: number; }[][] = [];
	private isCoordinateGridInitialized: boolean = false;

	private animationCallbacks: Set<() => void> = new Set();
	private isAnimationLoopRunning: boolean = false;

	private _spritePool!: SpritePool;
	private _objectPool!: ObjectPool;

	private _mobileAccelListenerReady: boolean = false;
	private _superTurboActivated: boolean = false; 
	private _turboLevel: number = 0;
	private _userTurboLevel: number = 0;
	private _turboRestoreLevel: number | null = null;
	
	private _superTurboBaseline: number | null = null;
	private _amount: number = 0;
	
	private _inputLocked: boolean = false;
	
	private _scatterSlowdownHappened: boolean = false;
	
	private _scatterSlowdownSoundPlayed: boolean = false;

	private currentSprites: Sprite[][] = [];
	private gameAnimations: GameAnimations | null = null;
	private _usedPrivateMethods: boolean = false;

	constructor(app: Application, client: GameClient, assetLoader: AssetLoader) {
		this.app = app;
		this.client = client;
		this.assetLoader = assetLoader;

		this.container = new Container();
		this.layerBack = new Container();
		this.layerFrame = new Container();
		this.layerFrameBg = new Container();
		this.layerGrid = new Container();
		this.layerAnimations = new Container();
		this.layerReels = new Container();
		this.layerFX = new Container();
		this.layerUI = new Container();
		this.layerOverlay = new Container();

		this.layerFrameBg.sortableChildren = false;
		this.layerGrid.sortableChildren = false;
		this.layerReels.sortableChildren = false;
		this.layerAnimations.sortableChildren = false;
		this.layerFX.sortableChildren = true;
		this.layerUI.sortableChildren = false;
		this.layerOverlay.sortableChildren = true;

		this.container.addChild(
			this.layerBack,
			this.layerFrameBg,
			this.layerGrid,
			this.layerReels,
			this.layerAnimations,
			this.layerFrame,
			this.layerFX,
			this.layerUI,
			this.layerOverlay
		);

		this.initialGrid = this.client.reelSet;
		this._spritePool = new SpritePool(this.assetLoader.symbolTextures, 150);
		this._objectPool = new ObjectPool(undefined, 200, 200, 200);
		this._gameUI = new gameInfo(client, assetLoader, app.screen.width, app.screen.height);
		this.hasAccelerated = false;
		this.winDetails = [];
		this.wildPositions = [];
	this.startMasterAnimationLoop();
		void this._usedPrivateMethods;
	}

	
	private safePlayMedia(media: any): void {
		try {
			if (media && typeof media.play === 'function') {
				const p = media.play();
				if (p && typeof p.catch === 'function') p.catch(() => {});
			}
		} catch {}
	}

	
	public get isBigWinPlaying(): boolean {
		try { return this.gameAnimations?.isBigWinPlaying ?? false; } catch { return false; }
	}

	public get objectPool(): ObjectPool {
		return this._objectPool;
	}

	private resetFreespinMode(): void {
		this._isInFreespin = spinType.NORMAL;
		this._freespinData = [];
		this._currentFreespinIndex = 0;
		this._remainingFreespins = 0;
		this._totalFreespins = 0;
		this._totalFreespinWin = 0;
		this._freespinOverlayShown = false;
		this._inputLocked = false;
	}

	public get isInFreespin(): spinType {
		return this._isInFreespin;
	}

	public get gridLines(): Graphics | null {
		return this._gridLines;
	}
	private startMasterAnimationLoop(): void {
		if (this.isAnimationLoopRunning) return;
		this.isAnimationLoopRunning = true;
		this.app.ticker.add(() => {
			this.animationCallbacks.forEach((callback) => {
				try { callback(); } catch (error) { console.error('Animation callback error:', error); }
			});
		});
	}

	public addAnimationCallback(callback: () => void): void {
		this.animationCallbacks.add(callback);
	}

	public removeAnimationCallback(callback: () => void): void {
		this.animationCallbacks.delete(callback);
	}

	private initializeCoordinateGrid(): void {
		if (this.isCoordinateGridInitialized) return;
		this.coordinateGrid = [];
		this._scatterGlowGfx = [];
		for (let y = 0; y < GameConstants.GRID_ROWS; y++) {
			this.coordinateGrid[y] = [];
			for (let x = 0; x < GameConstants.GRID_COLS; x++) {
				this.coordinateGrid[y][x] = {
					x: x * GameConstants.REEL_SIZE + GameConstants.REEL_SIZE / 2 + (this._frameSprite?.x || 0) - this.offsetX,
					y: y * GameConstants.REEL_SIZE + GameConstants.REEL_SIZE / 2 + (this._frameSprite?.y || 0) - this.offsetY
				};
			}
		}
		this.isCoordinateGridInitialized = true;
	}

	public getOptimizedCoordinates(x: number, y: number): { x: number, y: number } {
		if (!this.isCoordinateGridInitialized) {
			this.initializeCoordinateGrid();
		}
		if (x >= 0 && x < GameConstants.GRID_COLS && y >= 0 && y < GameConstants.GRID_ROWS) {
			return this.coordinateGrid[y][x];
		}
		return {
			x: x * GameConstants.REEL_SIZE + GameConstants.REEL_SIZE / 2 + (this._frameSprite?.x || 0) - this.offsetX,
			y: y * GameConstants.REEL_SIZE + GameConstants.REEL_SIZE / 2 + (this._frameSprite?.y || 0) - this.offsetY
		};
	}

	public async InitSpin(_isProcessingSpin: boolean, SpinT: spinType): Promise<void> {
		if (this._isSpinning || this.client.isProcessingSpin) return;
		if (this._inputLocked || this._freespinOverlayShown || this._isInFreespin !== spinType.NORMAL) return;
		this.clearScatterHighlights();
		this._scatterSlowdownSoundPlayed = false;
		this._scatterSlowdownHappened = false;

		this.gameInfo.hideBonusButton();
		this.gameInfo.removeWin();

		this._isWin = false;
		this._winAmount = 0;
		this.wildPositions = [];
		this.winDetails = [];
	
		this._superTurboActivated = false;
		this._superTurboBaseline = null;
		this.client.isProcessingSpin = true;
		this.isSpinning = true;
		this._amount = this.client.CurrentAmount;
		const get = await this.client.spin(this._amount, "default", SpinT);
		if (!get) {
			this.isSpinning = false;
			this.client.isProcessingSpin = false;
			this.gameInfo.showBonusButton();
			return;
		}
		this._isWin = get.data.win;
		if (this._isWin)
			this._winAmount = get.data.payout;
		if (get.data.details && Array.isArray(get.data.details)) {
			this.winDetails = this.convertBackendDetailsToWinDetails(get.data.details);
		} else if (get.data.details) {
			this.winDetails = get.data.details;
		}

		if (get.data.wildPositions) {
			this.wildPositions = get.data.wildPositions;
		}
		if (get.data.bonusRounds && get.data.bonusRounds.length > 0) {
			if (get.data.scatterCounts == 3)
				this._isInFreespin = spinType.BONUS;
			else if (get.data.scatterCounts >= 4)
				this._isInFreespin = spinType.BONUS_2;
			this._freespinData = get.data.bonusRounds;
			this._totalFreespins = get.data.bonusRounds.length;
			this._remainingFreespins = this._totalFreespins;
			this._currentFreespinIndex = 0;
			this._isMainSpinForFreespin = true;
		}
		const ReelSetType = SpinT == spinType.BONUS_BOOST ? "default_boost" : "default";
		this.drawGridAnimated(get.data.stopIndices, ReelSetType);
		const waitForCompletion = (): boolean => {
			if (!this.isSpinning) {
				if (this.gameAnimations) {
					if (!this.gameAnimations.isWildPlaying && !this.gameAnimations.isPaylinePlaying) {
						this.client.isProcessingSpin = false;
						this.gameInfo.showBonusButton();
						try { if (this.gameInfo?.isAutoSpinActive) this.gameInfo.decrementAutoSpin(); } catch {}
						return true;
					}
					return false;
				} else {
					this.client.isProcessingSpin = false;
					this.gameInfo.showBonusButton();
					try { if (this.gameInfo?.isAutoSpinActive) this.gameInfo.decrementAutoSpin(); } catch {}
					return true;
				}
			}
			return false;
		};

		const _waitForCompletion = (_deltaMS?: number) => {
			try {
				if (waitForCompletion()) {
					this.removeAnimationCallback(_waitForCompletion);
				}
			} catch (e) {
				console.error('waitForCompletion error', e);
				this.removeAnimationCallback(_waitForCompletion);
			}
		};
		this.addAnimationCallback(_waitForCompletion);
	}

	public onScatterSlowdownTriggered(): void {
		this._scatterSlowdownHappened = true;
		if (this._scatterSlowdownSoundPlayed) return;
		this._scatterSlowdownSoundPlayed = true;
		try {
			soundManager.play("scatter", { volume: 0.5 }).catch(() => {
				soundManager.play("scatter").catch(() => {});
			});
		} catch {}
	}
	private startScreen(): {startScreenContainer: Container, overlay: Graphics, pooledGraphics: Graphics[], pooledTexts: Text[], pooledSprites: Sprite[], pooledContainers: Container[], animCallbacks: Array<(deltaMS?: number) => void>, scrollViewport: Container | null, skipText: Text} 
	{
		const startScreenContainer = this.objectPool.acquireContainer();
		
		try { (startScreenContainer as any).sortableChildren = true; } catch {}
		try { (startScreenContainer as any).eventMode = 'static'; } catch {}
		try { (startScreenContainer as any).interactive = true; } catch {}
		try { (startScreenContainer as any).hitArea = { contains: (x:number, y:number) => x >= 0 && y >= 0 && x <= this.app.screen.width && y <= this.app.screen.height }; } catch {}
		const pooledGraphics: Graphics[] = [];
		const pooledTexts: Text[] = [];
		const pooledSprites: Sprite[] = [];
		const pooledContainers: Container[] = [];
		const animCallbacks: Array<(deltaMS?: number) => void> = [];
		const overlay = this.objectPool.acquireGraphics();
		pooledGraphics.push(overlay);
		try { overlay.rect(0, 0, this.app.screen.width, this.app.screen.height); } catch {}
		try { overlay.fill({color:0x000000, alpha: 1}); } catch {}
		overlay.alpha = 0.5;
		try { (overlay as any).eventMode = 'static'; } catch {}
		try { (overlay as any).interactive = true; } catch {}
		try { (overlay as any).cursor = 'pointer'; } catch {}
		overlay.zIndex = -100;
		try { (overlay as any).hitArea = { contains: (x:number, y:number) => x >= 0 && y >= 0 && x <= this.app.screen.width && y <= this.app.screen.height }; } catch {}

		let boxWidth = scalePx(400, this.app.screen.width, this.app.screen.height);
		let boxHeight = scalePx(500, this.app.screen.width, this.app.screen.height);
		const spacing = scalePx(25, this.app.screen.width, this.app.screen.height);
		if (GameConstants.IS_MOBILE) {
			boxWidth = Math.floor(this.app.screen.width * 0.92 * 0.8);
			boxHeight = Math.floor(this.app.screen.height * 0.68 * 0.6);
		}
		const createBox = (
			title: string,
			desc: string,
			texture: Texture,
		) => {
			const boxCont = this.objectPool.acquireContainer();
			const box = this.objectPool.acquireGraphics();
			pooledGraphics.push(box);
			try { box.roundRect(0, 0, boxWidth, boxHeight, 5); } catch {}
			try { box.fill({ color: GameConstants.COLORS.WHITE, alpha: 0.9 }); } catch {}
			try { box.stroke({color: GameConstants.COLORS.ORANGE_BRIGHT, width: 5}); } catch {}
			try { (box as any).eventMode = 'none'; } catch {}
			const titleText = this.objectPool.acquireText();
			pooledTexts.push(titleText);
			titleText.text = title;
			try { (titleText.style as any).fontFamily = "Bebas Neue"; } catch {}
			const titleSize = GameConstants.IS_MOBILE
				? Math.max(40, Math.floor(boxHeight * 0.085))
				: scalePx(50, this.app.screen.width, this.app.screen.height);
			try { (titleText.style as any).fontSize = titleSize; } catch {}
			try { (titleText.style as any).fill = GameConstants.COLORS.BLACK; } catch {}
			try { (titleText.style as any).align = "center"; } catch {}
			titleText.anchor.set(0.5);
			titleText.x = boxWidth / 2;
			titleText.y = boxHeight / 10;

			const image = this._spritePool.acquireTextureSprite(texture);
			pooledSprites.push(image);
			try { image.anchor.set(0, 0); } catch (e) {}
			image.width = boxWidth * 0.5;
			image.height = image.width;
			image.x = (boxWidth - image.width) / 2;
			image.y = titleText.y + scalePx(45, this.app.screen.width, this.app.screen.height);
			const descText = this.objectPool.acquireText();
			pooledTexts.push(descText);
			descText.text = desc;
			try { (descText.style as any).fontFamily = "Bebas Neue"; } catch {}
			
			const descSize = GameConstants.IS_MOBILE
				? Math.max(24, Math.floor(boxHeight * 0.045))
				: scalePx(25, this.app.screen.width, this.app.screen.height);
			try { (descText.style as any).fontSize = descSize; } catch {}
			try { (descText.style as any).fill = GameConstants.COLORS.BLACK; } catch {}
			try { (descText.style as any).align = "center"; } catch {}
			try {
				(descText.style as any).wordWrap = true;
				(descText.style as any).wordWrapWidth = GameConstants.IS_MOBILE ? boxWidth * 0.86 : boxWidth * 0.9;
			} catch {}
			descText.anchor.set(0.5, 1);
			descText.x = boxWidth / 2;
			descText.y = boxHeight - scalePx(50, this.app.screen.width, this.app.screen.height);
			descText.alpha = 0.8;

			
			try { (boxCont as any).eventMode = 'none'; } catch {}
			boxCont.addChild(box, titleText, image, descText);
			return boxCont;
		};
		const createGlobalVolatilityBox = (): Container => {
			const volContainer = this.objectPool.acquireContainer();

			const volWidth = scalePx(250, this.app.screen.width, this.app.screen.height);
			const volHeight = scalePx(60, this.app.screen.width, this.app.screen.height);

			const volBox = this.objectPool.acquireGraphics();
			pooledGraphics.push(volBox);
			try { volBox.roundRect(0, 0, volWidth, volHeight, 5); } catch {}
			try { volBox.fill({ color: GameConstants.COLORS.WHITE, alpha: 0.9 }); } catch {}
			try { volBox.stroke({color: GameConstants.COLORS.ORANGE_BRIGHT, width: 4}); } catch {}
			volContainer.addChild(volBox);

			const volIcon = this._spritePool.acquireTextureSprite(this.assetLoader.symbolTextures[8]);
			pooledSprites.push(volIcon);
			try { volIcon.anchor.set(0, 0); } catch (e) {}
			volIcon.width = volHeight * 0.6;
			volIcon.height = volHeight * 0.6;
			volIcon.x = scalePx(10, this.app.screen.width, this.app.screen.height);
			volIcon.y = (volHeight - volIcon.height) / 2;
			volContainer.addChild(volIcon);

			const volText = this.objectPool.acquireText();
			pooledTexts.push(volText);
			volText.text = "VOLATILITY: VERY HIGH";
			try { (volText.style as any).fontFamily = "Bebas Neue"; } catch {}
			try { (volText.style as any).fontSize = scalePx(22, this.app.screen.width, this.app.screen.height); } catch {}
			try { (volText.style as any).fill = 0x000000; } catch {}
			try { (volText.style as any).align = "left"; } catch {}
			volText.anchor.set(0, 0.5);
			volText.x = volIcon.x + volIcon.width + scalePx(10, this.app.screen.width, this.app.screen.height);
			volText.y = volHeight / 2;
			volContainer.addChild(volText);

			volContainer.pivot.set(volWidth / 2, 0);
			volContainer.x = this.app.screen.width / 2;

			return volContainer;
		};


		const box1 = createBox(
			"WOLF SYMBOLS",
			"The Wolf symbol expands to cover the reels and activates a powerful multiplier feature. Each win can be boosted up to 200x, bringing massive potential rewards!",
			this.assetLoader.symbolTextures[8],
		);
		const box2 = createBox(
			"FREE GAMES",
			"During Free Games, more Wolf symbols appear on the reels, increasing your chances of big wins. Trigger the bonus with 4 Scatters and every spin is guaranteed to feature a Wolf symbol!",
			this.assetLoader.symbolTextures[1],
		);
		const box3 = createBox(
			"MAX WIN",
			"Unleash the ultimate power of the Wolves! In the mysterious forest, every spin can lead to colossal wins. Watch the reels as the Wolves dominate, bringing the chance for legendary rewards!",
			this.assetLoader.maxImage!,
		);
		const totalWidth = boxWidth * 3 + spacing * 2;
		const startX = (this.app.screen.width - totalWidth) / 2;
		const centerY = (this.app.screen.height - boxHeight) / 2;

		
		const isMobile = GameConstants.IS_MOBILE;
		let scrollViewport: Container | null = null;
		let scrollContent: Container | null = null;
		if (!isMobile) {
			box1.x = startX;
			box2.x = startX + boxWidth + spacing;
			box3.x = startX + (boxWidth + spacing) * 2;
			box1.y = box2.y = box3.y = centerY;
		} else {
			scrollViewport = this.objectPool.acquireContainer();
			scrollContent = this.objectPool.acquireContainer();
			pooledContainers.push(scrollViewport, scrollContent);
			
			const maskGfx = this.objectPool.acquireGraphics();
			pooledGraphics.push(maskGfx);
			try { maskGfx.rect(0, 0, boxWidth, boxHeight); } catch {}
			try { maskGfx.fill({ color: 0x000000, alpha: 1 }); } catch {}
			scrollViewport.mask = maskGfx as any;
			scrollViewport.addChild(maskGfx);
			
			try { (maskGfx as any).eventMode = 'none'; } catch {}
			try { (scrollViewport as any).eventMode = 'static'; } catch {}
			try { (scrollContent as any).eventMode = 'none'; } catch {}
			
			scrollViewport.x = (this.app.screen.width - boxWidth) / 2;
			scrollViewport.y = centerY;
			
			const itemWidth = boxWidth + spacing;
			box1.x = 0; box1.y = 0;
			box2.x = itemWidth; box2.y = 0;
			box3.x = itemWidth * 2; box3.y = 0;
			scrollContent.addChild(box1, box2, box3);
			scrollViewport.addChild(scrollContent);
			
			const allowSwipe = true;
			scrollViewport.interactive = allowSwipe;
			let dragging = false;
			let downX = 0;
			let startContentX = 0;
			let currentIndex = 0;
			const maxIndex = 2;
			const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
			const snapTo = (idx: number) => {
				idx = clamp(idx, 0, maxIndex);
				currentIndex = idx;
				const targetX = -idx * itemWidth;
				if (!scrollContent) return;
				const startXPos = scrollContent.x;
				const duration = 200; 
				const startTime = performance.now();
				const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
				const step = () => {
					if (!scrollContent) { this.removeAnimationCallback(step as any); return; }
					const now = performance.now();
					const t = clamp((now - startTime) / duration, 0, 1);
					scrollContent.x = startXPos + (targetX - startXPos) * easeOut(t);
					if (t >= 1) this.removeAnimationCallback(step as any);
				};
				this.addAnimationCallback(step as any);
			};

			
			const minXLocal = -maxIndex * itemWidth;
			const maxXLocal = 0;

			let autoElapsed = 0;
			const AUTO_INTERVAL = 2800; 
			const stepAuto = (deltaMS?: number) => {
				if (!scrollContent) { this.removeAnimationCallback(stepAuto as any); return; }
				if (dragging) { autoElapsed = 0; return; }
				autoElapsed += (deltaMS ?? 16.6);
				if (autoElapsed >= AUTO_INTERVAL) {
					autoElapsed = 0;
					const next = (currentIndex + 1) % (maxIndex + 1);
					snapTo(next);
				}
			};
			this.addAnimationCallback(stepAuto as any);
			animCallbacks.push(stepAuto);
			if (allowSwipe) {
				const onDown = (e: any) => {
					if (!scrollContent) return;
					dragging = true;
					downX = e.global?.x ?? e.data?.global?.x ?? 0;
					startContentX = scrollContent.x;

					autoElapsed = 0;
					
					e.stopPropagation?.();
				};
				const onMove = (e: any) => {
					if (!dragging || !scrollContent) return;
					const gx = e.global?.x ?? e.data?.global?.x ?? 0;
					const dx = gx - downX;
					
					const nx = startContentX + dx;
					scrollContent.x = clamp(nx, minXLocal, maxXLocal);
					
				};
				const onUp = () => {
					if (!dragging) return;
					dragging = false;
					
					const threshold = Math.min(60, itemWidth * 0.15);
					let idx = currentIndex;
					const moved = (scrollContent?.x ?? 0) - startContentX;
					if (moved < -threshold) idx = clamp(currentIndex + 1, 0, maxIndex);
					else if (moved > threshold) idx = clamp(currentIndex - 1, 0, maxIndex);
					else idx = clamp(Math.round(-(scrollContent?.x ?? 0) / itemWidth), 0, maxIndex);
					snapTo(idx);
				};
				scrollViewport.on('pointerdown', onDown);
				scrollViewport.on('pointermove', onMove);
				scrollViewport.on('pointerup', onUp);
				scrollViewport.on('pointerupoutside', onUp);
				scrollViewport.on('pointercancel', onUp);
			}
		}
	const logo = this._spritePool.acquireTextureSprite(Texture.from("assets/gamelogo.png"));
	pooledSprites.push(logo);
	
	logo.anchor.set(0.5, 0);
	logo.x = this.app.screen.width / 2;
	const topMargin = scalePx(24, this.app.screen.width, this.app.screen.height);
	logo.y = topMargin;
	try { (logo as any).eventMode = 'none'; } catch {}
	
	try {
		const cfg = LayoutManager.instance.current.start?.logo;
		if (cfg) {
			if (cfg.asset && cfg.asset !== 'assets/gamelogo.png') {
				try { logo.texture = Texture.from(cfg.asset); } catch {}
			}
			logo.x = cfg.x ?? logo.x;
			logo.y = cfg.y ?? logo.y;
			logo.anchor.set(cfg.anchorX ?? 0.5, cfg.anchorY ?? 0);
			if (cfg.scale) logo.scale.set(cfg.scale);
		}
	} catch {}
		const volatilityDisplay = createGlobalVolatilityBox();
		try { (volatilityDisplay as any).eventMode = 'none'; } catch {}
		

	
	volatilityDisplay.y = centerY + boxHeight + scalePx(20, this.app.screen.width, this.app.screen.height);

	
	const skipText = this.objectPool.acquireText();
	pooledTexts.push(skipText);
	skipText.text = GameConstants.IS_MOBILE ? "TAP TO SKIP" : "CLICK TO SKIP";
	try { (skipText.style as any).fontFamily = "Bebas Neue"; } catch {}
	
	try { (skipText.style as any).fontSize = scalePx(36, this.app.screen.width, this.app.screen.height); } catch {}
	try { (skipText.style as any).fill = 0xFFFFFF; } catch {}
	try { (skipText.style as any).align = "center"; } catch {}
	try { (skipText.style as any).fontWeight = '700'; } catch {}
	skipText.anchor.set(0.5, 0);
	skipText.x = this.app.screen.width / 2;
	
	skipText.y = volatilityDisplay.y + scalePx(110, this.app.screen.width, this.app.screen.height);
	skipText.alpha = 0.95;
	try { (skipText as any).eventMode = 'static'; } catch {}
	try { (skipText as any).interactive = true; } catch {}
	try { (skipText as any).cursor = 'pointer'; } catch {}

	
	try { (overlay as any).zIndex = -100; } catch {}
	try { (volatilityDisplay as any).zIndex = 0; } catch {}
	try { (logo as any).zIndex = 0; } catch {}
	try { (scrollViewport as any).zIndex = 1; } catch {}
	try { (box1 as any).zIndex = 1; } catch {}
	try { (box2 as any).zIndex = 1; } catch {}
	try { (box3 as any).zIndex = 1; } catch {}
	try { (skipText as any).zIndex = 10; } catch {}

	startScreenContainer.addChild(overlay);
	startScreenContainer.addChild(volatilityDisplay);
	startScreenContainer.addChild(logo);
	if (isMobile && scrollViewport) {
		startScreenContainer.addChild(scrollViewport);
	} else {
		startScreenContainer.addChild(box1);
		startScreenContainer.addChild(box2);
		startScreenContainer.addChild(box3);
	}

	try { (box1 as any).eventMode = 'none'; } catch {}
	try { (box2 as any).eventMode = 'none'; } catch {}
	try { (box3 as any).eventMode = 'none'; } catch {}
	try { (scrollViewport as any).eventMode = 'static'; } catch {}

	
	try { startScreenContainer.addChild(skipText); } catch {}
	return {startScreenContainer, overlay, pooledGraphics, pooledTexts, pooledSprites, pooledContainers, animCallbacks, scrollViewport, skipText};
	}
	public setup(): Promise<void> {
		this.app.renderer.background.color = GameConstants.COLORS.BACKGROUND;
		this.app.stage.addChild(this.container);
		this.initBackground();

		return new Promise((resolve) => {
			const {startScreenContainer, overlay, pooledGraphics, pooledTexts, pooledSprites, pooledContainers, animCallbacks, skipText} = this.startScreen();
			let proceeded = false;
			const proceed = async () => {
				if (proceeded) return;
				proceeded = true;
				
				try { void this.assetLoader.soundLoader(); } catch {}
				try { void this.assetLoader.initializeAudioContext(); } catch {}
				
				try { setTimeout(() => { this._gameUI.startMusic().catch(() => {}); }, 0); } catch {}
				this._gameUI.SpinButtonStatic();
				this.spinButton = this._gameUI.spinButtonStatic;
				
				if (!this._mobileAccelListenerReady) {
					try {
						this.container.interactive = true; 
						this.container.on('pointerdown', (ev: any) => {
							if (!this.isSpinning) return;
							if (this.isTapOnUIButton(ev)) return;
							this.handleAccelerateTap();
						});
						this._mobileAccelListenerReady = true;
					} catch {}
				}
				
				try {
					if (this.spinButton) {
						this.spinButton.interactive = true;
						this.spinButton.on('pointerdown', () => {
							if (this.isSpinning) this.handleAccelerateTap();
						});
					}
				} catch {}
				this.drawFrameBackground();
				this.drawGridLines();
				this.setupGameInfo();
				this.initializeAnimations();
				try { if (startScreenContainer.parent) this.app.stage.removeChild(startScreenContainer); } catch {}
				try { this.objectPool.releaseContainer(startScreenContainer); } catch {}
				try { pooledGraphics.forEach(g => this.objectPool.releaseGraphics(g)); } catch {}
				try { pooledTexts.forEach(t => this.objectPool.releaseText(t)); } catch {}
				try { pooledSprites.forEach(s => this._spritePool.release(s)); } catch {}
				try { pooledContainers?.forEach(c => this.objectPool.releaseContainer(c)); } catch {}
				try { animCallbacks?.forEach(cb => this.removeAnimationCallback(cb)); } catch {}
				resolve();
			};
			
			try { (overlay as any).once?.('pointerdown', proceed); } catch { overlay.on("pointerdown", proceed); }
			try { (startScreenContainer as any).once?.('pointerdown', () => proceed()); } catch { startScreenContainer.on("pointerdown", () => { proceed(); }); }
			try { (skipText as any).once?.('pointerdown', () => proceed()); } catch { (skipText as any).on?.('pointerdown', () => proceed()); }
			this.app.stage.addChild(startScreenContainer);
		});
	}

	private initializeAnimations(): void {
		if (this._frameSprite) {
			this.gameAnimations = new GameAnimations(
				this.layerAnimations,
				this.app,
				this.client,
				this.assetLoader,
				this._frameSprite,
				this.initialGrid,
				this,
				this.layerOverlay
			);
		}
	}

	
	private isTapOnUIButton(ev: any): boolean {
		try {
			const target = ev?.target ?? ev?.currentTarget ?? null;
			if (!target) return false;
			
			if ((this.layerUI && this.isDescendantOf(target, this.layerUI)) ||
				(this.layerOverlay && this.isDescendantOf(target, this.layerOverlay))) {
				return true;
			}
			
			if (this.spinButton && this.isDescendantOf(target, this.spinButton)) return true;
		} catch {}
		return false;
	}

	private isDescendantOf(node: any, ancestor: any): boolean {
		try {
			let cur = node;
			while (cur) {
				if (cur === ancestor) return true;
				cur = cur.parent;
			}
		} catch {}
		return false;
	}

	
	private handleAccelerateTap(): void {
		if (!this.isSpinning) return;
		if (this._superTurboActivated) return;
		if (this._superTurboBaseline === null) {
			this._superTurboBaseline = this._userTurboLevel;
			if (this._turboRestoreLevel === null) this._turboRestoreLevel = this._userTurboLevel;
		}
		this.superTurboAccelerate();
		this._superTurboActivated = true;
	}

	private setupGameInfo(): void {
			const gameInfoContainer = this._gameUI.getContainer();
			this.layerUI.addChild(gameInfoContainer);
	}

	private clearGrid() {
		if (this.gameAnimations) {
			this.gameAnimations.clearAllAnimations();
		}
		this.reelAnimators.forEach(animator => {
			animator.destroy();
		});
		this.reelAnimators = [];
		this.currentSprites.forEach((row) => {
		row.forEach((sprite) => {
				if (sprite.parent) { try { sprite.parent.removeChild(sprite); } catch {} }
			this._spritePool.release(sprite);
		});
		});
		this.currentSprites = [];

		
		try {
			const toRemove = this.layerReels.children.filter((c) => c instanceof Sprite) as Sprite[];
			toRemove.forEach((s) => { try { this.layerReels.removeChild(s); } catch {} try { s.destroy(); } catch {} });
		} catch {}
	}
	private drawFrameBackground(): void {
		if (!this.assetLoader.frame_texture || !this.assetLoader.frame_texture_2) {
			console.error("Frame textures not loaded.");
			return;
		}

		const screenWidth = this.app.screen.width;
		const screenHeight = this.app.screen.height;

		const frameWidth = GameConstants.getFrameWidth();
		const frameHeight = GameConstants.getFrameHeight();

		const innerFrameWidth = GameConstants.getInnerFrameWidth();
		const innerFrameHeight = GameConstants.getInnerFrameHeight();

		this._frameSprite = new Sprite(this.assetLoader.frame_texture);
		this._framebg = new Sprite(this.assetLoader.frame_texture_2);

		this._frameSprite.anchor.set(0.5);
		this._framebg.anchor.set(0.5);

		

		this._frameSprite.x = screenWidth / 2;
		this._frameSprite.y = screenHeight / 2;

		this._framebg.x = screenWidth / 2;
		this._framebg.y = screenHeight / 2;

		this._frameSprite.width = frameWidth;
		this._frameSprite.height = frameHeight;

		this._framebg.width = innerFrameWidth;
		this._framebg.height = innerFrameHeight;

		try { this.layerFrameBg.addChild(this._framebg); } catch {}
		try { this.layerFrame.addChild(this._frameSprite); } catch {}
	}

	public drawGridLines(): void {
		if (!this._frameSprite) {
			console.error("Frame sprite not initialized.");
			return;
		}
	const _gridLines = this.objectPool.acquireGraphics();

		for (let c = 1; c < GameConstants.GRID_COLS; c++) {
			const x = c * GameConstants.REEL_SIZE + this._frameSprite.x - this.offsetX;
			const startY = this._frameSprite.y - this.offsetY;
			const endY = this._frameSprite.y + this.offsetY;

			_gridLines.moveTo(x, startY);
			_gridLines.lineTo(x, endY);
		}

		for (let r = 1; r < GameConstants.GRID_ROWS; r++) {
			const y = r * GameConstants.REEL_SIZE + this._frameSprite.y - this.offsetY;
			const startX = this._frameSprite.x - this.offsetX;
			const endX = this._frameSprite.x + this.offsetX;

			_gridLines.moveTo(startX, y);
			_gridLines.lineTo(endX, y);
		}
		_gridLines.stroke({ color: GameConstants.GRID_LINES.COLOR, width: GameConstants.GRID_LINES.WIDTH, alpha: GameConstants.GRID_LINES.ALPHA });
		this._gridLines = _gridLines;
		this.layerGrid.addChild(_gridLines);
	}

	public drawGrid(defaultGrid: number[][]): void {
		this.initialGrid = [];

		if (!defaultGrid || defaultGrid.length == 0) return;

		for (let y = 0; y < GameConstants.GRID_COLS; y++)
		{
			for (let x = 0; x < GameConstants.GRID_ROWS; x++)
			{
				const symbolId = defaultGrid[y][x];
				if (!this.initialGrid[y]) this.initialGrid[y] = [];
				this.initialGrid[y][x] = symbolId;
				const symbolSprite = this._spritePool.get(symbolId);

				symbolSprite.anchor.set(0.5);
				symbolSprite.x = x * GameConstants.REEL_SIZE + GameConstants.REEL_SIZE / 2 + this._frameSprite!.x - this.offsetX;
				symbolSprite.y = y * GameConstants.REEL_SIZE + GameConstants.REEL_SIZE / 2 + this._frameSprite!.y - this.offsetY;
				symbolSprite.width = GameConstants.REEL_SIZE * GameConstants.SYMBOL_SIZE_RATIO;
				symbolSprite.height = GameConstants.REEL_SIZE * GameConstants.SYMBOL_SIZE_RATIO;
				this.layerReels.addChild(symbolSprite);

				if (!this.currentSprites[x]) this.currentSprites[x] = [];
				this.currentSprites[x][y] = symbolSprite;
			}
		}
		
		return;
	}

	public updateinitialGrid(reelSet: any, stopIndex: number[]): void {
		for (let x = 0; x < GameConstants.GRID_COLS; x++) {
			const reel = reelSet.reels[x];
			const reeldata = reel.symbols;
			const stpIndex = stopIndex[x];
			for (let y = 0; y < GameConstants.GRID_ROWS; y++)
			{
				const index = (stpIndex + y) % reeldata.length;
				const symbolId = reeldata[index];
				if (!this.initialGrid[y]) this.initialGrid[y] = [];
				this.initialGrid[y][x] = symbolId;
			}
		}
	}

	public drawGridAnimated(stopIndex: number[], reelSetType: string): void {
		
		this.clearScatterHighlights();
		this.clearGrid();

		const reelSet = this.client.reelSet.reelSets.find((set: any) => set.name === reelSetType);
		if (!reelSet || !this.initialGrid) return;
		this._currentReelSetType = reelSetType;
		this.reelAnimators = [];
		this.hasAccelerated = false;

		for (let x = 0; x < GameConstants.GRID_COLS; x++) {
			const reel = reelSet.reels[x];
			const animator = new ReelAnimator(
				this.layerReels,
				this._spritePool,
				reel.symbols,
				x,
				this.client,
				stopIndex[x],
				this.initialGrid,
				this._frameSprite!.x,
				this._frameSprite!.y,
				this
			);

			this.reelAnimators.push(animator);
			this.currentSprites[x] = animator.Symbols;
		}
		this.updateinitialGrid(reelSet, stopIndex);
		if (this._turboLevel > 0)
		{
			this.reelAnimators.forEach((animator, index) => {
				setTimeout(() => {
					animator.startSpin(() => {
						this.checkAllReelsStoppedTurbo();
					});
				}, index * GameConstants.TURBO_ANIMATOR_DELAY);
			});
		}
		else
			this.waitForAllAnimationsComplete();
	}

	private checkAllReelsStoppedTurbo(): void {
		const allStopped = this.reelAnimators.every(animator => !animator.isSpinning);
		if (allStopped) {
			this.onSpinComplete();
		}
	}

	private onSpinComplete(): void {
		const reelSetToUse = this._currentReelSetType;
		const reelSet = this.client.reelSet.reelSets.find((set: any) => set.name === reelSetToUse);
		if (reelSet) {
			this.updateinitialGrid(reelSet, this.reelAnimators.map(animator => animator.getStopIndex));
		}
		if (this.gameAnimations) {
			this.gameAnimations.updateInitialGrid(this.initialGrid);
		}
		
		this.handleScatterHighlightsAfterStop();
		
		try {
			const scatters = this.countScattersOnGrid();
			const threshold = (GameConstants.FREESPIN?.MIN_SCATTERS_TO_TRIGGER ?? 3);
			
			if (
				this._scatterSlowdownHappened &&
				scatters < threshold &&
				(this._isInFreespin === spinType.NORMAL || this._isInFreespin === spinType.BONUS_BOOST)
			) {
				soundManager.play("scattermiss", { volume: 0.5 }).catch(() => {
					soundManager.play("scattermiss").catch(() => {});
				});
			}
		} catch {}
		if (!this._isWin && ((this._isInFreespin == spinType.NORMAL) ||
					(this._isInFreespin == spinType.BONUS_BOOST ))) {
			this._isSpinning = false;
			this.restoreTurboIfNeeded();
			this._superTurboActivated = false;
			this._superTurboBaseline = null;
			return;
		}
		if (this._isWin && this.wildPositions.length > 0) {
			setTimeout(() => {
				this.gameAnimations?.playWildAnimations(this.wildPositions, () => {
					this.playPaylineAnimations();
				});
				this._isSpinning = false;
				this.restoreTurboIfNeeded();
				this._superTurboActivated = false;
				this._superTurboBaseline = null;
			}, GameConstants.getWildDelay(this._turboLevel));
		} else {
			this.playPaylineAnimations();
			this._isSpinning = false;
			this.restoreTurboIfNeeded();
			this._superTurboActivated = false;
			this._superTurboBaseline = null;
		}
	}

	private convertBackendDetailsToWinDetails(groupedSymbols: GroupedSymbol[]): WinDetail[] {
		const winDetails: WinDetail[] = [];
		const sortedGroups = [...groupedSymbols].sort((a, b) => a.totalPayout - b.totalPayout);
		for (const group of sortedGroups) {
			if (group.matches.length >= 3) {
				const allPositions: number[][] = [];
				for (const match of group.matches) {
					allPositions.push(...match.positions);
				}
				winDetails.push({
					positions: allPositions,
					symbol: group.symbol,
					payout: group.totalPayout,
					isGrouped: true,
					groupedMatches: group.matches
				});
			} else {
				const sortedMatches = [...group.matches].sort((a, b) => 
					(a.payout * a.multiplier) - (b.payout * b.multiplier)
				);
				for (const match of sortedMatches) {
					winDetails.push({
						positions: match.positions,
						symbol: group.symbol,
						payout: match.payout,
						lineIndex: match.lineIndex,
						count: match.count,
						multiplier: match.multiplier,
						isGrouped: false
					});
				}
			}
		}
		return winDetails;
	}

	private playPaylineAnimations(): void {
		if (!this.isInFreespin)
		{
			const win = (this._winAmount / this.client.minAmountCredit) * this.client.minCreditCurrency;
			this.gameInfo.showWin(win);
		}
		if (this.winDetails && this.winDetails.length > 0) {
			this.gameAnimations?.playPaylineAnimations(this.winDetails, this.wildPositions, () => {
				if (this._isInFreespin != spinType.NORMAL &&
					this._isInFreespin != spinType.BONUS_BOOST) {
					if (this._isMainSpinForFreespin) {
						this._isMainSpinForFreespin = false;
						this.startFreespinSequence();
					} else {
						this.showFreespinWinAndContinue();
					}
				} else {
					this.enableSpinButtonAfterDelay();
				}
			});
		} else {
			if (this._isInFreespin != spinType.NORMAL &&
				this._isInFreespin != spinType.BONUS_BOOST) {
				if (this._isMainSpinForFreespin) {
					this._isMainSpinForFreespin = false;
					this.startFreespinSequence();
				} else {
					this.showFreespinWinAndContinue();
				}
			} else {
				this.enableSpinButtonAfterDelay();
			}
		}
	}

	private onFreespinComplete(): void {
		if (this._freespinCompletionPending) {
			return;
		}

		this._freespinCompletionPending = true;
		this._remainingFreespins--;
		this._currentFreespinIndex++;

	
	const autoActive = !!this.gameInfo?.isAutoSpinActive;
	const delay = autoActive ? Math.min(80, GameConstants.getSpinButtonDelay(this._turboLevel)) : GameConstants.getSpinButtonDelay(this._turboLevel);
	setTimeout(() => {
			this._freespinCompletionPending = false; 
			this.playNextFreespin();
		}, delay);
	}

	private waitForAllAnimationsComplete(): void {
		let hasEverStarted = false;
		const checkAnimations = () => {
			const hasStartedAnimations = this.reelAnimators.some(animator => animator.isReelSpinning);
			const allComplete = this.reelAnimators.every(animator => !animator.isReelSpinning);

			if (!hasStartedAnimations && !hasEverStarted && this.reelAnimators.length > 0) {
				return;
			}
			if (hasStartedAnimations) {
				hasEverStarted = true;
			}
			if (allComplete && this.reelAnimators.length > 0 && hasEverStarted) {
				if (this.gameAnimations) {
					this.gameAnimations.updateInitialGrid(this.initialGrid);
				}
				this.handleScatterHighlightsAfterStop();
				try {
					const scatters = this.countScattersOnGrid();
					const threshold = (GameConstants.FREESPIN?.MIN_SCATTERS_TO_TRIGGER ?? 3);
					if (
						this._scatterSlowdownHappened &&
						scatters < threshold &&
						(this._isInFreespin === spinType.NORMAL || this._isInFreespin === spinType.BONUS_BOOST)
					) {
						soundManager.play("scattermiss", { volume: 0.2 }).catch(() => {
							soundManager.play("scattermiss").catch(() => {});
						});
					}
				} catch {}
				if (!this._isWin &&
					((this._isInFreespin == spinType.NORMAL) ||
					(this._isInFreespin == spinType.BONUS_BOOST )))
				{
					this._isSpinning = false;
					this.restoreTurboIfNeeded();
					this.removeAnimationCallback(checkAnimations);
					return;
				}
				if (this.wildPositions.length > 0) {
					setTimeout(() => {
						this.gameAnimations?.playWildAnimations(this.wildPositions, () => {
							this.playPaylineAnimations();
						});
						this._isSpinning = false;
						this.restoreTurboIfNeeded();
					}, GameConstants.getWildDelay(this._turboLevel));
				} else {
					this.playPaylineAnimations();
					this._isSpinning = false;
					this.restoreTurboIfNeeded();
				}
				this.removeAnimationCallback(checkAnimations);
			}
		};
		this.addAnimationCallback(checkAnimations);
	}

	
	private isScatterSymbol(sym: any): boolean {
		try { return String(sym) === String(GameConstants.SYMBOL_IDS.SCATTER); } catch { return false; }
	}

	private countScattersOnGrid(): number {
		let count = 0;
		for (let x = 0; x < GameConstants.GRID_COLS; x++) {
			const col = this.currentSprites?.[x];
			if (!col) continue;
			for (let y = 0; y < GameConstants.GRID_ROWS; y++) {
				const sp = col?.[y];
				if (!sp) continue;
				try {
					const sid = (sp as any).__symbolId;
					if (String(sid) === String(GameConstants.SYMBOL_IDS.SCATTER)) count++;
				} catch {}
			}
		}
		return count;
	}

	private applyScatterOneShot(): void {
		
		for (let x = 0; x < GameConstants.GRID_COLS; x++) {
			for (let y = 0; y < GameConstants.GRID_ROWS; y++) {
				const sprite = this.currentSprites?.[x]?.[y];
				if (!sprite) continue;
				const isScatter = this.isScatterSymbol(this.initialGrid?.[y]?.[x]);
				if (!isScatter) {
					try { (sprite as any).tint = 0xFFFFFF; } catch {}
				}
			}
		}

		
		this._scatterHighlightSprites = [];
		for (let x = 0; x < GameConstants.GRID_COLS; x++) {
			const col = this.currentSprites?.[x];
			if (!col) continue;
			for (let y = 0; y < GameConstants.GRID_ROWS; y++) {
				const sprite = col?.[y];
				if (!sprite) continue;
				try {
					const sid = (sprite as any).__symbolId;
					if (String(sid) === String(GameConstants.SYMBOL_IDS.SCATTER)) {
						try { (sprite as any).__baseScaleX = sprite.scale.x; (sprite as any).__baseScaleY = sprite.scale.y; } catch {}
						this._scatterHighlightSprites.push(sprite);
					}
				} catch {}
			}
		}
		if (this._scatterHighlightSprites.length === 0) return;
		
		const durationUp = 320;    
		const durationDown = 300;  
		const targetScale = 1.15;  
		const startTime = Date.now();
		const phase1 = () => {
			const t = Math.min((Date.now() - startTime) / durationUp, 1);
			const ease = 1 - Math.pow(1 - t, 3);
			for (const sp of this._scatterHighlightSprites) {
				if (!sp?.parent) continue;
				try {
					const bx = (sp as any).__baseScaleX ?? sp.scale.x;
					const by = (sp as any).__baseScaleY ?? sp.scale.y;
					sp.scale.set(bx * (1 + (targetScale - 1) * ease), by * (1 + (targetScale - 1) * ease));
					(sp as any).zIndex = 150;
				} catch {}
			}
			if (t >= 1) {
				this.removeAnimationCallback(phase1);
				const start2 = Date.now();
				const phase2 = () => {
					const t2 = Math.min((Date.now() - start2) / durationDown, 1);
					const ease2 = 1 - Math.pow(1 - t2, 3);
					for (const sp of this._scatterHighlightSprites) {
						if (!sp?.parent) continue;
						try {
							const bx = (sp as any).__baseScaleX ?? sp.scale.x;
							const by = (sp as any).__baseScaleY ?? sp.scale.y;
							
							sp.scale.set(bx * (targetScale - (targetScale - 1) * ease2), by * (targetScale - (targetScale - 1) * ease2));
						} catch {}
					}
					if (t2 >= 1) {
						this.removeAnimationCallback(phase2);
						
						this.clearScatterHighlights();
					}
				};
				this.addAnimationCallback(phase2);
			}
		};
		this.addAnimationCallback(phase1);
	}

	private clearScatterHighlights(): void {
		for (const sp of this._scatterHighlightSprites) {
			try {
				if ((sp as any).__baseTint !== undefined) (sp as any).tint = (sp as any).__baseTint;
				if ((sp as any).__baseScaleX !== undefined && (sp as any).__baseScaleY !== undefined) {
					sp.scale.set((sp as any).__baseScaleX, (sp as any).__baseScaleY);
				}
			} catch {}
		}
		
		for (const g of this._scatterGlowGfx) {
			try { if (g.parent) g.parent.removeChild(g); } catch {}
			try { this.objectPool.releaseGraphics(g); } catch {}
		}
		this._scatterHighlightSprites = [];
		this._scatterGlowGfx = [];
	}

	private handleScatterHighlightsAfterStop(): void {
		const scatters = this.countScattersOnGrid();
		const threshold = (GameConstants.FREESPIN?.MIN_SCATTERS_TO_TRIGGER ?? 3);
		const willTrigger = scatters >= threshold;
		
		if (willTrigger) {
			this.applyScatterOneShot();
		} else {
			this.clearScatterHighlights();
		}
	}
	public initBackground(): void {
        const backgroundTexture = this.assetLoader.backgroundFrames[0];
        if (!backgroundTexture) {
            return;
        }
        this._backgroundAnimation = new Sprite(backgroundTexture);
		this._backgroundAnimation.x = 0;
		this._backgroundAnimation.y = 0;

		try { this.layerBack.addChild(this._backgroundAnimation); } catch {}
		this.layoutBackgroundForDevice();
    }

	private layoutBackgroundForDevice(): void {
		if (!this._backgroundAnimation) return;
		try { (this._backgroundAnimation as any).mask = null; } catch {}

		if (GameConstants.IS_MOBILE) {
			
			const tex: any = this._backgroundAnimation.texture;
			const res: any = tex?.source?.resource;
			const vidW = (tex?.width && tex.width > 0) ? tex.width : (res?.videoWidth || 1080);
			const vidH = (tex?.height && tex.height > 0) ? tex.height : (res?.videoHeight || 1920);
			const scale = Math.max(this.app.screen.width / (vidW || 1), this.app.screen.height / (vidH || 1));
			this._backgroundAnimation.anchor.set(0, 0);
			try { this._backgroundAnimation.scale.set(scale); } catch {}
			this._backgroundAnimation.x = 0; 
			const drawH = (vidH || 0) * scale;
			this._backgroundAnimation.y = Math.floor((this.app.screen.height - drawH) / 2);
		} else {
			
			this._backgroundAnimation.anchor.set(0, 0);
			this._backgroundAnimation.width = this.app.screen.width;
			this._backgroundAnimation.height = this.app.screen.height;
		}
	}

	public playNormalBackground(): void {
		if (!this._backgroundAnimation) return;
		const normalBackgroundTexture = this.assetLoader.backgroundFrames[0];
		if (!normalBackgroundTexture) return;

		const currentVideoSource = this._backgroundAnimation.texture.source.resource;
		if (currentVideoSource instanceof HTMLVideoElement) {
			currentVideoSource.pause();
		}

		this._backgroundAnimation.texture = normalBackgroundTexture;
		this.layoutBackgroundForDevice();

		const newVideoSource = normalBackgroundTexture.source.resource;
		if (newVideoSource instanceof HTMLVideoElement) {
			
			try { newVideoSource.muted = true; } catch {}
			try { (newVideoSource as any).playsInline = true; } catch {}
			this.safePlayMedia(newVideoSource);
		}

		if (this._animatedSpinButton) {
			this._animatedSpinButton.visible = true;
		}
		if (this.spinButton) {
			this.spinButton.visible = true;
		}
	}

	public playBonusBackground(): void {
		if (!this._backgroundAnimation) return;

		const bonusBackgroundTexture = this.assetLoader.bonusBackgroundFrames[0];

		if (!bonusBackgroundTexture) return;

		const currentVideoSource = this._backgroundAnimation.texture.source.resource;
		if (currentVideoSource instanceof HTMLVideoElement) {
			currentVideoSource.pause();
		}

		this._backgroundAnimation.texture = bonusBackgroundTexture;
		this.layoutBackgroundForDevice();

		const newVideoSource = bonusBackgroundTexture.source.resource;
		if (newVideoSource instanceof HTMLVideoElement) {
			try { newVideoSource.muted = true; } catch {}
			try { (newVideoSource as any).playsInline = true; } catch {}
			this.safePlayMedia(newVideoSource);
		}

		if (this._animatedSpinButton) {
			this._animatedSpinButton.visible = false;
		}
		this.hideSpinButton();

	}

	public reel_sounds_effects(name: string): void {
		try {
			soundManager.play(name, { volume: 0.5 }).catch(() => {
				soundManager.play(name).catch(() => {
					console.warn('Could not play sound:', name);
				});
			});
		} catch (e) {
			console.warn('reel_sounds_effects failed', e);
		}
	}

	public stopBackgroundAnimation(): void {
		if (this._backgroundAnimation) {
			const res = this._backgroundAnimation.texture?.source?.resource as any;
			if (res && typeof res.pause === "function") {
				try { res.pause(); } catch {}
			}
			try { this.container.removeChild(this._backgroundAnimation); } catch {}
			this._backgroundAnimation.destroy();
			this._backgroundAnimation = null;
		}
		if (this._bgMask) {
			try { if (this._bgMask.parent) this._bgMask.parent.removeChild(this._bgMask); } catch {}
			try { this._bgMask.destroy(); } catch {}
			this._bgMask = null;
		}
	}

	public get reelCount(): number {
		return this.client.reelCount;
	}
	public get spinButtonStatic(): Sprite | null {
		return this.spinButton;
	}
	public get animatedSpinButton(): AnimatedSprite | null {
		return this._animatedSpinButton;
	}
	public get isSpinning(): boolean {
		return this._isSpinning;
	}
	public set isSpinning(value: boolean) {
		this._isSpinning = value;
	}
	public get frameSprite(): Sprite | null {
		return this._frameSprite;
	}
	public get framebg(): Sprite | null {
		return this._framebg;
	};
	public get getcSprites(): Sprite[][] {
		return this.currentSprites;
	}
	public setcSprites(value: Sprite[], index: number) {
		this.currentSprites[index] = value;
	}

	public get gameInfo(): gameInfo {
		return this._gameUI;
	}

	public updateBalance(balance: number): void {
		this._gameUI.setBalance(balance);
	}

	public updateBet(bet: number): void {
		this._gameUI.setBet(bet);
	}

	public updateWin(win: number): void {
		this._gameUI.showWin(win);
	}

	public startWinBarIncrement(paylineWin: number, multiplier: number = 1): void {
		if (this._gameUI) {
			this._gameUI.addToWinAmount(paylineWin, multiplier);
		}
	}

	public accelerateAllReels(force: boolean = false): void {
		if (this.hasAccelerated && !force) {
			return;
		}
		this.reelAnimators.forEach(animator => {
			animator.accelerateSpin();
		});
		this.hasAccelerated = true;
	}

	
	public forceSuperTurbo(): void {
		if (!this.isSpinning) return;
		if (this._superTurboActivated) return;
		if (this._turboLevel == 1) return;
		if (this._superTurboBaseline === null) {
			this._superTurboBaseline = this._userTurboLevel;
			if (this._turboRestoreLevel === null) this._turboRestoreLevel = this._userTurboLevel;
		}
		this.superTurboAccelerate();
		this._superTurboActivated = true;
	}

	
	private superTurboAccelerate(): void {
		
		if (this._turboRestoreLevel === null) this._turboRestoreLevel = this._userTurboLevel;
		try { this.setTurboLevelTransient(2); } catch {}
		
		try { this.gameAnimations?.accelerateAnimations(); } catch {}
		
		this.reelAnimators.forEach(animator => {
			
			try { animator.setTurboLevel(2); } catch {}
			try { animator.accelerateSpin(); } catch {}
		});
		this.hasAccelerated = true;
	}

	private restoreTurboIfNeeded(): void {
		if (this._turboRestoreLevel !== null) {
			const target = this._turboRestoreLevel;
			this._turboRestoreLevel = null;
			try { this.setTurboLevel(target); } catch {}
			this._userTurboLevel = target;
		}
	}

	public enableSpinButton(): void {
		if (this.spinButton) {
			this.spinButton.interactive = true;
			this.spinButton.alpha = 1.0;
		}
		this.client.gameDone();
	}

	private enableSpinButtonAfterDelay(): void {
		
		const autoActive = !!this.gameInfo?.isAutoSpinActive;
		const delay = autoActive ? 0 : GameConstants.getSpinButtonDelay(this._turboLevel);
		setTimeout(() => {
			this.enableSpinButton();
		}, delay);

		const slowAnimationDelay = GameConstants.getSlowAnimationDelay(this._turboLevel);
		setTimeout(() => {
			if (this.gameAnimations && this.gameAnimations.storedWinDetailsCount > 0 && !this.gameInfo?.isAutoSpinActive) {
				this.gameAnimations.playSlowDetailedPaylineAnimation();
			}
		}, slowAnimationDelay);
	}

	public setTurboMode(enabled: boolean): void {
		this.setTurboLevel(enabled ? 2 : 0);
	}

	public setTurboLevel(turboLevel: number): void {
		this._turboLevel = Math.max(0, Math.min(2, turboLevel));
		
		this._userTurboLevel = this._turboLevel;
		this._turboRestoreLevel = null;

		this.reelAnimators.forEach(animator => {
			animator.setTurboLevel(this._turboLevel);
		});

		if (this.gameAnimations) {
			if (this._turboLevel > 0) {
				this.gameAnimations.accelerateAnimations();
			}
		}
	}

	
	private setTurboLevelTransient(turboLevel: number): void {
		const lvl = Math.max(0, Math.min(2, turboLevel));
		this._turboLevel = lvl;
		this.reelAnimators.forEach(animator => {
			animator.setTurboLevel(this._turboLevel);
		});
		if (this.gameAnimations && this._turboLevel > 0) {
			this.gameAnimations.accelerateAnimations();
		}
	}

	private startFreespinSequence(): void {
		if (this.gameAnimations) {
			this.gameAnimations.clearAllAnimations();
		}
		if (this._freespinOverlayShown) {
			return;
		}
		
		this._inputLocked = true;
		this._freespinOverlayShown = true;
		this._totalFreespinWin = 0;
		this._freespinCompletionPending = false;

		this.showFreespinOverlay(() => {
			this._currentFreespinIndex = 0;
			this._gameUI.startFreespinMode(0, this._totalFreespins);
			this._gameUI.TotalWin();
			this._gameUI.updateTotalWin(0);
			this.playNextFreespin();
	});
	}

	private createFreespinOverlayElements(): {
		overlay: Graphics;
		mainTitle: Container;
		titleTextContent: Text;
		subtitleText: Text;
		clickToContinueText: Text;
		overlayContainer: Container;
	} {
	const overlay = this.objectPool.acquireGraphics();
	try { overlay.rect(0, 0, this.app.screen.width, this.app.screen.height); } catch {}
	try { overlay.fill({ color: 0x000000, alpha: 1 }); } catch {}
	overlay.alpha = 0;
	overlay.interactive = false;
	try { (overlay as any).eventMode = 'none'; } catch {}
	try { (overlay as any).hitArea = new Rectangle(0, 0, this.app.screen.width, this.app.screen.height); } catch {}
	const mainTitle = this.objectPool.acquireContainer();

	const titleTextContent = this.objectPool.acquireText();
	titleTextContent.text = "YOU WON 10 FREE SPINS";
	try { (titleTextContent.style as any).fontFamily = GameConstants.FONTS.DEFAULT; } catch {}
	try { (titleTextContent.style as any).fontSize = scalePx(48, this.app.screen.width, this.app.screen.height); } catch {}
	try { (titleTextContent.style as any).fill = GameConstants.COLORS.WHITE; } catch {}
	try { (titleTextContent.style as any).fontWeight = 'bold'; } catch {}
	try { (titleTextContent.style as any).align = 'center'; } catch {}
	try { (titleTextContent.style as any).wordWrap = true; (titleTextContent.style as any).wordWrapWidth = this.app.screen.width * 0.8; } catch {}
	titleTextContent.anchor.set(0.5);
	titleTextContent.alpha = 0;
	mainTitle.addChild(titleTextContent);
		mainTitle.x = this.app.screen.width / 2;
		mainTitle.y = this.app.screen.height / 2 - 100;
		mainTitle.scale.set(0.5);

	const subtitleText = this.objectPool.acquireText();
	subtitleText.text = `You’ve entered the bonus round! Expect more Extra Wilds on the reels and a higher chance of landing the Wolf symbol with its expanding multiplier.`;
	try { (subtitleText.style as any).fontFamily = GameConstants.FONTS.DEFAULT; } catch {}
	try { (subtitleText.style as any).fontSize = scalePx(32, this.app.screen.width, this.app.screen.height); } catch {}
	try { (subtitleText.style as any).fill = GameConstants.COLORS.WHITE; } catch {}
	try { (subtitleText.style as any).fontWeight = 'bold'; } catch {}
	try { (subtitleText.style as any).align = 'center'; (subtitleText.style as any).wordWrap = true; (subtitleText.style as any).wordWrapWidth = this.app.screen.width * 0.5; } catch {}
	subtitleText.anchor.set(0.5);
	subtitleText.x = this.app.screen.width / 2;
	subtitleText.y = this.app.screen.height / 2 + 40;
	subtitleText.alpha = 0;

	const clickToContinueText = this.objectPool.acquireText();
	clickToContinueText.text = "Click to Continue";
	try { (clickToContinueText.style as any).fontFamily = GameConstants.FONTS.DEFAULT; } catch {}
	try { (clickToContinueText.style as any).fontSize = scalePx(28, this.app.screen.width, this.app.screen.height); } catch {}
	try { (clickToContinueText.style as any).fill = GameConstants.COLORS.GOLD; } catch {}
	try { (clickToContinueText.style as any).fontWeight = 'bold'; } catch {}
	try { (clickToContinueText.style as any).align = 'center'; } catch {}
	clickToContinueText.anchor.set(0.5);
	clickToContinueText.x = this.app.screen.width / 2;
	clickToContinueText.y = this.app.screen.height / 2 + 150;
	clickToContinueText.alpha = 0;

	const overlayContainer = this.objectPool.acquireContainer();
	
	(overlayContainer as any).interactive = true;
	try { (overlayContainer as any).eventMode = 'static'; } catch {}
	try { (overlayContainer as any).hitArea = new Rectangle(0, 0, this.app.screen.width, this.app.screen.height); } catch {}
	overlayContainer.addChild(overlay, mainTitle, subtitleText, clickToContinueText);
		overlayContainer.zIndex = 9999;


	return { overlay, mainTitle, titleTextContent, subtitleText, overlayContainer, clickToContinueText};
	}

	private fadeInOverlay(
		overlay: Graphics,
		onComplete: () => void
	) {
		let startTime = Date.now();
		const duration = GameConstants.FREESPIN.FREESPIN_ANIMATION_DELAY;

		const originalFrameAlpha = this._frameSprite?.alpha || 1;
		const originalFrameBgAlpha = this._framebg?.alpha || 1;
		const originalGridLinesAlpha = this._gridLines?.alpha || 1;

		const allSymbolSprites: Sprite[] = [];
		this.container.children.forEach(child => {
			if (child instanceof Sprite &&
				child !== this._frameSprite &&
				child !== this._framebg &&
				child !== this._backgroundAnimation) {
				if (child.texture && child.parent === this.container) {
					allSymbolSprites.push(child);
				}
			}
		});

		const originalSymbolAlphas = this.reelAnimators.map(animator =>
			animator.Symbols.map(symbol => symbol.alpha || 1)
		);
		const originalAllSymbolAlphas = allSymbolSprites.map(sprite => sprite.alpha || 1);

		const animate = (_deltaMS?: number) => {
				const elapsed = Date.now() - startTime;
				const progress = Math.min(elapsed / duration, 1);
				const easeOut = 1 - Math.pow(1 - progress, 3);
				const fadeOutProgress = 1 - progress;

				overlay.alpha = easeOut;

				if (this._frameSprite) {
					this._frameSprite.alpha = originalFrameAlpha * fadeOutProgress;
				}
				if (this._framebg) {
					this._framebg.alpha = originalFrameBgAlpha * fadeOutProgress;
				}
				if (this._gridLines) {
					this._gridLines.alpha = originalGridLinesAlpha * fadeOutProgress;
				}

				this.reelAnimators.forEach((animator, reelIndex) => {
					const symbols = animator.Symbols;
					symbols.forEach((symbol, symbolIndex) => {
						if (originalSymbolAlphas[reelIndex] && originalSymbolAlphas[reelIndex][symbolIndex] !== undefined) {
							symbol.alpha = originalSymbolAlphas[reelIndex][symbolIndex] * fadeOutProgress;
						}
					});
				});

 			allSymbolSprites.forEach((sprite, index) => {
 				sprite.alpha = originalAllSymbolAlphas[index] * fadeOutProgress;
 			});

 			if (progress >= 1) {
 				this.removeAnimationCallback(animate);
 				onComplete();
 			}
 		};

 		this.addAnimationCallback(animate);
	}

	private fadeInContent(
		overlay: Graphics,
		mainTitle: Container,
		titleTextContent: Text,
		subtitleText: Text,
		clickToContinueText: Text,
		onComplete: () => void
	) {
		let startTime = Date.now();
		const duration = GameConstants.FREESPIN.FREESPIN_ANIMATION_DELAY;

		let completed = false;
		const animate = (_deltaMS?: number) => {
			const elapsed = Date.now() - startTime;
			const progress = Math.min(elapsed / duration, 1);
			const easeOut = 1 - Math.pow(1 - progress, 3);

			overlay.alpha = 1 - easeOut;
			mainTitle.scale.set(0.5 + (easeOut * 0.5));
			titleTextContent.alpha = easeOut;
			subtitleText.alpha = easeOut;
			clickToContinueText.alpha = easeOut;

			if (progress < 1) return;
			if (!completed) {
				completed = true;
				this.removeAnimationCallback(animate);
				onComplete();
			}
		};
		this.addAnimationCallback(animate);
	}

	private fadeOutContent(
		titleTextContent: Text,
		subtitleText: Text,
		clickToContinueText: Text,
		overlayContainer: Container,
		onComplete: () => void
	) {
 		let startTime = Date.now();
 		const duration = 1500;

	const animate = (_deltaMS?: number) => {
 			const elapsed = Date.now() - startTime;
 			const progress = Math.min(elapsed / duration, 1);
 			const easeOut = 1 - Math.pow(1 - progress, 3);
 			const fadeInProgress = progress;

 			titleTextContent.alpha = 1 - easeOut;
 			subtitleText.alpha = 1 - easeOut;
 			clickToContinueText.alpha = 1 - easeOut;

 			if (this._frameSprite) {
 				this._frameSprite.alpha = fadeInProgress;
 			}
 			if (this._framebg) {
 				this._framebg.alpha = fadeInProgress;
 			}
 			if (this._gridLines) {
 				this._gridLines.alpha = fadeInProgress;
 			}

 			this.reelAnimators.forEach((animator) => {
 				animator.Symbols.forEach((symbol) => {
 					symbol.alpha = fadeInProgress;
 				});
 			});

 			this.container.children.forEach(child => {
 				if (child instanceof Sprite &&
 					child !== this._frameSprite &&
 					child !== this._framebg &&
 					child !== this._backgroundAnimation) {
 					if (child.texture && child.parent === this.container) {
 						child.alpha = fadeInProgress;
 					}
 				}
 			});

			if (progress >= 1) {
				this.removeAnimationCallback(animate);
				try { this.container.removeChild(overlayContainer); } catch {}
				
				onComplete();
			}
 		};

 		this.addAnimationCallback(animate);

 	}

	private showFreespinOverlay(onContinue: () => void): void {
		const { overlay, mainTitle, titleTextContent, subtitleText, overlayContainer, clickToContinueText} =
			this.createFreespinOverlayElements();
			let isClicked = true;
	this.container.addChild(overlayContainer);
		this.gameInfo.hideAutoSpinButton();
		this.gameInfo.stopAutoSpin();

			const onOverlayClick = (e?: any) => {
				try { e?.stopPropagation?.(); } catch {}
				if (isClicked) return;
				isClicked = true;
				(overlayContainer as any).interactive = false;
				try { (overlayContainer as any).cursor = 'default'; } catch {}
				this._gameUI.showUI();
				this.fadeOutContent(titleTextContent, subtitleText, clickToContinueText, overlayContainer, () => {
					
					this._freespinOverlayShown = false;
					
					try { this.objectPool.releaseText(titleTextContent); } catch {}
					try { this.objectPool.releaseText(subtitleText); } catch {}
					try { this.objectPool.releaseText(clickToContinueText); } catch {}
					try { this.objectPool.releaseGraphics(overlay); } catch {}
					try { this.objectPool.releaseContainer(mainTitle); } catch {}
					try { this.objectPool.releaseContainer(overlayContainer); } catch {}
					onContinue();
				});
			};
		soundManager.play("bonus_wolf", {volume: 0.15});
		this.fadeInOverlay(overlay, () => {
			this._gameUI.hideUI();
			this.playBonusBackground();
			this.fadeInContent(overlay, mainTitle, titleTextContent, subtitleText, clickToContinueText, () => {
				isClicked = false;
							(overlayContainer as any).interactive = true;
							try { (overlayContainer as any).eventMode = 'static'; } catch {}
				try { (overlayContainer as any).cursor = 'pointer'; } catch {}
				
				(overlayContainer as any).once('pointerdown', onOverlayClick);
			});
		});
	}


	private playNextFreespin(): void {
		if (this._currentFreespinIndex >= this._freespinData.length) {
			this.endFreespinSequence();
			return;
		}
		if (this.gameAnimations) {
			this.gameAnimations.clearAllAnimations();
		}
			
			this._scatterSlowdownSoundPlayed = false;
			this._scatterSlowdownHappened = false;
		this._freespinCompletionPending = false;
		const currentFreespinData = this._freespinData[this._currentFreespinIndex];
		const currentSpin = this._currentFreespinIndex + 1;
		this._gameUI.updateFreespinMode(currentSpin, this._totalFreespins);
		this._isWin = currentFreespinData._win;
		this._winAmount = currentFreespinData._payout;
		if (currentFreespinData._details && Array.isArray(currentFreespinData._details)) {
			this.winDetails = this.convertBackendDetailsToWinDetails(currentFreespinData._details);
		} else if (currentFreespinData._detailss) {
			this.winDetails = currentFreespinData._details;
		}
		this.wildPositions = currentFreespinData._wildPositions || [];
		if (currentFreespinData._payout > 0) {
			this._totalFreespinWin += currentFreespinData._payout;
		}
		this._isSpinning = true;
		this.drawGridAnimated(currentFreespinData._stopIndex, "bonus");
	}

	private showFreespinWinAndContinue(): void {
		const displayAmount = (this._totalFreespinWin / this.client.minAmountCredit) * this.client.minCreditCurrency;
		this._gameUI.updateTotalWin(displayAmount);
		const delay = GameConstants.getFreespinInterval(this.turboLevel);
		setTimeout(() => {
			this.onFreespinComplete();
		}, delay);
	}

	private endFreespinSequence(): void {
		if (this.gameAnimations)
			this.gameAnimations.clearAllAnimations();
		this._gameUI.endFreespinMode();
		this._gameUI.hideUI();
		this.showFreespinSummary();
	}

	private showFreespinSummary(): void {
		const overlay = this.objectPool.acquireGraphics();
		try { overlay.rect(0, 0, this.app.screen.width, this.app.screen.height); } catch {}
		try { overlay.fill({ color: 0x000000, alpha: 0 }); } catch {}
		overlay.zIndex = 10000; 
		this.container.addChild(overlay);
		this.fadeToBlackForFreespinSummary(overlay, () => {
			this.playNormalBackground();
			try { this.container.removeChild(overlay); } catch {}
			try { this.objectPool.releaseGraphics(overlay); } catch {}
			this.showCustomFreespinSummary();
		});
	}

	private showCustomFreespinSummary(): void {
		if (this.gameAnimations) {
			this.gameAnimations.clearAllAnimations();
		}
		let overlay = this.objectPool.acquireGraphics();
		try { overlay.rect(0, 0, this.app.screen.width, this.app.screen.height); } catch {}
		try { overlay.fill(0x000000); } catch {}
		overlay.alpha = 0;
		overlay.zIndex = 9998;
		this.container.addChild(overlay);

		let summaryContainer = this.objectPool.acquireContainer();
		if (!summaryContainer) { summaryContainer = new Container(); }
		summaryContainer.zIndex = 9999;

		const titleText = this.objectPool.acquireText();
		titleText.text = 'FREE SPINS COMPLETED!';
		try { (titleText.style as any).fontFamily = GameConstants.FONTS.DEFAULT; } catch {}
		try { (titleText.style as any).fontSize = scalePx(56, this.app.screen.width, this.app.screen.height); } catch {}
		try { (titleText.style as any).fill = GameConstants.COLORS.GOLD; } catch {}
		try { (titleText.style as any).fontWeight = "bold"; } catch {}
		titleText.anchor.set(0.5);
		titleText.y = -80;

		const winText = this.objectPool.acquireText();
		winText.text = '$0.00';
		try { (winText.style as any).fontFamily = GameConstants.FONTS.DEFAULT; } catch {}
		try { (winText.style as any).fontSize = scalePx(72, this.app.screen.width, this.app.screen.height); } catch {}
		try { (winText.style as any).fill = GameConstants.COLORS.WHITE; } catch {}
		try { (winText.style as any).fontWeight = "bold"; } catch {}
		winText.anchor.set(0.5);
		winText.y = 20;

		const clickText = this.objectPool.acquireText();
		clickText.text = 'Click to Continue';
		try { (clickText.style as any).fontFamily = GameConstants.FONTS.DEFAULT; } catch {}
		try { (clickText.style as any).fontSize = scalePx(36, this.app.screen.width, this.app.screen.height); } catch {}
		try { (clickText.style as any).fill = GameConstants.COLORS.GOLD; } catch {}
		try { (clickText.style as any).fontWeight = "bold"; } catch {}
		clickText.anchor.set(0.5);
		clickText.y = 120;

		summaryContainer.addChild(titleText, winText, clickText);

		try { summaryContainer.x = this.app.screen.width / 2; } catch {}
		try { summaryContainer.y = this.app.screen.height / 2; } catch {}
		summaryContainer.alpha = 0;
		summaryContainer.scale.set(0.1);

		this.container.addChild(summaryContainer);

			overlay.interactive = true;
			try { (overlay as any).eventMode = 'static'; } catch {}
		try { (overlay as any).cursor = 'pointer'; } catch {}

		let canClick = false;

		this.animateFreespinSummaryIn(overlay, summaryContainer, titleText, winText, clickText, () => {
			canClick = true;
			const onOverlayClick = (e?: any) => {
				try { e?.stopPropagation?.(); } catch {}
				if (!canClick) return;
				canClick = false;
				overlay.off('pointerdown', onOverlayClick);
				this.animateFreespinSummaryOut(overlay, summaryContainer, () => {
					try { if (overlay.parent) this.container.removeChild(overlay); } catch {}
					try { if (summaryContainer.parent) this.container.removeChild(summaryContainer); } catch {}
					try { this.objectPool.releaseGraphics(overlay); } catch {}
					try { this.objectPool.releaseText(titleText); } catch {}
					try { this.objectPool.releaseText(winText); } catch {}
					try { this.objectPool.releaseText(clickText); } catch {}
					try { this.objectPool.releaseContainer(summaryContainer); } catch {}
						try { this._gameUI.showUI(); } catch {}
						try {
							if (this._gameUI.betD) this._gameUI.betD.visible = true;
							if (this._gameUI.betU) this._gameUI.betU.visible = true;
						} catch {}
						try { this.enableSpinButton(); } catch {}
						this.resetFreespinMode();
				});
			};

			overlay.on('pointerdown', onOverlayClick);
		});
	}

	private animateFreespinSummaryIn(
		overlay: Graphics,
		summaryContainer: Container,
		titleText: Text,
		winText: Text,
		clickText: Text,
		onComplete: () => void
	): void {
		const duration = 2000;
		if (!overlay || !summaryContainer || !titleText || !winText || !clickText) {
			try { onComplete(); } catch {}
			return;
		}
		titleText.alpha = 0;
		winText.alpha = 0;
		clickText.alpha = 0;
		titleText.scale.set(0.1);
		winText.scale.set(0.1);
		clickText.scale.set(0.1);
		const animStart = Date.now();
		const animate = () => {
			const elapsed = Date.now() - animStart;
			const progress = Math.min(elapsed / duration, 1);
			const easeOut = 1 - Math.pow(1 - progress, 3);
			if (!summaryContainer || !summaryContainer.parent || !overlay || !overlay.parent) {
				this.removeAnimationCallback(animCb);
				return;
			}

			if (easeOut < 0.5) overlay.alpha = 2 * easeOut;
			else overlay.alpha = 1 - easeOut;
			if (this._backgroundAnimation) this._backgroundAnimation.alpha = 0.2 * easeOut;

			summaryContainer.alpha = easeOut;
			summaryContainer.scale.set(0.1 + (easeOut * 0.9));

			if (progress > 0.2) {
				const titleProgress = Math.min((progress - 0.2) / 0.3, 1);
				const titleEase = 1 - Math.pow(1 - titleProgress, 3);
				titleText.alpha = titleEase;
				titleText.scale.set(0.1 + (titleEase * 0.9));
			}

			if (progress > 0.4) {
				const winProgress = Math.min((progress - 0.4) / 0.4, 1);
				const winEase = 1 - Math.pow(1 - winProgress, 2);
				winText.alpha = winEase;
				winText.scale.set(0.1 + (winEase * 0.9));

				const totalWin = this._totalFreespinWin || 0;
				const minCredit = this.client.minAmountCredit || 1;
				const minCurrency = this.client.minCreditCurrency || 1;
				const targetAmount = (totalWin / minCredit) * minCurrency;
				const currentAmount = targetAmount * (winEase * winEase);
				winText.text = `${GameConstants.currency}${currentAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
			}

			if (progress > 0.7) {
				const clickProgress = Math.min((progress - 0.7) / 0.3, 1);
				const clickEase = 1 - Math.pow(1 - clickProgress, 3);
				clickText.alpha = clickEase;
				clickText.scale.set(0.1 + (clickEase * 0.9));
			}

			if (progress >= 1) {
				const finalAmount = this._totalFreespinWin / this.client.minAmountCredit * this.client.minCreditCurrency;
				winText.text = `${GameConstants.currency}${finalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
				winText.scale.set(1);
				titleText.scale.set(1);
				clickText.scale.set(1);
				this.startClickTextPulse(clickText);
				onComplete();
				this.removeAnimationCallback(animCb);
			}
		};
		const animCb = () => animate();
		this.addAnimationCallback(animCb);
	}

	private startClickTextPulse(clickText: Text): void {
		const pulseCb = () => {
			const time = Date.now() * 0.003;
			const pulse = Math.sin(time) * 0.1 + 0.9;
			if (clickText.parent) {
				clickText.scale.set(pulse);
			} else {
				this.removeAnimationCallback(pulseCb);
			}
		};
		this.addAnimationCallback(pulseCb);
	}

	private hideSpinButton()
	{
		if (this.spinButton)
			this.spinButton.visible = false;
		if (this._gameUI.betD)
			this._gameUI.betD.visible = false;
		if (this._gameUI.betU)
			this._gameUI.betU.visible = false;
	}

	private animateFreespinSummaryOut(
		overlay: Graphics,
		summaryContainer: Container,
		onComplete: () => void
	): void {
		let startTime = Date.now();
		const duration = 800;
		const animate = (_deltaMS?: number) => {
			if (!summaryContainer || !summaryContainer.parent || !overlay || !overlay.parent) {
				this.removeAnimationCallback(animate);
				try { onComplete(); } catch {}
				return;
		}
		const elapsed = Date.now() - startTime;
		const progress = Math.min(elapsed / duration, 1);
		const easeIn = 1 - Math.pow(1 - progress, 2);

		summaryContainer.alpha = 1 - easeIn;
		try { summaryContainer.scale.set(1 + (easeIn * 0.1)); } catch (e) { }
		overlay.alpha = 0.8 * (1 - easeIn);
		if (this._backgroundAnimation) {
			this._backgroundAnimation.alpha = easeIn;
		}
		if (this._frameSprite) {
			this._frameSprite.alpha = easeIn;
		}
		if (this._framebg) {
			this._framebg.alpha = easeIn;
		}
		if (this._gridLines) {
			this._gridLines.alpha = easeIn;
		}

		this.reelAnimators.forEach(animator => {
			animator.Symbols.forEach(symbol => {
				symbol.alpha = easeIn;
			});
		});

		if (progress < 1) return;
		this.removeAnimationCallback(animate);
		onComplete();
	};
		this.addAnimationCallback(animate);
	}

	private fadeToBlackForFreespinSummary(overlay: Graphics, onComplete: () => void): void {
		const startTime = Date.now();
		const duration = 800;
		const originalBackgroundAlpha = this._backgroundAnimation?.alpha || 1;

	const animate = (_deltaMS?: number) => {
			const elapsed = Date.now() - startTime;
			const progress = Math.min(elapsed / duration, 1);
			const easeOut = 1 - Math.pow(1 - progress, 3);
			const fadeOutProgress = 1 - progress;

			overlay.alpha = easeOut;

			if (this._backgroundAnimation) {
				this._backgroundAnimation.alpha = originalBackgroundAlpha * fadeOutProgress;
			}
			if (this._frameSprite) this._frameSprite.alpha = fadeOutProgress;
			if (this._framebg) this._framebg.alpha = fadeOutProgress;
			if (this._gridLines) this._gridLines.alpha = fadeOutProgress;

			this.reelAnimators.forEach(animator => animator.Symbols.forEach(s => s.alpha = fadeOutProgress));

			this.container.children.forEach(child => {
				if (child instanceof Sprite && child !== this._frameSprite && child !== this._framebg && child !== this._backgroundAnimation) {
					if (child.texture && child.parent === this.container) child.alpha = fadeOutProgress;
				}
			});

			if (progress >= 1) {
				overlay.alpha = 1;
				this.removeAnimationCallback(animate);
				onComplete();
			}
		};

		this.addAnimationCallback(animate);
	}

	public get remainingFreespins(): number {
		return this._remainingFreespins;
	}

	public get totalFreespins(): number {
		return this._totalFreespins;
	}
	public get isTurboMode(): boolean {
		return this._turboLevel > 0;
	}
	public get turboLevel(): number {
		return this._turboLevel;
	}

	public cycleTurboLevel(): void {
		this.setTurboLevel((this._turboLevel + 1) % 3);
	}
	public get amount(): number
	{
		return (this._amount);
	}


}
