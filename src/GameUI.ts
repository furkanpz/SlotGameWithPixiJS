import { Container, Graphics, Text, BlurFilter, Texture, Sprite, Ticker, Rectangle } from "pixi.js";
import { scalePx } from "./game.utils"
import { GameConstants } from "./GameConstants";
import { GameClient, spinType } from "./gameClient";
import { AssetLoader } from "./assetsLoader";
import { soundManager } from "./soundManager";
import { ObjectPool } from "./objPool";
import { LayoutManager } from "./LayoutManager";
import { makeHiResCircleSprite } from "./shapeUtils";


export class gameInfo {
	
	private readonly MOBILE_UI_SCALE: number = GameConstants.IS_MOBILE ? 1.2 : 1.0;
	private container: Container = new Container();
	private _client: GameClient;
	private _assetLoader: AssetLoader;

	private balanceText: Text;
	private balanceLabel: Text;
	private betText: Text;
	private betLabel: Text;
	private bonusButton: Container;
	private winText: Text | null = null;
	private winTitle: Text | null = null;
	private freespinText: Text | null = null;
	private freespinLabel: Text | null = null;
	private totalWinText: Text | null = null;
	private totalWinContainer: Container | null = null;
	private screenWidth: number;
	private screenHeight: number;
	private boxContainer: Container;
	private currentTotalWin: number = 0;
	private _isMenuOpen: boolean = false;
	private _isAutoSpinMenuOpen: boolean = false;
	private menuContainer: Container | null = null;
	private infoButton: Container | null = null;
	private spinButton: Sprite | null = null;
	private betUp: Container | null = null;
	private betDown: Container | null = null;
	private autoSpinMenuHandler: ((event: any) => void) | null = null;
	private autoSpinMenuContainer: Container | null = null;
	private autoSpinMenuOverlay: Graphics | null = null;
	
	private mobileMenuOverlay: Graphics | null = null;

	private _gameMusic: boolean = true;
	private _gameSound: boolean = true;
	private autoSpinButton: Container | null = null;
	private _isAutoSpinActive: boolean = false;
	private _autoSpinRemaining: number = 0;
	private autoSpinText: Text | null = null;
	private _bonusboost: boolean = false;
	private autoSpinStopConditions = {
		onWin: false,
		onFeature: false,
		onBalanceLoss: false,
		maxWinAmount: 0
	};

	private _namedChildren: WeakMap<Container, Map<string, any>> = new WeakMap();
	private getNamed<T = any>(parent: Container | null, name: string): T | null {
		if (!parent) return null;
		const map = this._namedChildren.get(parent);
		return (map?.get(name) ?? null) as T | null;
	}
	private setNamed(parent: Container, name: string, child: any): void {
		let map = this._namedChildren.get(parent);
		if (!map) { map = new Map(); this._namedChildren.set(parent, map); }
		map.set(name, child);
		try { (child as any).label = name; } catch {}
	}

	
	private getBottomBarWidth(): number {
		if (GameConstants.IS_MOBILE) {
			const leftPad = this.boxContainer?.x ?? 0;
			return Math.max(0, this.screenWidth - 2 * leftPad);
		}
		return this.boxContainer?.width ?? this.screenWidth;
	}

	constructor(client:GameClient, assetLoader: AssetLoader, screenWidth: number = 1920, screenHeight = 1080) {
		this.screenWidth = screenWidth;
		this.screenHeight = screenHeight;
		this._client = client;
		this._assetLoader = assetLoader;
		
		this.container.sortableChildren = false;
		
		const balance = this._client.reelbalance;
		const bet = this._client.realAmount;
		this._client.onBalanceChange = () => {
			this.updateBalanceDisplay();
		};
		
		const mobileSidePadding = GameConstants.IS_MOBILE ? Math.max(8, Math.floor(screenWidth * 0.03)) : 0;
		const boxWidth = GameConstants.IS_MOBILE
			? Math.max(0, screenWidth - mobileSidePadding * 2)
			: scalePx(800, screenWidth, screenHeight) * this.MOBILE_UI_SCALE;
		const boxHeight = scalePx(100, screenWidth, screenHeight) * this.MOBILE_UI_SCALE;
	const bottomMargin = GameConstants.IS_MOBILE ? 0 : 20;
		
		const shadowBox = new Graphics();
		shadowBox
			.rect(GameConstants.BOX_STYLING.SHADOW_OFFSET, GameConstants.BOX_STYLING.SHADOW_OFFSET, boxWidth, boxHeight)
			.fill({ color: GameConstants.COLORS.BLACK, alpha: GameConstants.BOX_STYLING.SHADOW_ALPHA });		const blurFilter = new BlurFilter();
		blurFilter.strength = GameConstants.BLUR_FILTER.BLUR_AMOUNT;
		shadowBox.filters = [blurFilter];
		
		const betBox = new Graphics()
			.roundRect(0, 0, boxWidth, boxHeight, 0)
			.fill({ color: GameConstants.COLORS.BLACK, alpha: GameConstants.BOX_STYLING.BACKGROUND_ALPHA })
			.stroke({ color: GameConstants.COLORS.BLACK, width: GameConstants.BOX_STYLING.BORDER_WIDTH });
		
		this.boxContainer = new Container();
		if (!GameConstants.IS_MOBILE) {
			this.boxContainer.addChild(shadowBox);
			this.boxContainer.addChild(betBox);
		}
		
		this.boxContainer.x = GameConstants.IS_MOBILE ? mobileSidePadding : (screenWidth / 2) - (boxWidth / 2);
	this.boxContainer.y = screenHeight - boxHeight - bottomMargin;
	const labelBoost = GameConstants.IS_MOBILE ? 1.3 : 1.0;
		this.balanceLabel = new Text({
			text: "BALANCE",
			style: {
				fontFamily: GameConstants.FONTS.DEFAULT,
		fontSize: GameConstants.FONTS.SIZE_SMALL * this.MOBILE_UI_SCALE * labelBoost,
				fill: GameConstants.COLORS.LIGHT_GRAY,
				fontWeight: "bold"
			}
		});
		if (this._client.isDemo)
			this.balanceLabel.text = "DEMO BALANCE";
		this.balanceLabel.x = 12;
		this.balanceLabel.y = boxHeight  / 4;
		this.boxContainer.addChild(this.balanceLabel);
		
		const BalanceT = `${GameConstants.currency}${balance.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
		let fSize = 0;
		if (BalanceT.length >= 11)
			fSize = BalanceT.length % 11;
	const balanceBaseSize = (GameConstants.FONTS.SIZE_MEDIUM + (GameConstants.IS_MOBILE ? 8 : 2));
		this.balanceText = new Text({
			text: BalanceT,
			style: {
				fontFamily: GameConstants.FONTS.DEFAULT,
		fontSize: Math.max(16, (balanceBaseSize - fSize)) * this.MOBILE_UI_SCALE,
				fill: GameConstants.COLORS.WHITE,
				fontWeight: "bold"
			}
		});
		this.balanceText.x = 12;
		
		const balanceLabelFont = Number((this.balanceLabel.style as any).fontSize) || 24;
		const labelValueGap = Math.max(16, Math.floor(balanceLabelFont * (GameConstants.IS_MOBILE ? 1.1 : 0.9)));
		this.balanceText.y = this.balanceLabel.y + labelValueGap;

		this.boxContainer.addChild(this.balanceText);
		
	this.betLabel = new Text({
			text: "BET",
			style: {
				fontFamily: GameConstants.FONTS.DEFAULT,
		fontSize: GameConstants.FONTS.SIZE_SMALL * this.MOBILE_UI_SCALE * labelBoost,
				fill: GameConstants.COLORS.LIGHT_GRAY,
				fontWeight: "bold"
			}
		});
		this.betLabel.x = GameConstants.IS_MOBILE ? (boxWidth * 0.35) : (boxWidth / 4);
		this.betLabel.y = boxHeight / 4;
		this.boxContainer.addChild(this.betLabel);
		
	const betBaseSize = GameConstants.IS_MOBILE ? 32 : 24;
	this.betText = new Text({
			text: `${GameConstants.currency}${bet.toFixed(2).replace(".", ",")}`,
			style: {
				fontFamily: "Arial",
		fontSize: betBaseSize * this.MOBILE_UI_SCALE,
				fill: 0xffffff,
				fontWeight: "bold"
			}
		});
		this.betText.x = this.betLabel.x;
		
		this.betText.y = this.betLabel.y + labelValueGap;
		this.boxContainer.addChild(this.betText);

	this.bonusButton = this.createBonusButton(boxWidth, boxHeight);
		
		this.infoButton = this.createInfoBarButton(boxWidth, boxHeight);
		this.autoSpinButton = this.createAutoSpinButton(boxWidth, boxHeight);
		this.boxContainer.addChild(this.bonusButton);
		this.boxContainer.addChild(this.infoButton);
		if (this.autoSpinButton) {
			this.boxContainer.addChild(this.autoSpinButton);
		}

		
		if (GameConstants.IS_MOBILE) {
			try { this.boxContainer.removeChild(this.infoButton!); } catch {}
			this.container.addChild(this.infoButton!);
			if (this.autoSpinButton) {
				try { this.boxContainer.removeChild(this.autoSpinButton); } catch {}
				this.container.addChild(this.autoSpinButton);
			}
			
			if (this.bonusButton) {
				try { this.boxContainer.removeChild(this.bonusButton); } catch {}
				this.container.addChild(this.bonusButton);
			}
		}

		
		if (GameConstants.IS_MOBILE && this.infoButton) {
			(this.container as any).sortableChildren = true;
			const pad = Math.max(10, Math.floor(this.screenWidth * 0.03));
			const padBottom = Math.max(pad, Math.floor(this.screenHeight * 0.04));
			const rAuto = (scalePx(50, this.screenWidth, this.screenHeight) as number) * this.MOBILE_UI_SCALE;
			const rInfo = (scalePx(50, this.screenWidth, this.screenHeight) as number) * this.MOBILE_UI_SCALE;
			const gapY = Math.max(8, Math.floor(this.screenHeight * 0.012));
			let autoX = Math.max(pad, this.screenWidth - (rAuto * 2) - pad);
			let autoY = this.screenHeight - (rAuto * 2) - padBottom;
			(this.autoSpinButton as any).x = autoX;
			(this.autoSpinButton as any).y = autoY;
			(this.autoSpinButton as any).zIndex = 2000;
			let infoX = Math.max(pad, this.screenWidth - (rInfo * 2) - pad);
			let infoY = autoY - (rInfo * 2) - gapY;
			(this.infoButton as any).x = infoX;
			(this.infoButton as any).y = infoY;
			(this.infoButton as any).zIndex = 1990;
			(this.infoButton as any).visible = true;
			(this.infoButton as any).alpha = 1;
			
			if (this.bonusButton) {
				const rBonus = (scalePx(55, this.screenWidth, this.screenHeight) as number) * this.MOBILE_UI_SCALE * 0.85;
				(this.bonusButton as any).x = Math.max(pad, rBonus + pad);
				(this.bonusButton as any).y = Math.floor(infoY + rInfo);
			}
			this.container.sortChildren?.();
		}
		
		this.container.addChild(this.boxContainer);
	}
	public showWin(win: number): void {
		this.currentTotalWin = 0;
		
		if (this.winText) {
			try { this.container.removeChild(this.winText); } catch {}
			try { this.boxContainer.removeChild(this.winText); } catch {}
			this.winText.destroy();
		}
		if (this.winTitle) {
			try { this.container.removeChild(this.winTitle); } catch {}
			try { this.boxContainer.removeChild(this.winTitle); } catch {}
			this.winTitle.destroy();
		}
		const WText = `${GameConstants.currency}${win.toLocaleString("tr-TR", {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		})}`;
		let fSize = 0;
		if (WText.length >= 8)
		 	fSize = WText.length % 8;
		
		const baseWinFont = GameConstants.IS_MOBILE ? 40 : 24;
		const baseTitleFont = GameConstants.IS_MOBILE ? 28 : 20; 
		this.winText = new Text({
			text: WText,
			style: {
				fontFamily: "Arial",
				fontSize: Math.max(18, baseWinFont - fSize),
				fill: 0xffffff,
				fontWeight: "bold"
			}
		});

		this.winTitle = new Text({
			text: `WIN`,
			style: {
				fontFamily: "Arial",
				fontSize: baseTitleFont,
				fill: 0xffffff,
				fontWeight: "bold"
			}
		});

		
		
		if (GameConstants.IS_MOBILE) {
			
			const leftGap = Math.max(12, (this.betLabel.x - (this.balanceText.x + this.balanceText.width)));
			const startX = this.betText.x + this.betText.width + leftGap;
			
			try { (this.winTitle as any).anchor?.set?.(0, 0); } catch {}
			try { (this.winText as any).anchor?.set?.(0, 0); } catch {}
			
			const innerWidth = this.getBottomBarWidth();
			const padRight = Math.max(8, Math.floor(this.screenWidth * 0.03));
			
			this.winTitle.x = startX;
			this.winText.x = startX;
			
			const overflow = (startX + this.winText.width + padRight) - innerWidth;
			if (overflow > 0) {
				this.winTitle.x -= overflow;
				this.winText.x -= overflow;
			}
			
			this.winTitle.y = this.betLabel.y;
			this.winText.y = this.betText.y;
			
			this.boxContainer.addChild(this.winTitle);
			this.boxContainer.addChild(this.winText);
		} else {
			
			try { (this.winTitle as any).anchor?.set?.(0, 0); } catch {}
			try { (this.winText as any).anchor?.set?.(0, 0); } catch {}
			const gapRight = Math.max(12, Math.floor(this.screenWidth * 0.008));
			const autoX = (this.autoSpinButton && this.autoSpinButton.parent === this.boxContainer)
				? this.autoSpinButton.x
				: (this.getBottomBarWidth() - 80);
			const rightEdge = Math.max(0, autoX - gapRight);
			
			const extraOffset = Math.max(10, Math.floor(this.screenWidth * 0.02));
			this.winTitle.x = Math.max(10, rightEdge - this.winTitle.width - extraOffset);
			this.winText.x = Math.max(10, rightEdge - this.winText.width - extraOffset);
			this.winTitle.y = this.betLabel.y;
			this.winText.y = this.betText.y;
			this.boxContainer.addChild(this.winTitle);
			this.boxContainer.addChild(this.winText);
		}
	}

	private createArrowCircle(radius: number, direction: 'left' | 'right'): Container {
		const c = new Container();
		const bg = makeHiResCircleSprite(this._client.app, radius, { fill: 0x000000, fillAlpha: 0.7, ssaa: 3 });
		c.addChild(bg);
		
		const g = new Graphics();
		const half = Math.max(6, radius * 0.35);
		const lineWidth = Math.max(3, Math.floor(radius * 0.14));
		g.moveTo(-half, 0).lineTo(half, 0).stroke({ color: 0xffffff, width: lineWidth });
		if (direction === 'right') {
			g.moveTo(0, -half).lineTo(0, half).stroke({ color: 0xffffff, width: lineWidth });
		}
		c.addChild(g);
		c.cursor = "pointer";
		c.interactive = true;
		return c;
	}

	private betSetter()
	{
		if (!this.spinButton)
			return;
		
		let radius = scalePx(35, this.screenWidth, this.screenHeight) * this.MOBILE_UI_SCALE;
		if (GameConstants.IS_MOBILE) radius *= 1.1;
		const gap = Math.max(scalePx(12, this.screenWidth, this.screenHeight), radius * 0.6);
		const betDown = this.createArrowCircle(radius, "left");
		const betUp = this.createArrowCircle(radius, "right");
		
		let leftX  = this.spinButton.x - (this.spinButton.width / 2) - radius - gap;
		let rightX = this.spinButton.x + (this.spinButton.width / 2) + radius + gap;
		
		const padSide = Math.max(scalePx(8, this.screenWidth, this.screenHeight), 8);
		leftX = Math.max(radius + padSide, leftX);
		rightX = Math.min(this.screenWidth - radius - padSide, rightX);
		betDown.x = leftX;
		betUp.x = rightX;
		
		
		betDown.y = this.spinButton.y;
		betUp.y = this.spinButton.y;
		betUp.on("pointerdown", () => {
			if (this._client.isProcessingSpin)
				return;
			this._client.UpBet();
			this.updateBetDisplay();
		});
		betDown.on("pointerdown", () => {
			if (this._client.isProcessingSpin)
				return;
			this._client.DownBet();
			this.updateBetDisplay();
		});
		this.betDown = betDown;
		this.betUp = betUp;
		this.container.addChild(betDown);
		this.container.addChild(betUp);
	}
	public get betD(): Container | null{
		return this.betDown;
	}
	public get betU(): Container | null{
		return this.betUp;
	}

	public hideUI(){
		this.container.visible = false;
	}

	public showUI() {
		this.container.visible = true;
	}

	public rotateSpinButton360() {
		if (!this.spinButton)
			return;
		let angle = 0;
		const ticker = new Ticker();

		ticker.add((time) => {
			angle += 20 * (time.deltaMS / 16.666)
        	this.spinButton!.rotation = (angle * Math.PI) / 180;

			if (angle >= 360) {
				this.spinButton!.rotation = 0; 
				ticker.stop();
				ticker.destroy();
			}
		});

		ticker.start();
	}

	public SpinButtonStatic()
	{
		if (this._assetLoader.spinButtonStatic) {
			this.spinButton = new Sprite(this._assetLoader.spinButtonStatic);
			this.spinButton.interactive = true;
			this.spinButton.cursor = 'pointer';
			
			try {
				const cfg = LayoutManager.instance.current.ui?.spinButton;
				if (cfg) {
					this.spinButton.x = cfg.x;
					this.spinButton.y = cfg.y;
					this.spinButton.width = scalePx(cfg.width, this.screenWidth,  this.screenHeight);
					this.spinButton.height = scalePx(cfg.height, this.screenWidth,  this.screenHeight);
					
					if (GameConstants.IS_MOBILE) {
						this.spinButton.width *= 1.2;
						this.spinButton.height *= 1.2;
					}
				} else {
					this.spinButton.x = this.screenWidth* 0.875;
					this.spinButton.y = this.screenHeight * 0.815;
					let w = scalePx(200, this.screenWidth,  this.screenHeight);
					let h = scalePx(200, this.screenWidth,  this.screenHeight);
					if (GameConstants.IS_MOBILE) { w *= 1.5; h *= 1.5; }
					this.spinButton.width = w;
					this.spinButton.height = h;
				}
			} catch {
				this.spinButton.x = this.screenWidth* 0.875;
				this.spinButton.y = this.screenHeight * 0.815;
				let w = scalePx(200, this.screenWidth,  this.screenHeight);
				let h = scalePx(200, this.screenWidth,  this.screenHeight);
				if (GameConstants.IS_MOBILE) { w *= 1.5; h *= 1.5; }
				this.spinButton.width = w;
				this.spinButton.height = h;
			}
			this.spinButton.anchor.set(0.5);
			
			if (GameConstants.IS_MOBILE) {
				this.spinButton.x = this.screenWidth / 2;
				
				try {
					const rInfo = (scalePx(50, this.screenWidth, this.screenHeight) as number) * this.MOBILE_UI_SCALE;
					if (this.infoButton) {
						this.spinButton.y = (this.infoButton as any).y + rInfo;
					} else {
						this.spinButton.y = Math.min(this.spinButton.y, this.screenHeight * 0.88);
					}
				} catch {
					this.spinButton.y = Math.min(this.spinButton.y, this.screenHeight * 0.88);
				}
			}
			this.container.addChild(this.spinButton);
			this.betSetter();
		}
	}

	public async startMusic()
	{
		try {
			
			await this._assetLoader.initializeAudioContext();
			await soundManager.play("bgm", {loop: true, volume: 0.5});
		} catch (error) {
			console.warn('Could not start music - AudioContext not ready:', error);
		}
	}
	public TotalWin()
	{
		if (this.totalWinContainer) {
			this.updateTotalWin(this.currentTotalWin);
			return;
		}
		this.totalWinContainer = new Container();
		
		const buttonWidth = scalePx(100, this.screenWidth, this.screenHeight) * this.MOBILE_UI_SCALE;
		const buttonHeight = scalePx(90, this.screenWidth, this.screenHeight) * this.MOBILE_UI_SCALE;
		
		const totalWinLabel = new Text({
			text: "TOTAL WIN",
			style: {
				fontFamily: GameConstants.FONTS.DEFAULT,
				fontSize: scalePx(16, this.screenWidth, this.screenHeight) * this.MOBILE_UI_SCALE,
				fill: GameConstants.COLORS.WHITE,
				fontWeight: "bold",
				align: 'center'
			}
		});
		totalWinLabel.anchor.set(0.5);
		totalWinLabel.x = buttonWidth / 2;
		totalWinLabel.y = buttonHeight / 2 - 20;

		this.totalWinText = new Text({
			text: `${GameConstants.currency}${this.currentTotalWin.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
			style: {
				fontFamily: GameConstants.FONTS.DEFAULT,
				fontSize: scalePx(20, this.screenWidth, this.screenHeight) * this.MOBILE_UI_SCALE,
				fill: GameConstants.COLORS.GOLD,
				fontWeight: "bold",
				align: 'center'
			}
		});
		this.totalWinText.anchor.set(0.5);
		this.totalWinText.x = buttonWidth / 2;
		this.totalWinText.y = buttonHeight / 2 + 10;
		
		this.totalWinContainer.addChild(totalWinLabel);
		this.totalWinContainer.addChild(this.totalWinText);

		{
			const containerWidth = GameConstants.IS_MOBILE ? this.getBottomBarWidth() : (this.boxContainer?.width ?? 800);
			if (GameConstants.IS_MOBILE) {
				const pad = Math.max(10, Math.floor(this.screenWidth * 0.03));
				this.totalWinContainer.x = (this.boxContainer?.x ?? 0) + containerWidth - buttonWidth - pad; 
			} else {
				this.totalWinContainer.x = containerWidth - buttonWidth - scalePx(80, this.screenWidth, this.screenHeight);
			}
		}
		
		{
			const barHeight = scalePx(100, this.screenWidth, this.screenHeight) * this.MOBILE_UI_SCALE;
			this.totalWinContainer.y = Math.floor((barHeight - buttonHeight) / 2);
		}
		
		this.boxContainer.addChild(this.totalWinContainer);
	}

	public updateTotalWin(amount: number): void {
		this.currentTotalWin = amount;

		if (this.totalWinText) {
			this.totalWinText.text = `${GameConstants.currency}${amount.toLocaleString("tr-TR", { 
				minimumFractionDigits: 2, 
				maximumFractionDigits: 2 
			})}`;

			const baseFontSize = 20;
			const maxLength = 9;

			if (this.totalWinText.text.length > maxLength) {
				const diff = this.totalWinText.text.length - maxLength;
				this.totalWinText.style.fontSize = baseFontSize - diff * 2; 
			} else {
				this.totalWinText.style.fontSize = baseFontSize;
			}
		}
}

	public removeTotalWin(): void {
		if (this.totalWinContainer && this.totalWinContainer.parent) {
			this.totalWinContainer.parent.removeChild(this.totalWinContainer);
			this.totalWinContainer.destroy();
			this.totalWinContainer = null;
		}
		
		if (this.totalWinText && this.totalWinText.parent) {
			this.totalWinText.parent.removeChild(this.totalWinText);
			this.totalWinText.destroy();
		}
		this.totalWinText = null;
		this.currentTotalWin = 0;
		
		if (this.boxContainer && this.boxContainer.children) {
			for (let i = this.boxContainer.children.length - 1; i >= 0; i--) {
				const child = this.boxContainer.children[i];
				if (child instanceof Text && child.text === "TOTAL WIN") {
					this.boxContainer.removeChild(child);
					child.destroy();
				}
			}
		}
	}

	public addToWinAmount(paylineWin: number, multiplier: number = 1): void {
		const displayWin = paylineWin * multiplier;
		const startAmount = this.currentTotalWin;
		const targetAmount = this.currentTotalWin + displayWin;
		const isIntenseWin = multiplier >= 10;
		const isAutoSpinActive = this._isAutoSpinActive;
		const animationDuration = isAutoSpinActive ? 200 : (isIntenseWin ? 1500 : 800);
		const startTime = Date.now();
		
		
		const originalX = this.winText?.x || 0;
		const originalY = this.winText?.y || 0;
		
		const animate = () => {
			const elapsed = Date.now() - startTime;
			const progress = Math.min(elapsed / animationDuration, 1);
			
			const easeOut = 1 - Math.pow(1 - progress, 3);
			const currentAmount = startAmount + (displayWin * easeOut);
			
			if (this.winText) {
				this.winText.text = `${GameConstants.currency}${currentAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
				if (isIntenseWin) {
					const shakeIntensity = 5;
					this.winText.x = originalX + (Math.random() - 0.5) * shakeIntensity;
					this.winText.y = originalY + (Math.random() - 0.5) * shakeIntensity;
					const pulsePhase = elapsed * 0.01;
					const redValue = Math.floor(255 * (0.7 + 0.3 * Math.sin(pulsePhase)));
					const goldValue = Math.floor(215 * (0.8 + 0.2 * Math.sin(pulsePhase * 1.5)));
					this.winText.style.fill = (redValue << 16) | (goldValue << 8) | 0;
					const scaleMultiplier = 1 + 0.1 * Math.sin(pulsePhase * 2);
					this.winText.scale.set(scaleMultiplier);
				}
			}
			
			if (progress < 1) {
				requestAnimationFrame(animate);
			} else {
				
				if (this.winText && isIntenseWin) {
					this.winText.x = originalX;
					this.winText.y = originalY;
					this.winText.scale.set(1);
					this.winText.style.fill = 0xFFD700; 
				}
				this.currentTotalWin = targetAmount;
			}
		};
		animate();
	}

	public removeWin(): void {
		if (this.winText && this.winTitle) {
			this.boxContainer.removeChild(this.winText);
			this.winText.destroy();
			this.winText = null;

			this.boxContainer.removeChild(this.winTitle);
			this.winTitle.destroy();
			this.winTitle = null;
		}
	}

	private createInfoBarButton(boxWidth: number, _boxHeight: number): Container {
		const isMobile = GameConstants.IS_MOBILE;
		const container = new Container();
		const g = new Graphics();
		if (isMobile) {
			const r = (scalePx(50, this.screenWidth, this.screenHeight) as number) * this.MOBILE_UI_SCALE; 
			const bg = makeHiResCircleSprite(this._client.app, r, { fill: GameConstants.COLORS.BLACK, fillAlpha: 0.6, ssaa: 3 });
			(bg as any).label = 'infoBg';
			bg.anchor.set(0);
			bg.x = 0; bg.y = 0;
			container.addChild(bg);
			this.setNamed(container, 'infoBg', bg);
			const lineW = Math.floor(r * 1.05);
			const lineH = Math.max(2, Math.floor(r * 0.10));
			const gap = Math.max(3, Math.floor(r * 0.22));
			const sx = Math.floor(r - lineW / 2);
			const total = lineH * 3 + gap * 2;
			const sy = Math.floor(r - total / 2);
			g.roundRect(sx, sy, lineW, lineH, 0).fill({ color: 0xffffff });
			g.roundRect(sx, sy + gap + lineH, lineW, lineH, 0).fill({ color: 0xffffff });
			g.roundRect(sx, sy + (gap + lineH) * 2, lineW, lineH, 0).fill({ color: 0xffffff });
			container.hitArea = new Rectangle(0, 0, r * 2, r * 2);
			const pad = Math.max(8, Math.floor(this.screenWidth * 0.02));
			container.x = boxWidth - r * 2 - pad;
			container.y = pad; 
		} else {
			const btnW = scalePx(60, this.screenWidth, this.screenHeight) * this.MOBILE_UI_SCALE;
			const btnH = scalePx(100, this.screenWidth, this.screenHeight) * this.MOBILE_UI_SCALE;
			g.roundRect(0, 0, btnW, btnH, 0).fill({ color: 0x000000, alpha: 1.0 }).stroke({ color: 0xffffff, width: 3 });
			const lineWidth = scalePx(37.5, this.screenWidth, this.screenHeight) * this.MOBILE_UI_SCALE;
			const lineHeight = scalePx(3, this.screenWidth, this.screenHeight) * this.MOBILE_UI_SCALE;
			const lineSpacing = scalePx(8, this.screenWidth, this.screenHeight) * this.MOBILE_UI_SCALE;
			const startX = (btnW - lineWidth) / 2;
			const totalLinesHeight = lineHeight * 3 + lineSpacing * 2;
			const startY = (btnH - totalLinesHeight) / 2;
			g.roundRect(startX, startY, lineWidth, lineHeight, 0).fill({ color: 0xffffff })
			 .roundRect(startX, startY + lineSpacing, lineWidth, lineHeight, 0).fill({ color: 0xffffff })
			 .roundRect(startX, startY + (lineSpacing * 2), lineWidth, lineHeight, 0).fill({ color: 0xffffff });
			container.x = boxWidth - btnW;
			container.y = 0;
		}
	container.addChild(g);
		container.interactive = true;
		container.cursor = 'pointer';
		container.on('pointerover', () => { container.alpha = 0.9; });
		container.on('pointerout', () => { container.alpha = 1; });
		container.on('pointerdown', () => { this.toggleMenu(); });
		return container;
	}


	private createBonusButton(boxWidth: number, boxHeight: number): Container {
		let buttonRadius = scalePx(55, this.screenWidth, this.screenHeight) * this.MOBILE_UI_SCALE;
		if (GameConstants.IS_MOBILE) buttonRadius *= 0.85; 
		const btnContainer = new Container();
		const btn = makeHiResCircleSprite(this._client.app, buttonRadius, { fill: 0x000000, fillAlpha: 0.5, stroke: 0xffffff, strokeWidth: 2, ssaa: 3 });

		const bonusText = new Text({
			text: "BONUS",
			style: {
				fontFamily: "Arial",
				
				fontSize: (GameConstants.IS_MOBILE
					? scalePx(22, this.screenWidth, this.screenHeight)
					: scalePx(25, this.screenWidth, this.screenHeight)) * this.MOBILE_UI_SCALE,
				fill: 0xffffff,
				fontWeight: "bold"
			}
		});
		bonusText.anchor.set(0.5);
		btnContainer.addChild(btn);
		btnContainer.addChild(bonusText);
		btnContainer.interactive = true;
		btnContainer.cursor = 'pointer';
		if (GameConstants.IS_MOBILE) {
			
			const pad = Math.max(8, Math.floor(this.screenWidth * 0.02));
			btnContainer.x = buttonRadius + pad; 
			const balanceCenterY = this.balanceText ? (this.balanceText.y + (this.balanceText.height / 2)) : (boxHeight / 2);
			btnContainer.y = Math.floor(balanceCenterY);
		} else {
			btnContainer.x = boxWidth / 2;
			btnContainer.y = (boxHeight / 2);
		}
		btnContainer.on('pointerover', () => {
			btnContainer.scale.set(1.1);
		});
		btnContainer.on('pointerout', () => {
			btnContainer.scale.set(1.0);
		});
		btnContainer.on('pointerdown', () => {
			
			if (this._bonusboost) {
				this._bonusboost = false;
				this._client.currentSpinType = spinType.NORMAL;
				this.resetBonusButton();
				this.resetBonusText();
				
				if (this.betText) {
					this.betText.style.fill = GameConstants.COLORS.WHITE;
					const currentBet = this._client.realAmount;
					this.betText.text = `${GameConstants.currency}${currentBet.toFixed(2).replace('.', ',')}`;
				}
				return; 
			}
			this.showBonusBuyPage();
		});
		return btnContainer;
	}
	
	private showBonusBuyPage() {
		
		if (!this._client.assetsLoader) return;

		const overlayContainer = new Container();
		(overlayContainer as any).zIndex = 3000;
		(overlayContainer as any).sortableChildren = false;
		let viewportRef: Container | null = null;

		const pool: ObjectPool | undefined = this._client.gameRenderer?.objectPool;
		const spritePool: any = (this._client.gameRenderer as any)?._spritePool;

		const pooledGraphics: Graphics[] = [];
		const pooledTexts: Text[] = [];
		const pooledSprites: Sprite[] = [];

		const acquireText = (): Text => {
			if (pool) { const t = pool.acquireText(); pooledTexts.push(t); return t; }
			const t = new Text({ text: '', style: undefined as any }); pooledTexts.push(t); return t;
		};
		const acquireSprite = (texture: Texture): Sprite => {
			if (spritePool && typeof spritePool.acquireTextureSprite === 'function') {
				const s = spritePool.acquireTextureSprite(texture);
				pooledSprites.push(s);
				return s;
			}
			const s = new Sprite(texture); pooledSprites.push(s); return s;
		};

		const overlay = pool ? pool.acquireGraphics() : new Graphics();
		pooledGraphics.push(overlay);
		overlay.clear();
		overlay.rect(0, 0, this.screenWidth, this.screenHeight).fill({ color: 0x000000, alpha: 0.7 });
		overlay.interactive = true;
		(overlay as any).eventMode = 'static';
		overlay.cursor = GameConstants.IS_MOBILE ? 'default' : 'pointer';
		overlay.alpha = 1;
		(overlay as any).zIndex = 0;

		const releaseAllAndDestroy = () => {
			try {
				
				if (viewportRef && (viewportRef as any).mask) {
					try { (viewportRef as any).mask = null; } catch {}
				}
				
				try { overlayContainer.removeChildren(); } catch {}
				
				if (pool) {
					pooledTexts.forEach(t => { try { if (t.parent) t.parent.removeChild(t); } catch {} try { pool.releaseText(t); } catch (e) { try { t.destroy(); } catch {} } });
					pooledGraphics.forEach(g => { try { if (g.parent) g.parent.removeChild(g); } catch {} try { pool.releaseGraphics(g); } catch (e) { try { g.destroy(); } catch {} } });
				}
				if (spritePool) {
					try { pooledSprites.forEach((s: Sprite) => { try { if (s.parent) s.parent.removeChild(s); } catch {} spritePool.release(s); }); } catch (e) { try { pooledSprites.forEach(s => s.destroy()); } catch {} }
				} else {
					pooledSprites.forEach(s => { try { if (s.parent) s.parent.removeChild(s); } catch {} });
				}
			} catch (e) {
			}
			try { if (overlayContainer.parent) overlayContainer.parent.removeChild(overlayContainer); } catch {}
			try { overlayContainer.destroy({ children: false }); } catch {}
		};

		overlay.on('pointerdown', (e: any) => { if (!GameConstants.IS_MOBILE) { releaseAllAndDestroy(); } else { e.stopPropagation?.(); } });
		let boxWidth = scalePx(300, this.screenWidth, this.screenHeight);
		let boxHeight = scalePx(450, this.screenWidth, this.screenHeight);
		let spacing = scalePx(25, this.screenWidth, this.screenHeight);
		const isMobile = GameConstants.IS_MOBILE;
		if (isMobile) {
			
			boxWidth = Math.floor(this.screenWidth * 0.82);
			boxHeight = Math.floor(this.screenHeight * 0.55);
			spacing = Math.floor(this.screenHeight * 0.045);
		}
		
		let desktopBoxesYOffset = 0;
		if (!isMobile) {
			
			const barH = Math.max(46, Math.floor(this.screenHeight * 0.05));
			const barW = boxWidth; 
			
			const gapAfterBar = Math.max(16, Math.floor(this.screenHeight * 0.018));
			const totalGroupH = barH + gapAfterBar + boxHeight; 
			const barY = Math.max(10, Math.floor((this.screenHeight - totalGroupH) / 2));
			const barX = Math.floor((this.screenWidth - barW) / 2);
			const betBar = new Graphics();
			betBar.roundRect(0,0,barW, barH, 10).fill({ color: 0xffffff, alpha: 0.95 }); 
			betBar.x = barX; betBar.y = barY;
			(betBar as any).zIndex = 50;
			overlayContainer.addChild(betBar);
			const betLabel = new Text({
				text: 'BET',
				style: { fontFamily: GameConstants.FONTS.DEFAULT, fontSize: Math.max(14, Math.floor(barH * 0.32)), fill: 0x000000, fontWeight: 'bold' }
			});
			betLabel.anchor.set(0.5);
			betLabel.x = barX + barW * 0.18;
			betLabel.y = barY + barH * 0.37;
			(betLabel as any).zIndex = 51;
			overlayContainer.addChild(betLabel);
			const betTxt = new Text({
				text: `${GameConstants.currency}${this._client.realAmount.toFixed(2).replace('.', ',')}`,
				
				style: { fontFamily: GameConstants.FONTS.DEFAULT, fontSize: Math.max(14, Math.floor(barH * 0.40)), fill: 0x000000, fontWeight: 'bold' }
			});
			betTxt.anchor.set(0.5);
			
			betTxt.x = betLabel.x;
			betTxt.y = betLabel.y + Math.max(6, Math.floor(barH * 0.30));
			(betTxt as any).zIndex = 51;
			overlayContainer.addChild(betTxt);
			const mkBtn = (sign: '+' | '-') => {
				const g = new Graphics();
				const size = Math.floor(barH * 0.7);
				g.roundRect(-size/2, -size/2, size, size, 8).fill({ color: 0x000000, alpha: 0.15 });
				const lw = Math.max(2, Math.floor(size * 0.14));
				g.moveTo(-size * 0.28, 0).lineTo(size * 0.28, 0).stroke({ color: 0x000000, width: lw });
				if (sign === '+') g.moveTo(0, -size * 0.28).lineTo(0, size * 0.28).stroke({ color: 0x000000, width: lw });
				g.cursor = 'pointer';
				g.interactive = true; (g as any).eventMode = 'static';
				(g as any).zIndex = 52;
				return g;
			};
			const minusBtn = mkBtn('-');
			const plusBtn = mkBtn('+');
			minusBtn.x = barX + barW * 0.60; plusBtn.x = barX + barW * 0.75;
			minusBtn.y = plusBtn.y = barY + barH / 2;
			overlayContainer.addChild(minusBtn, plusBtn);
			const onChangeBet = (dir: -1 | 1) => {
				if (this._client.isProcessingSpin) return;
				dir < 0 ? this._client.DownBet() : this._client.UpBet();
				this.updateBetDisplay();
				betTxt.text = `${GameConstants.currency}${this._client.realAmount.toFixed(2).replace('.', ',')}`;
				boxUpdaters.forEach(fn => { try { fn(); } catch {} });
			};
			minusBtn.on('pointerdown', (e: any) => { e.stopPropagation?.(); onChangeBet(-1); });
			plusBtn.on('pointerdown', (e: any) => { e.stopPropagation?.(); onChangeBet(1); });
			desktopBoxesYOffset = barY + barH + gapAfterBar;
		}
 
		
		const boxUpdaters: Array<() => void> = [];

		const createBox = (
			title: string,
			desc: string,
			texture: Texture,
			priceMultiplier: number,
			buttonText: string,
			buttonColor: number,
			onClick: () => void
		) => {
			
			const titleScale = GameConstants.IS_MOBILE ? 1.8 : 1.0;
			const descScale = GameConstants.IS_MOBILE ? 1.6 : 1.0;
			const amountScale = GameConstants.IS_MOBILE ? 1.8 : 1.0;
			const ctaTextScale = GameConstants.IS_MOBILE ? 1.6 : 1.0;
			
			const box = new Container();
			const boxBg = pool ? pool.acquireGraphics() : new Graphics();
			pooledGraphics.push(boxBg); 
			try { boxBg.clear(); } catch {}
			boxBg.roundRect(0, 0, boxWidth, boxHeight, 10).fill({ color: GameConstants.COLORS.WHITE, alpha: 0.9 });
			box.alpha = 1;
			box.visible = true;
			(box as any).zIndex = 0;
			
			
			(box as any).hitArea = new Rectangle(0, 0, boxWidth, boxHeight);
			
			(box as any)._origW = boxWidth; (box as any)._origH = boxHeight;
			
			
			(box as any).interactive = true; (box as any).eventMode = 'static';
			(boxBg as any).interactive = true; (boxBg as any).eventMode = 'static';
			if (!GameConstants.IS_MOBILE) {
				box.on?.('pointerdown', (e: any) => { e.stopPropagation?.(); });
				boxBg.on?.('pointerdown', (e: any) => { e.stopPropagation?.(); });
			}

			const titleText = acquireText();
			titleText.text = title;
			titleText.anchor && titleText.anchor.set && titleText.anchor.set(0.5);
			(titleText.style as any).fontFamily = "Bebas Neue";
			(titleText.style as any).fontSize = (scalePx(GameConstants.IS_MOBILE ? 50 : 35, this.screenWidth, this.screenHeight) as number) * titleScale as any;
			(titleText.style as any).fill = GameConstants.COLORS.BLACK as any;
			(titleText.style as any).align = "center" as any;
			titleText.alpha = 1;
			titleText.visible = true;
			titleText.anchor.set(0.5);
			titleText.x = boxWidth / 2;
			
			titleText.y = boxHeight / 7;

			const descText = acquireText();
			descText.text = desc;
			descText.anchor && descText.anchor.set && descText.anchor.set(0.5);
			(titleText.style as any);
			(descText.style as any).fontFamily = "Arial";
			(descText.style as any).fontSize = (scalePx(GameConstants.IS_MOBILE ? 22 : 16, this.screenWidth, this.screenHeight) as number) * descScale as any;
			(descText.style as any).fill = GameConstants.COLORS.BLACK as any;
			(descText.style as any).align = "center" as any;
			(descText.style as any).wordWrap = true;
			(descText.style as any).wordWrapWidth = boxWidth * 0.92;
			descText.alpha = 0.75;
			descText.visible = true;
			descText.anchor.set(0.5, GameConstants.IS_MOBILE ? 0 : 0.5);
			descText.x = boxWidth / 2;
			if (GameConstants.IS_MOBILE) {
				const pad = Math.max(8, Math.floor(this.screenHeight * 0.006));
				descText.y = titleText.y + titleText.height / 2 + pad;
			} else {
				descText.y = titleText.y + scalePx(45, this.screenWidth, this.screenHeight);
			}
			descText.alpha = 0.75;

			const image = acquireSprite(texture);
			image.width = boxWidth * (GameConstants.IS_MOBILE ? 0.45 : 0.5);
			image.height = image.width;
			image.x = (boxWidth - image.width) / 2;
			if (GameConstants.IS_MOBILE) {
				const pad = Math.max(8, Math.floor(this.screenHeight * 0.006));
				image.y = descText.y + descText.height + pad;
			} else {
				image.y = descText.y + descText.height + scalePx(10, this.screenWidth, this.screenHeight);
			}

			const volatilityText = acquireText();
			volatilityText.text = `Volatility: Very High`;
			volatilityText.anchor && volatilityText.anchor.set && volatilityText.anchor.set(0.5);
			(volatilityText.style as any).fontFamily = "Arial";
			(volatilityText.style as any).fontSize = scalePx(GameConstants.IS_MOBILE ? 30 : 16, this.screenWidth, this.screenHeight) as any;
			(volatilityText.style as any).fill = GameConstants.COLORS.BLACK as any;
			(volatilityText.style as any).align = "center" as any;
			volatilityText.anchor.set(0.5);
			volatilityText.x = boxWidth / 2;
			
			const volPad = GameConstants.IS_MOBILE 
				? Math.max(16, Math.floor(this.screenHeight * 0.025)) 
				: scalePx(20, this.screenWidth, this.screenHeight);
			volatilityText.y = image.y + image.height + volPad;
			volatilityText.alpha = 0.75;
			
			volatilityText.visible = true;

			const amountText = acquireText();
			const makeAmount = () => `${GameConstants.currency}${(this._client.realAmount * priceMultiplier).toFixed(2).replace(".", ",")}`;
			amountText.text = makeAmount();
			amountText.anchor && amountText.anchor.set && amountText.anchor.set(0.5);
			(amountText.style as any).fontFamily = "Arial";
			(amountText.style as any).fontSize = (scalePx(GameConstants.IS_MOBILE ? 40 : 28, this.screenWidth, this.screenHeight) as number) * amountScale as any;
			(amountText.style as any).fill = GameConstants.COLORS.BLACK as any;
			(amountText.style as any).fontWeight = "bold";
			(amountText.style as any).align = "center" as any;
			amountText.alpha = 1;
			amountText.visible = true;
			amountText.anchor.set(0.5);
			amountText.x = boxWidth / 2;
			if (GameConstants.IS_MOBILE) {
				const btnH = boxHeight / 6;
				const pad = Math.max(8, Math.floor(this.screenHeight * 0.006));
				amountText.y = boxHeight - btnH - (amountText.height / 2) - pad;
			} else {
				amountText.y = volatilityText.y + scalePx(30, this.screenWidth, this.screenHeight);
			}
			
			boxUpdaters.push(() => { amountText.text = makeAmount(); });

			
			const button = pool ? pool.acquireGraphics() : new Graphics();
			pooledGraphics.push(button);
			button.rect(0, 0, boxWidth, boxHeight / 6).fill({ color: buttonColor, alpha: 1 });
			button.y = boxHeight - (boxHeight / 6);
			button.cursor = "pointer";
			button.interactive = true;
			(button as any).eventMode = 'static';
			
			const tapThreshold = GameConstants.IS_MOBILE ? Math.max(8, Math.floor(this.screenHeight * 0.005)) : 4;
			let downX = 0, downY = 0, dragged = false, pressed = false;
			const onBtnDown = (e: any) => {
				pressed = true;
				dragged = false;
				downX = e.global?.x ?? e.data?.global?.x ?? 0;
				downY = e.global?.y ?? e.data?.global?.y ?? 0;
				
			};
			const onBtnMove = (e: any) => {
				if (!pressed) return;
				const gx = e.global?.x ?? e.data?.global?.x ?? 0;
				const gy = e.global?.y ?? e.data?.global?.y ?? 0;
				if (!dragged) {
					const dx = Math.abs(gx - downX);
					const dy = Math.abs(gy - downY);
					if (dx > tapThreshold || dy > tapThreshold) dragged = true;
				}
			};
			const onBtnUp = (e: any) => {
				if (!pressed) return;
				const wasDrag = dragged;
				pressed = false;
				dragged = false;
				if (!wasDrag) {
					
					e.stopPropagation?.();
					releaseAllAndDestroy();
					onClick();
				}
			};
			const onBtnCancel = () => { pressed = false; dragged = false; };
			(button as any).on('pointerdown', onBtnDown);
			(button as any).on('pointermove', onBtnMove);
			(button as any).on('pointerup', onBtnUp);
			(button as any).on('pointerupoutside', onBtnCancel);
			(button as any).on('pointercancel', onBtnCancel);

			const buttonTextObj = acquireText();
			buttonTextObj.text = buttonText;
			buttonTextObj.anchor && buttonTextObj.anchor.set && buttonTextObj.anchor.set(0.5);
			(buttonTextObj.style as any).fontFamily = "Bebas Neue";
			(buttonTextObj.style as any).fontSize = (scalePx(GameConstants.IS_MOBILE ? 46 : 38, this.screenWidth, this.screenHeight) as number) * ctaTextScale as any;
			(buttonTextObj.style as any).fill = GameConstants.COLORS.WHITE as any;
			(buttonTextObj.style as any).align = "center";
			(buttonTextObj.style as any).fontWeight = "bold";
			buttonTextObj.alpha = 1;
			buttonTextObj.visible = true;
			buttonTextObj.anchor.set(0.5);
			buttonTextObj.x = boxWidth / 2;
			buttonTextObj.y = button.y + (button.height / 2);

			box.addChild(boxBg, titleText, descText, image, volatilityText, amountText, button, buttonTextObj);
			box.interactive = false;

			return box;
		};

		const tex0: Texture = this._client.assetsLoader.box0_texture ?? this._client.assetsLoader.box1_texture ?? Texture.WHITE;
		const box1 = createBox(
			"BONUS BOOSTER",
			"Bonus game trigger chance is 4x higher each spin.",
			tex0,
			2.5,
			this._bonusboost ? "DISABLE" : "ACTIVE",
			GameConstants.COLORS.ORANGE_BRIGHT,
			() => {
				overlayContainer.destroy({ children: true });
				
				if (this._bonusboost) {
					this._bonusboost = false;
					this.resetBonusButton();
					this.resetBonusText();
					this.resetBetText();
					this._client.currentSpinType = spinType.NORMAL;
				} else {
					this._bonusboost = true;
					this.setBonusButtonOrange();
					this.setBonusTextOrange();
					this.setBetTextOrange();
					this._client.currentSpinType = spinType.BONUS_BOOST;
				}
			}
		);

		const tex1: Texture = this._client.assetsLoader.box1_texture ?? this._client.assetsLoader.box0_texture ?? Texture.WHITE;
		const box2 = createBox(
			"WOLF BONUS",
			"10 freespins with more Wolf and Wild symbols!",
			tex1,
			100,
			"BUY",
			GameConstants.COLORS.GREEN,
			() => {
				overlayContainer.destroy({ children: true });
				
				if (this._client.gameRenderer) {
					this._client.gameRenderer.InitSpin(false, spinType.BONUS);
				}
			}
		);
		const tex2: Texture = this._client.assetsLoader.box2_texture ?? this._client.assetsLoader.box1_texture ?? this._client.assetsLoader.box0_texture ?? Texture.WHITE;
		const box3 = createBox(
			"Dark Moon",
			"10 Free Spins – Wolf guaranteed each spin!",
			tex2,
			200,
			"BUY",
			GameConstants.COLORS.GREEN,
			() => {
				overlayContainer.destroy({ children: true });
					
				if (this._client.gameRenderer) {
					this._client.gameRenderer.InitSpin(false, spinType.BONUS_2);
				}
			}
		);

		if (!isMobile) {
			
			const totalWidth = boxWidth * 3 + spacing * 2;
			const startX = (this.screenWidth - totalWidth) / 2;
			let centerY = (this.screenHeight - boxHeight) / 2;
			if (desktopBoxesYOffset > 0) {
				centerY = desktopBoxesYOffset;
			}
			box1.x = startX;
			box2.x = startX + boxWidth + spacing;
			box3.x = startX + (boxWidth + spacing) * 2;
			box1.y = box2.y = box3.y = centerY;
			overlayContainer.addChild(overlay, box1, box2, box3);
		} else {
			const centerX = Math.floor((this.screenWidth - boxWidth) / 2);
			overlayContainer.addChild(overlay);
			const barPad = Math.max(10, Math.floor(this.screenWidth * 0.03));
			const safeTop = Math.max(barPad, Math.floor(this.screenHeight * 0.06));
			const barH = Math.max(48, Math.floor(this.screenHeight * 0.08));
			const barW = this.screenWidth - barPad * 2;
			
			const bottomBarH = Math.floor((scalePx(100, this.screenWidth, this.screenHeight) as number) * this.MOBILE_UI_SCALE);
			const headerText = acquireText();
			(headerText.style as any).fontFamily = GameConstants.FONTS.DEFAULT;
			const headerFontSize = Math.max(24, Math.floor(this.screenHeight * 0.05));
			(headerText.style as any).fontSize = headerFontSize;
			(headerText.style as any).fill = GameConstants.COLORS.WHITE;
			(headerText.style as any).fontWeight = 'bold';
			headerText.anchor.set(0.5);
			headerText.text = 'BONUS BUY';
			headerText.x = Math.floor(this.screenWidth / 2);
			const headerH = headerFontSize;
			headerText.y = Math.floor(safeTop + (headerH / 2));
			(headerText as any).zIndex = 990;
			const barY = Math.floor(headerText.y + headerH / 2 + Math.floor(barPad * 0.5));
			const topMargin = barY + barH + barPad;
			const topBar = pool ? pool.acquireGraphics() : new Graphics();
			pooledGraphics.push(topBar);
			try { topBar.clear(); } catch {}
			topBar.roundRect(barPad, barY, barW, barH, 10)
				.fill({ color: 0xffffff, alpha: 1 })
				.stroke({ color: 0x000000, width: 3 });
			(topBar as any).interactive = false;
			(topBar as any).eventMode = 'none';
			(topBar as any).zIndex = 200;
			const betTxt = acquireText();
			(betTxt.style as any).fontFamily = GameConstants.FONTS.DEFAULT;
			(betTxt.style as any).fontSize = Math.max(18, Math.floor(barH * 0.42));
			(betTxt.style as any).fill = GameConstants.COLORS.BLACK;
			(betTxt.style as any).fontWeight = 'bold';
			betTxt.anchor.set(0.5);
			betTxt.text = `${GameConstants.currency}${this._client.realAmount.toFixed(2).replace('.', ',')}`;
			betTxt.x = Math.floor(this.screenWidth / 2);
			betTxt.y = Math.floor(barY + barH * 0.62);
			(betTxt as any).zIndex = 210;
			const betLabel = acquireText();
			(betLabel.style as any).fontFamily = GameConstants.FONTS.DEFAULT;
			(betLabel.style as any).fontSize = Math.max(14, Math.floor(barH * 0.28));
			(betLabel.style as any).fill = GameConstants.COLORS.BLACK;
			(betLabel.style as any).fontWeight = 'bold';
			betLabel.anchor.set(0.5);
			betLabel.text = 'BET';
			betLabel.x = betTxt.x;
			betLabel.y = Math.floor(barY + barH * 0.30);
			(betLabel as any).zIndex = 205;
			
			const mkBtn = (sign: '+' | '-') => {
				const g = pool ? pool.acquireGraphics() : new Graphics();
				pooledGraphics.push(g);
				const size = Math.floor(barH * 0.72);
				g.roundRect(-size / 2, -size / 2, size, size, 8).fill({ color: 0xffffff, alpha: 0.9 }).stroke({ color: 0xffffff, width: 2 });
				
				const lw = Math.max(2, Math.floor(size * 0.12));
				g.moveTo(-size * 0.28, 0).lineTo(size * 0.28, 0).stroke({ color: 0x000000, width: lw });
				if (sign === '+') {
					g.moveTo(0, -size * 0.28).lineTo(0, size * 0.28).stroke({ color: 0x000000, width: lw });
				}
				g.cursor = 'pointer';
				(g as any).interactive = true;
				(g as any).eventMode = 'static';
				(g as any).hitArea = new Rectangle(-size / 2, -size / 2, size, size);
				(g as any).zIndex = 220;
				return g;
			};
			const minusBtn = mkBtn('-');
			const plusBtn = mkBtn('+');
			minusBtn.x = Math.floor(barPad + barH * 0.6);
			plusBtn.x = Math.floor(this.screenWidth - barPad - barH * 0.6);
			minusBtn.y = plusBtn.y = Math.floor(barY + barH / 2);
			const onChangeBet = (dir: -1 | 1) => {
				try {
					if (this._client.isProcessingSpin) return;
					dir < 0 ? this._client.DownBet() : this._client.UpBet();
					this.updateBetDisplay();
					betTxt.text = `${GameConstants.currency}${this._client.realAmount.toFixed(2).replace('.', ',')}`;
					boxUpdaters.forEach(fn => { try { fn(); } catch {} });
				} catch {}
			};
			minusBtn.on('pointerdown', (e: any) => { e.stopPropagation?.(); onChangeBet(-1); });
			plusBtn.on('pointerdown', (e: any) => { e.stopPropagation?.(); onChangeBet(1); });
			(overlayContainer as any).sortableChildren = false;
			overlayContainer.addChild(headerText, topBar, betLabel, betTxt, minusBtn, plusBtn);
			overlayContainer.sortChildren?.();
			const totalHeight = boxHeight * 3 + spacing * 2;

			const viewport = new Container();
			const maskGfx = new Graphics();
			
			const maskHeight = Math.min(
				Math.max(50, this.screenHeight - topMargin - bottomBarH),
				Math.floor(boxHeight + (boxHeight + spacing) * 0.5)
			);
			maskGfx.rect(0, 0, boxWidth, maskHeight).fill({ color: 0x000000, alpha: 1 });
			maskGfx.alpha = 1;
			(maskGfx as any).visible = true;
			(maskGfx as any).eventMode = 'none';
			viewport.mask = maskGfx as any;
			viewport.addChild(maskGfx);
			pooledGraphics.push(maskGfx);
			viewportRef = viewport;
			viewport.x = centerX;
			viewport.y = topMargin;
			
			const content = new Container();
			
			box1.x = 0; box1.y = 0;
			box2.x = 0; box2.y = boxHeight + spacing;
			box3.x = 0; box3.y = (boxHeight + spacing) * 2;
			content.addChild(box1, box2, box3);
			(viewport as any).zIndex = 50;
			viewport.addChild(content);
			
			viewport.interactive = true;
			(viewport as any).eventMode = 'static';
			viewport.cursor = 'grab';
			let dragging = false;
			let startY = 0;
			let contentStartY = 0;
			const paddingTop = Math.max(8, Math.floor(this.screenHeight * 0.01));
			const paddingBottom = Math.max(8, Math.floor(this.screenHeight * 0.01));
			const maxY = paddingTop;
			const minY = Math.min(0, maskHeight - totalHeight - paddingBottom);
			const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
			content.y = maxY;

			
			let momentumTickFn: ((time: Ticker) => void) | null = null;
			let momentumVY = 0; 
			const MAX_VY = 3.0; 
			const MIN_VY = 0.015; 
			const FRICTION_PER_MS = 0.0028; 
			const recentMoves: Array<{ t: number; y: number }> = [];
			const recentContentMoves: Array<{ t: number; y: number }> = [];

			const stopMomentum = () => {
				if (momentumTickFn) {
					try { this._client.app.ticker.remove(momentumTickFn); } catch {}
					momentumTickFn = null;
				}
				momentumVY = 0;
			};

			const startMomentum = (vy: number) => {
				vy = clamp(vy, -MAX_VY, MAX_VY);
				if (Math.abs(vy) < MIN_VY) { stopMomentum(); return; }
				
				stopMomentum();
				momentumVY = vy;
				momentumTickFn = (time: Ticker) => {
					const dt = (time.deltaMS || 16.6);
					
					const decay = Math.exp(-FRICTION_PER_MS * dt);
					momentumVY *= decay;
					
					content.y += momentumVY * dt;
					
					if (content.y > maxY) { content.y = maxY; if (momentumVY > 0) momentumVY = 0; }
					if (content.y < minY) { content.y = minY; if (momentumVY < 0) momentumVY = 0; }
					if (Math.abs(momentumVY) < MIN_VY) {
						stopMomentum();
					}
				};
				this._client.app.ticker.add(momentumTickFn);
			};

			const onDown = (e: any) => {
				dragging = true;
				startY = e.global?.y ?? e.data?.global?.y ?? 0;
				contentStartY = content.y;
				e.stopPropagation?.();
				viewport.cursor = 'grabbing';
				recentMoves.length = 0;
				recentContentMoves.length = 0;
				const t0 = performance.now();
				recentMoves.push({ t: t0, y: startY });
				recentContentMoves.push({ t: t0, y: contentStartY });
				stopMomentum(); 
			};
			const onMove = (e: any) => {
				if (!dragging) return;
				const gy = e.global?.y ?? e.data?.global?.y ?? 0;
				const dy = gy - startY;
				const newY = clamp(contentStartY + dy, minY, maxY);
				content.y = newY;
				const now = performance.now();
				recentMoves.push({ t: now, y: gy });
				recentContentMoves.push({ t: now, y: content.y });
				while (recentMoves.length > 2 && now - recentMoves[0].t > 140) recentMoves.shift();
				while (recentContentMoves.length > 2 && now - recentContentMoves[0].t > 140) recentContentMoves.shift();
			};
			const onUp = () => {
				dragging = false;
				viewport.cursor = 'grab';
				
				let vyPointer = 0, vyContent = 0;
				const np = recentMoves.length;
				if (np >= 2) {
					const last = recentMoves[np - 1];
					let idx = 0;
					for (let i = np - 2; i >= 0; i--) { if (last.t - recentMoves[i].t >= 50) { idx = i; break; } }
					const first = recentMoves[idx];
					const dt = Math.max(1, last.t - first.t);
					vyPointer = (last.y - first.y) / dt; 
				}
				const nc = recentContentMoves.length;
				if (nc >= 2) {
					const last = recentContentMoves[nc - 1];
					let idx = 0;
					for (let i = nc - 2; i >= 0; i--) { if (last.t - recentContentMoves[i].t >= 50) { idx = i; break; } }
					const first = recentContentMoves[idx];
					const dt = Math.max(1, last.t - first.t);
					vyContent = (last.y - first.y) / dt; 
				}
				const vy = Math.abs(vyPointer) >= Math.abs(vyContent) ? vyPointer : vyContent;
				startMomentum(vy);
			};
			viewport.on('pointerdown', onDown);
			viewport.on('pointermove', onMove);
			viewport.on('pointerup', () => { onUp(); });
			viewport.on('pointerupoutside', () => { onUp(); });
			viewport.on('pointercancel', () => { onUp(); });
			
			const closeSize = Math.max(28, Math.floor(this.screenWidth * 0.07));
			const closePad = Math.max(10, Math.floor(this.screenWidth * 0.03));
			const closeBtn = pool ? pool.acquireGraphics() : new Graphics();
			pooledGraphics.push(closeBtn);
			try {
				closeBtn.clear();
				const s = Math.floor(closeSize * 0.45);
				closeBtn.moveTo(-s, -s).lineTo(s, s).stroke({ color: 0xffffff, width: 6 });
				closeBtn.moveTo(s, -s).lineTo(-s, s).stroke({ color: 0xffffff, width: 6 });
				closeBtn.cursor = 'pointer';
				closeBtn.interactive = true;
				(closeBtn as any).eventMode = 'static';
				(closeBtn as any).alpha = 1;
				(closeBtn as any).visible = true;
				closeBtn.hitArea = new Rectangle(-Math.floor(closeSize / 2), -Math.floor(closeSize / 2), closeSize, closeSize);
			} catch {}
			closeBtn.x = Math.floor(this.screenWidth - closePad - closeSize / 2);
			closeBtn.y = Math.floor(closePad + closeSize / 2);
			(overlayContainer as any).sortableChildren = true;
			(closeBtn as any).zIndex = 1000;
			closeBtn.on('pointerdown', (e: any) => { e.stopPropagation?.(); releaseAllAndDestroy(); });
			overlayContainer.addChild(viewport, closeBtn);
			
			if (GameConstants.IS_MOBILE) {
				const bottomBar = pool ? pool.acquireGraphics() : new Graphics();
				pooledGraphics.push(bottomBar);
				try {
					bottomBar.clear();
					bottomBar.rect(0, 0, this.screenWidth, bottomBarH).fill({ color: 0x000000, alpha: 0.85 });
				} catch {}
				bottomBar.x = 0;
				bottomBar.y = Math.max(0, this.screenHeight - bottomBarH);
				(bottomBar as any).zIndex = 2000;

				const balText = acquireText();
				(balText.style as any).fontFamily = GameConstants.FONTS.DEFAULT;
				const baseWinFont = Math.max(18, Math.floor(bottomBarH * 0.5));
				(balText.style as any).fontSize = baseWinFont;
				(balText.style as any).fill = GameConstants.COLORS.WHITE;
				(balText.style as any).fontWeight = 'bold';
				balText.text = `${GameConstants.currency}${this._client.reelbalance.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
				balText.anchor.set(0.5);
				balText.x = Math.floor(this.screenWidth / 2);
				balText.y = Math.floor(bottomBar.y + bottomBarH / 2);
				(balText as any).zIndex = 2010;

				
				overlayContainer.addChild(bottomBar);
				overlayContainer.addChild(balText);
			}
			overlayContainer.sortChildren?.();
		}
		this.container.addChild(overlayContainer);
	}

	private createAutoSpinButton(boxWidth: number, boxHeight: number): Container {
		const isMobile = GameConstants.IS_MOBILE;
		if (isMobile) {
			
			const r = (scalePx(50, this.screenWidth, this.screenHeight) as number) * this.MOBILE_UI_SCALE; 
			const container = new Container();
			const bg = makeHiResCircleSprite(this._client.app, r, { fill: 0x000000, fillAlpha: 0.6, ssaa: 3 });
			(bg as any).label = 'autoBg';
			bg.anchor.set(0);
			bg.x = 0; bg.y = 0;
			this.setNamed(container, 'autoBg', bg);
			this.autoSpinText = new Text({
				text: "AUTO",
				style: {
					fontFamily: GameConstants.FONTS.DEFAULT,
					fontSize: scalePx(22, this.screenWidth, this.screenHeight) * this.MOBILE_UI_SCALE,
					fill: GameConstants.COLORS.WHITE,
					fontWeight: "bold",
					align: 'center'
				}
			});
			this.autoSpinText.anchor.set(0.5);
			this.autoSpinText.x = r;
			this.autoSpinText.y = r;
			container.addChild(bg);
			container.addChild(this.autoSpinText);
			container.interactive = true;
			container.cursor = 'pointer';
			container.on('pointerdown', () => {
				
				if (this._isAutoSpinMenuOpen) { this.toggleAutoSpin(); return; }
				
				bg.alpha = 0.85;
				this.toggleAutoSpin();
			});
			container.on('pointerup', () => { if (!this._isAutoSpinMenuOpen) bg.alpha = 1.0; });
			container.on('pointerupoutside', () => { if (!this._isAutoSpinMenuOpen) bg.alpha = 1.0; });
			return container;
		} else {
			
			const extraBtnScale = 1.0;
			const buttonWidth = scalePx(GameConstants.AUTO_SPIN.BUTTON_WIDTH, this.screenWidth, this.screenHeight) * this.MOBILE_UI_SCALE * extraBtnScale;
			const buttonHeight = scalePx(GameConstants.AUTO_SPIN.BUTTON_HEIGHT, this.screenWidth, this.screenHeight) * this.MOBILE_UI_SCALE * extraBtnScale;
			const container = new Container();
			const buttonBg = new Graphics()
				.roundRect(0, 0, buttonWidth, buttonHeight, 5)
				.fill({alpha: 0.0 })
				.stroke({ color: GameConstants.COLORS.WHITE, width: 2 });
			this.autoSpinText = new Text({
				text: "AUTO",
				style: {
					fontFamily: GameConstants.FONTS.DEFAULT,
					fontSize: scalePx(16, this.screenWidth, this.screenHeight) * this.MOBILE_UI_SCALE * extraBtnScale,
					fill: GameConstants.COLORS.WHITE,
					fontWeight: "bold",
					align: 'center'
				}
			});
			this.autoSpinText.anchor.set(0.5);
			this.autoSpinText.x = buttonWidth / 2;
			this.autoSpinText.y = buttonHeight / 2;
			container.addChild(buttonBg);
			container.addChild(this.autoSpinText);
			container.interactive = true;
			container.cursor = 'pointer';
			container.x = boxWidth - buttonWidth - 80;
			container.y = (boxHeight - buttonHeight) / 2;
			container.on('pointerover', () => {
				buttonBg.clear();
				buttonBg.roundRect(0, 0, buttonWidth, buttonHeight, 5)
					.fill({ color: GameConstants.COLORS.BLACK, alpha: 0.9 })
					.stroke({ color: GameConstants.COLORS.WHITE, width: 2 });
			});
			container.on('pointerout', () => {
				buttonBg.clear();
				buttonBg.roundRect(0, 0, buttonWidth, buttonHeight, 5)
					.fill({ alpha: 0 })
					.stroke({ color: GameConstants.COLORS.WHITE, width: 2 });
			});
			container.on('pointerdown', () => { this.toggleAutoSpin(); });
			return container;
		}
	}

	private updateBalanceDisplay() {
		this.balanceText.text = `${GameConstants.currency}${this._client.reelbalance.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
		this.balanceText.style.fill = GameConstants.COLORS.WHITE;
	}

	private updateBetDisplay() {
		if (this.betText) {
			let bet = this._client.realAmount;
			if (this._client.currentSpinType == spinType.BONUS_BOOST) bet *= 2.5;
			this.betText.text = `${GameConstants.currency}${bet.toFixed(2).replace(".", ",")}`;
		}
	}

	
	public getContainer(): Container {
		return this.container;
	}

	
	public setBalance(value: number): void {
		if (this.balanceText) {
			this.balanceText.text = `${GameConstants.currency}${value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
			(this.balanceText.style as any).fill = GameConstants.COLORS.WHITE as any;
		}
	}

	public setBet(value: number): void {
		if (this.betText) {
			let bet = value;
			if (this._client.currentSpinType == spinType.BONUS_BOOST) bet *= 2.5;
			this.betText.text = `${GameConstants.currency}${bet.toFixed(2).replace(".", ",")}`;
		}
	}

	public getBonusButton(): Container {
		return this.bonusButton;
	}

	public get isTurboMode(): boolean {
		return this._client.isTurboMode;
	}

	public get isBonusBoostActive(): boolean {
		return this._bonusboost;
	}

	public showFreespinCounter(current: number, total: number): void {
		this.hideFreespinCounter();
		if (this._isAutoSpinActive) {
			this.stopAutoSpin();
		}
		this.hideAutoSpinButton();
		
		if (GameConstants.IS_MOBILE) {
			if (this.betLabel) this.betLabel.visible = false;
			if (this.betText) this.betText.visible = false;
		}
		const boxHeight = scalePx(100, this.screenWidth, this.screenHeight);
		this.freespinLabel = new Text({
			text: "FREE SPINS",
			style: {
				fontFamily: GameConstants.FONTS.DEFAULT,
				fontSize: GameConstants.FONTS.SIZE_SMALL,
				fill: GameConstants.COLORS.GOLD,
				fontWeight: "bold"
			}
		});
		if (GameConstants.IS_MOBILE) {
			(this.freespinLabel as any).anchor?.set?.(1, 0.5);
			const pad = Math.max(10, Math.floor(this.screenWidth * 0.03));
			const gap = Math.max(8, Math.floor(this.screenWidth * 0.02));
			const twLeftX = this.totalWinContainer ? this.totalWinContainer.x : (this.getBottomBarWidth() - pad);
			this.freespinLabel.x = Math.max(0, twLeftX - gap);
			this.freespinLabel.y = boxHeight / 4;
		} else {
			this.freespinLabel.x = this.boxContainer.width / 2 - 50;
			this.freespinLabel.y = boxHeight / 4;
		}
		this.boxContainer.addChild(this.freespinLabel);

		this.freespinText = new Text({
			text: `${current}/${total}`,
			style: {
				fontFamily: GameConstants.FONTS.DEFAULT,
				fontSize: GameConstants.FONTS.SIZE_LARGE,
				fill: GameConstants.COLORS.GOLD,
				fontWeight: "bold"
			}
		});
		if (GameConstants.IS_MOBILE) {
			(this.freespinText as any).anchor?.set?.(1, 0.5);
			const pad = Math.max(10, Math.floor(this.screenWidth * 0.03));
			const gap = Math.max(8, Math.floor(this.screenWidth * 0.02));
			const twLeftX = this.totalWinContainer ? this.totalWinContainer.x : (this.getBottomBarWidth() - pad);
			this.freespinText.x = Math.max(0, twLeftX - gap);
			this.freespinText.y = this.freespinLabel.y + 25;
		} else {
			this.freespinText.x = this.freespinLabel.x + 15;
			this.freespinText.y = this.freespinLabel.y + 25;
		}
		this.boxContainer.addChild(this.freespinText);
	}

	public hideFreespinCounter(): void {
		if (this.freespinLabel) {
			this.boxContainer.removeChild(this.freespinLabel);
			this.freespinLabel.destroy();
			this.freespinLabel = null;
		}
		
		if (this.freespinText) {
			this.boxContainer.removeChild(this.freespinText);
			this.freespinText.destroy();
			this.freespinText = null;
		}
		
		if (GameConstants.IS_MOBILE) {
			if (this.betLabel) this.betLabel.visible = true;
			if (this.betText) this.betText.visible = true;
		}
	}

	public updateFreespinCounter(current: number, total: number): void {
		if (this.freespinText) {
			this.freespinText.text = `${current}/${total}`;
		}
	}

	
	public hideBonusButton(): void {
		if (this.bonusButton) {
			this.bonusButton.visible = false;
		}
	}

	public showBonusButton(): void {
		if (this.bonusButton) {
			this.bonusButton.visible = true;
		}
	}

	private toggleMenu(): void {
		if (this._isMenuOpen) {
			this.closeMenu();
		} else {
			this.openMenu();
		}
	}

	private openMenu(): void {
		if (this.autoSpinMenuContainer) {
			this.hideAutoSpinMenu();
		}

		this._isMenuOpen = true;
		this.createMenuContainer();
		this.updateInfoButtonToX();

		this.addGlobalClickListener();
	}

	private closeMenu(): void {
		this._isMenuOpen = false;
		
		if (this.mobileMenuOverlay) {
			try { this.container.removeChild(this.mobileMenuOverlay); } catch {}
			const pool: ObjectPool | undefined = this._client.gameRenderer?.objectPool;
			if (pool) {
				try { this.mobileMenuOverlay.clear(); } catch {}
				pool.releaseGraphics(this.mobileMenuOverlay);
			}
			this.mobileMenuOverlay = null;
		}
		if (this.menuContainer) {
			const pool: ObjectPool | undefined = this._client.gameRenderer?.objectPool;
			if (pool) {
				this.releaseDisplayObjectDeep(this.menuContainer as any, pool);
			} else {
				this.container.removeChild(this.menuContainer);
			}

			this.menuContainer = null;
		}
		this.updateInfoButtonToNormal();

		
		if (GameConstants.IS_MOBILE && this.infoButton) {
			try { (this.infoButton as any).zIndex = 1990; } catch {}
			this.container.sortChildren?.();
		}


		this.removeGlobalClickListener();
	}

	private addGlobalClickListener(): void {
		this.container.interactive = true;
		this.container.on('pointerdown', this.onGlobalClick);
	}

	private removeGlobalClickListener(): void {
		this.container.off('pointerdown', this.onGlobalClick);
	}

	private onGlobalClick = (event: any): void => {
		if (!this._isMenuOpen || !this.menuContainer) return;
		const gp = event.global;
		const menuBounds = this.menuContainer.getBounds();
		const isInsideMenu = gp.x >= menuBounds.x && gp.x <= menuBounds.x + menuBounds.width && gp.y >= menuBounds.y && gp.y <= menuBounds.y + menuBounds.height;
		const infoBounds = this.infoButton?.getBounds();
		const isOnInfoButton = !!(infoBounds && gp.x >= infoBounds.x && gp.x <= infoBounds.x + infoBounds.width && gp.y >= infoBounds.y && gp.y <= infoBounds.y + infoBounds.height);
		
		if (!isInsideMenu && !isOnInfoButton) {
			this.closeMenu();
		}
	};

	private createMenuContainer(): void {
		if (!this.infoButton) return;

		if (this.menuContainer) {
			this.container.removeChild(this.menuContainer);
		}

		const pool: ObjectPool | undefined = this._client.gameRenderer?.objectPool;

		
		if (GameConstants.IS_MOBILE) {
			
			const overlay = pool ? pool.acquireGraphics() : new Graphics();
			try { overlay.clear(); } catch {}
			overlay.rect(0, 0, this.screenWidth, this.screenHeight).fill({ color: 0x000000, alpha: 0.6 });
			(overlay as any).interactive = true;
			(overlay as any).eventMode = 'static';
			
			(overlay as any).zIndex = 2005;
			
			overlay.on('pointerdown', (e: any) => e.stopPropagation?.());
			overlay.on('pointerup', (e: any) => e.stopPropagation?.());
			overlay.on('pointertap', (e: any) => e.stopPropagation?.());
			this.mobileMenuOverlay = overlay;
			this.container.addChild(overlay);

			
			const grid = pool ? pool.acquireContainer() : new Container();
			(grid as any).zIndex = 2015; 
			grid.sortableChildren = false;
			(grid as any).interactive = true;
			(grid as any).eventMode = 'auto';

			const menuItems = ['HOMEPAGE', 'INFO', 'SOUND', 'MUSIC', 'SUPER TURBO', 'TURBO'];
			const cols = 2;
			const rightPad = Math.max(8, Math.floor(this.screenWidth * 0.02));
			const leftPad = Math.max(8, Math.floor(this.screenWidth * 0.02));
			const gapX = Math.max(6, Math.floor(this.screenWidth * 0.02));
			const gapY = Math.max(4, Math.floor(this.screenHeight * 0.008));
			const tileW = Math.floor((this.screenWidth - leftPad - rightPad - gapX) / cols);
			const tileH = Math.max(44, Math.floor(this.screenHeight * 0.075));
			const infoY = (this.infoButton as any)?.y ?? this.screenHeight * 0.9; 

			menuItems.forEach((label, idx) => {
				const row = Math.floor(idx / cols);
				const col = idx % cols; 
				const rightX = this.screenWidth - rightPad - tileW;
				const leftX = rightX - gapX - tileW;
				const x = col === 1 ? rightX : leftX;
				const y = infoY - (row + 1) * (tileH + gapY);
				const tile = pool ? pool.acquireContainer() : new Container();
				(tile as any).label = label;
				tile.sortableChildren = false;
				tile.x = Math.max(leftPad, x);
				tile.y = Math.max(8, y);
				const bg = pool ? pool.acquireGraphics() : new Graphics();
				try { bg.clear(); } catch {}
				bg.roundRect(0, 0, tileW, tileH, 0)
					.fill({ color: 0x000000, alpha: 0.9 })
					.stroke({ color: 0xffffff, width: 2 });
				(bg as any).zIndex = 0;
				let t: Text;
				if (pool) t = pool.acquireText(); else t = new Text({ text: '', style: {} } as any);
				t.text = label;
				(t.style as any).fontFamily = 'BEBAS NEUE';
				(t.style as any).fontSize = Math.max(22, Math.floor(tileH * 0.45));
				(t.style as any).fill = this.getMenuItemColor(label) as any;
				(t.style as any).fontWeight = 'bold';
				(t.style as any).align = 'center';
				t.anchor?.set?.(0.5);
				t.x = tileW / 2; t.y = tileH / 2;
				(t as any).zIndex = 1;
				tile.addChild(bg);
				tile.addChild(t);
				(tile as any).hitArea = new Rectangle(0, 0, tileW, tileH);
				tile.interactive = true;
				(tile as any).eventMode = 'static';
				tile.cursor = 'pointer';
				
				tile.on('pointerdown', (e: any) => { 
					e.stopPropagation?.(); 
					try { bg.clear(); bg.roundRect(0,0,tileW,tileH,0).fill({ color: 0x000000, alpha: 1.0 }).stroke({ color: 0xffffff, width: 2 }); } catch {}
				});
				
				tile.on('pointerup', (e: any) => { 
					e.stopPropagation?.(); 
					try { bg.clear(); bg.roundRect(0,0,tileW,tileH,0).fill({ color: 0x000000, alpha: 0.9 }).stroke({ color: 0xffffff, width: 2 }); } catch {}
					this.handleMenuButtonClick(label); 
				});
				tile.on('pointerupoutside', (e: any) => { 
					e.stopPropagation?.(); 
					try { bg.clear(); bg.roundRect(0,0,tileW,tileH,0).fill({ color: 0x000000, alpha: 0.9 }).stroke({ color: 0xffffff, width: 2 }); } catch {}
				});
				grid.addChild(tile);
			});

			this.menuContainer = grid;
			this.container.addChild(grid);
			
			try {
				(this.autoSpinButton as any).zIndex = 2000;
				(this.infoButton as any).zIndex = 2020; 
			} catch {}
			this.container.sortChildren?.();
			return;
		}

		
		let wrapper: Container;
		if (pool) wrapper = pool.acquireContainer();
		else wrapper = new Container();
		const isMobile = GameConstants.IS_MOBILE;
		
		const menuWidth = isMobile ? 360 : 180; 
		const buttonHeight = isMobile ? 90 : 45; 
		const buttonSpacing = isMobile ? 14 : 7; 
		const verticalPadding = isMobile ? 20 : 10; 
		const menuItems = ['HOMEPAGE', 'INFO', 'SOUND', 'MUSIC', 'SUPER TURBO', 'TURBO'];
		const menuHeight = verticalPadding + (menuItems.length * (buttonHeight + buttonSpacing)) - buttonSpacing + verticalPadding;

		const menuBg: Graphics = pool ? pool.acquireGraphics() : new Graphics();
		menuBg.roundRect(0, 0, menuWidth, menuHeight, 10)
			.fill({ color: 0x000000, alpha: 0.8 })
			.stroke({ color: 0xffffff, width: 2 });
		(menuBg as any).interactive = false;
		(menuBg as any).eventMode = 'none';
		wrapper.addChild(menuBg);

		this.menuContainer = wrapper;
		(this.menuContainer as any).interactive = true;
		(this.menuContainer as any).eventMode = 'auto';
		
		this.menuContainer.x = this.boxContainer.x + this.boxContainer.width - menuWidth;
		this.menuContainer.y = this.boxContainer.y - menuHeight;
		this.menuContainer.zIndex = 1000;

		menuItems.forEach((item, index) => {
			const button = this.createMenuButton(item, index, buttonHeight, buttonSpacing, menuWidth, pool);
			(this.menuContainer as any).addChild(button);
		});

		this.container.addChild(this.menuContainer);
		
	}

	private createMenuButton(text: string, index: number, buttonHeight: number, buttonSpacing: number, menuWidth: number, pool?: ObjectPool): Container {
		const button = new Container();
		
		(button as any).label = text;
		button.y = 10 + (index * (buttonHeight + buttonSpacing));
		button.x = 10;

		

		   let buttonText: Text;
		   if (pool) {
			   buttonText = pool.acquireText();
			   buttonText.text = text;
			   
			   buttonText.style.fontFamily = 'BEBAS NEUE';
			   buttonText.style.fontSize = (GameConstants.IS_MOBILE ? 50 : 25) as any; 
			   buttonText.style.fill = this.getMenuItemColor(text) as any;
			   (buttonText.style as any).fontWeight = 'bold';
			   buttonText.style.align = 'center' as any;
			   
			   if (buttonText.anchor && typeof buttonText.anchor.set === 'function') {
				   buttonText.anchor.set(0, 0.5);
			   }
		   } else {
			   buttonText = new Text(text, {
				   fontFamily: 'BEBAS NEUE',
				   fontSize: GameConstants.IS_MOBILE ? 50 : 25,
				   fill: this.getMenuItemColor(text), 
				   fontWeight: 'bold',
				   align: 'center'
			   });
			   buttonText.anchor.set(0, 0.5);
		   }
		   buttonText.x = 15;
		   buttonText.y = buttonHeight / 2;

		button.addChild(buttonText);
		
		(buttonText as any).label = text;

		
		const buttonWidth = menuWidth - 20; 
		(button as any).hitArea = new Rectangle(0, 0, buttonWidth, buttonHeight);

		
		button.interactive = true;
		(button as any).eventMode = 'static';
		button.cursor = 'pointer';

		button.on('pointerover', () => {
			buttonText.style.fill = 0xffffff; 
		});

		button.on('pointerout', () => {
			buttonText.style.fill = this.getMenuItemColor(text); 
		});

		
		button.on('pointerdown', (e: any) => {
			e?.stopPropagation?.();
			this.handleMenuButtonClick(text);
		});

		return button;
	}

	private handleMenuButtonClick(buttonText: string): void {
		switch (buttonText) {
			case 'HOMEPAGE':
				break;
			case 'INFO':
				break;
			case 'SOUND':
				this._gameSound = !this._gameSound;
				this.updateAudioStates().catch(console.warn);
				this.updateMenuDisplay();
				return;
			case 'MUSIC':
				this._gameMusic = !this._gameMusic;
				this.updateAudioStates().catch(console.warn);
				this.updateMenuDisplay();
				return;
			case 'SUPER TURBO':
				if (this._client.turboLevel == 2)
					this._client.setTurboLevel(0);
				else
					this._client.setTurboLevel(2);
				this.updateMenuDisplay();
				return;
			case 'TURBO':
				this._client.cycleTurboLevel();
				this.updateMenuDisplay();
				return;
		}
		this.closeMenu();
	}

	
	private async updateAudioStates(): Promise<void> {
		
		try {
			
			await this._assetLoader.initializeAudioContext();
			
			if (this._gameMusic) {
				
				const bgm = soundManager.find('bgm');
				if (!bgm || !bgm.isPlaying) {
					await soundManager.play('bgm', { loop: true, volume: 0.5 });
				}
			} else {
				soundManager.stop('bgm');
			}
		} catch (error) {
			console.warn('Could not update music state:', error);
		}

		
		const sfxIds = ['bonus_wolf', 'payline', 'start', 'stop0', 'stop1'];
		for (const id of sfxIds) {
			try {
				const inst = soundManager.find(id);
				if (inst) {
					inst.volume = this._gameSound ? 1.0 : 0.0;
				}
			} catch {}
		}
	}

	private updateMenuDisplay(): void {
		if (!this.menuContainer) return;
		
		const findBtn = (label: string): Container | undefined => {
			return this.menuContainer!.children.find((c: any) => (c as any).label === label) as any;
		};
		const setFill = (label: string) => {
			const btn = findBtn(label);
			if (!btn) return;
			
			const txt = (btn.children?.find?.((ch: any) => ch instanceof Text) as any) as Text;
			if (!txt) return;
			
			(txt as any).style = (txt as any).style || {};
			(txt.style as any).fill = this.getMenuItemColor(label) as any;
		};
		
		const turboBtn = findBtn('TURBO');
		if (turboBtn) {
			const turboText = (turboBtn.children?.find?.((ch: any) => ch instanceof Text) as any) as Text;
			if (turboText) {
				(turboText as any).style = (turboText as any).style || {};
				(turboText.style as any).fill = this.getMenuItemColor('TURBO') as any;
				turboText.text = 'TURBO';
			}
		}
		setFill('SUPER TURBO');
		setFill('SOUND');
		setFill('MUSIC');
	}

	private getMenuItemColor(text: string): number {
		const turboLevel = this._client.turboLevel;
		if (text === 'TURBO') {
			if (turboLevel === 0) return 0xaaaaaa; 
			if (turboLevel === 1) return 0xFF6B35; 
			if (turboLevel === 2) return 0xFFD700; 
		}
		if (text === 'SUPER TURBO') {
			return turboLevel === 2 ? 0xFFD700 : 0xaaaaaa;
		}
		if (text === 'SOUND') {
			return this._gameSound ? 0xFFFFFF : 0xaaaaaa;
		}
		if (text === 'MUSIC') {
			return this._gameMusic ? 0xFFFFFF : 0xaaaaaa;
		}
		return 0xaaaaaa; 
	}

	
	private releaseDisplayObjectDeep(node: Container | Graphics | Text | Sprite, pool?: ObjectPool): void {
		if (!node) return;
		try {
			
			if ((node as any).children && Array.isArray((node as any).children)) {
				for (const child of (node as any).children.slice()) {
					this.releaseDisplayObjectDeep(child, pool);
				}
			}
			try { (node as any).parent && (node as any).parent.removeChild(node as any); } catch {}
			if (pool) {
				if ((node as any).clear !== undefined && (node as any).isSprite !== true && (node as any)._texture === undefined) {
					try { pool.releaseGraphics(node as any as Graphics); return; } catch {}
				}
				if ((node as any)._texture !== undefined && (node as any).anchor !== undefined) {
					try {
						const spritePool: any = (this._client.gameRenderer as any)?._spritePool;
						if (spritePool && typeof spritePool.release === 'function') {
							spritePool.release(node as any as Sprite);
							return;
						}
					} catch {}
				}
				if ((node as any).text !== undefined) {
					try { pool.releaseText(node as any as Text); return; } catch {}
				}
				if ((node as any).removeChildren !== undefined) {
					try { pool.releaseContainer(node as any as Container); return; } catch {}
				}
			}
			
			try { (node as any).destroy && (node as any).destroy({ children: false }); } catch {}
		} catch {}
	}

	private updateInfoButtonToX(): void {
		if (!this.infoButton) return;
		if (GameConstants.IS_MOBILE) {
			
			for (const c of this.infoButton.children) {
				if ((c as any).clear && c.label !== 'infoOverlay') { (c as any).visible = false; }
			}
			let overlay = this.getNamed<Graphics>(this.infoButton, 'infoOverlay');
			if (!overlay) { overlay = new Graphics(); overlay.label = 'infoOverlay'; this.infoButton.addChild(overlay); this.setNamed(this.infoButton, 'infoOverlay', overlay); }
			try { overlay.clear(); } catch {}
			const r = (scalePx(50, this.screenWidth, this.screenHeight) as number) * this.MOBILE_UI_SCALE;
			const size = Math.max(14, Math.floor(r * 0.8));
			const centerX = r;
			const centerY = r;
			overlay.moveTo(centerX - size/2, centerY - size/2)
				.lineTo(centerX + size/2, centerY + size/2)
				.moveTo(centerX + size/2, centerY - size/2)
				.lineTo(centerX - size/2, centerY + size/2)
				.stroke({ color: 0xffffff, width: 3 });
		} else {
			
			const graphics = this.infoButton.children[0] as Graphics;
			if (!graphics || typeof graphics.clear !== 'function') return;
			graphics.clear();
			const w = scalePx(60, this.screenWidth, this.screenHeight) * this.MOBILE_UI_SCALE;
			const h = scalePx(100, this.screenWidth, this.screenHeight) * this.MOBILE_UI_SCALE;
			graphics.roundRect(0, 0, w, h, 0)
				.fill({ color: 0x000000, alpha: 1.0 })
				.stroke({ color: 0xffffff, width: 3 });
			const size = scalePx(25, this.screenWidth, this.screenHeight) * this.MOBILE_UI_SCALE;
			const centerX = w / 2;
			const centerY = h / 2;
			graphics.moveTo(centerX - size/2, centerY - size/2)
				.lineTo(centerX + size/2, centerY + size/2)
				.moveTo(centerX + size/2, centerY - size/2)
				.lineTo(centerX - size/2, centerY + size/2)
				.stroke({ color: 0xffffff, width: 3 });
		}
	}

	private updateInfoButtonToNormal(): void {
		if (!this.infoButton) return;
		if (GameConstants.IS_MOBILE) {
			
			const overlay = this.getNamed<Graphics>(this.infoButton, 'infoOverlay');
			if (overlay) { try { overlay.clear(); } catch {} }
			for (const c of this.infoButton.children) {
				if ((c as any).clear && c.label !== 'infoOverlay') { (c as any).visible = true; }
			}
			
			const bg = this.getNamed<Sprite>(this.infoButton, 'infoBg');
			
			if (bg) { bg.alpha = 1.0; }
		} else {
			
			const graphics = this.infoButton.children[0] as Graphics;
			if (!graphics || typeof graphics.clear !== 'function') return;
			graphics.clear();
			const w = scalePx(60, this.screenWidth, this.screenHeight) * this.MOBILE_UI_SCALE;
			const h = scalePx(100, this.screenWidth, this.screenHeight) * this.MOBILE_UI_SCALE;
			graphics.roundRect(0, 0, w, h, 0)
				.fill({ color: 0x000000, alpha: 1.0 })
				.stroke({ color: 0xffffff, width: 3 });
			const lineWidth = scalePx(37.5, this.screenWidth, this.screenHeight) * this.MOBILE_UI_SCALE;
			const lineHeight = scalePx(3, this.screenWidth, this.screenHeight) * this.MOBILE_UI_SCALE;
			const lineSpacing = scalePx(8, this.screenWidth, this.screenHeight) * this.MOBILE_UI_SCALE;
			const startX = (w - lineWidth) / 2;
			const totalLinesHeight = lineHeight * 3 + lineSpacing * 2;
			const startY = (h - totalLinesHeight) / 2;
			graphics.roundRect(startX, startY, lineWidth, lineHeight, 0).fill({ color: 0xffffff })
				.roundRect(startX, startY + lineSpacing, lineWidth, lineHeight, 0).fill({ color: 0xffffff })
				.roundRect(startX, startY + (lineSpacing * 2), lineWidth, lineHeight, 0).fill({ color: 0xffffff });
		}
	}

	
	private updateAutoButtonToX(): void {
		if (!this.autoSpinButton) return;
		if (GameConstants.IS_MOBILE) {
			let overlay = this.getNamed<Graphics>(this.autoSpinButton, 'autoOverlay');
			if (!overlay) { overlay = new Graphics(); overlay.label = 'autoOverlay'; this.autoSpinButton.addChild(overlay); this.setNamed(this.autoSpinButton, 'autoOverlay', overlay); }
			try { overlay.clear(); } catch {}
			const r = (scalePx(50, this.screenWidth, this.screenHeight) as number) * this.MOBILE_UI_SCALE;
			const size = Math.max(14, Math.floor(r * 0.8));
			const cx = r;
			const cy = r;
			overlay.moveTo(cx - size/2, cy - size/2)
				.lineTo(cx + size/2, cy + size/2)
				.moveTo(cx + size/2, cy - size/2)
				.lineTo(cx - size/2, cy + size/2)
				.stroke({ color: 0xffffff, width: 3 });
		} else {
			const g = this.autoSpinButton.children[0] as Graphics;
			if (!g || typeof g.clear !== 'function') return;
			try { g.clear(); } catch {}
			const w = scalePx(60, this.screenWidth, this.screenHeight) * this.MOBILE_UI_SCALE;
			const h = scalePx(100, this.screenWidth, this.screenHeight) * this.MOBILE_UI_SCALE;
			g.roundRect(0, 0, w, h, 0)
				.fill({ color: 0x000000, alpha: 1.0 })
				.stroke({ color: 0xffffff, width: 3 });
			const size = scalePx(25, this.screenWidth, this.screenHeight) * this.MOBILE_UI_SCALE;
			const cx = w / 2;
			const cy = h / 2;
			g.moveTo(cx - size/2, cy - size/2)
				.lineTo(cx + size/2, cy + size/2)
				.moveTo(cx + size/2, cy - size/2)
				.lineTo(cx - size/2, cy + size/2)
				.stroke({ color: 0xffffff, width: 3 });
		}
		if (this.autoSpinText) {
			(this.autoSpinText as any).visible = false;
		}
	}

	
	private updateAutoButtonToNormal(): void {
		if (!this.autoSpinButton) return;
		if (GameConstants.IS_MOBILE) {
			const overlay = this.getNamed<Graphics>(this.autoSpinButton, 'autoOverlay');
			if (overlay) { try { overlay.clear(); } catch {} }
			
			const bg = this.getNamed<Sprite>(this.autoSpinButton, 'autoBg');
			
			if (bg) { bg.alpha = 1.0; }
		} else {
			const g = this.autoSpinButton.children[0] as Graphics;
			if (!g || typeof g.clear !== 'function') return;
			try { g.clear(); } catch {}
			const w = scalePx(60, this.screenWidth, this.screenHeight) * this.MOBILE_UI_SCALE;
			const h = scalePx(100, this.screenWidth, this.screenHeight) * this.MOBILE_UI_SCALE;
			g.roundRect(0, 0, w, h, 0)
				.fill({ color: 0x000000, alpha: 1.0 })
				.stroke({ color: 0xffffff, width: 3 });
		}
		if (this.autoSpinText) {
			(this.autoSpinText as any).visible = true;
		}
		this.updateAutoSpinDisplay();
	}
	public startFreespinMode(current: number, total: number): void {
		this.hideBonusButton();
		this.hideFreespinCounter();
		const boxHeight = scalePx(100, this.screenWidth, this.screenHeight);
		const remaining = total - current + 1;
		this.freespinText = new Text({
			text: `${remaining} SPINS`,
			style: {
				fontFamily: GameConstants.FONTS.DEFAULT,
				fontSize: scalePx(36, this.screenWidth, this.screenHeight),
				fill: GameConstants.COLORS.GOLD,
				fontWeight: "bold",
				align: 'center'
			}
		});
		if (GameConstants.IS_MOBILE) {
			
			(this.freespinText as any).anchor?.set?.(1, 0.5);
			const pad = Math.max(10, Math.floor(this.screenWidth * 0.03));
			const gap = Math.max(8, Math.floor(this.screenWidth * 0.02));
			const twLeftX = this.totalWinContainer ? this.totalWinContainer.x : (this.getBottomBarWidth() - pad);
			this.freespinText.x = Math.max(0, twLeftX - gap);
		} else {
			this.freespinText.anchor.set(0.5);
			this.freespinText.x = this.boxContainer.width / 2;
		}
		this.freespinText.y = boxHeight / 2;
		this.boxContainer.addChild(this.freespinText);
	}

	public updateFreespinMode(current: number, total: number): void {
		if (this.freespinText) {
			const remaining = total - current;
			this.freespinText.text = `${remaining} SPINS`;
			
			if (GameConstants.IS_MOBILE) {
				const pad = Math.max(10, Math.floor(this.screenWidth * 0.03));
				const gap = Math.max(8, Math.floor(this.screenWidth * 0.02));
				const twLeftX = this.totalWinContainer ? this.totalWinContainer.x : (this.getBottomBarWidth() - pad);
				(this.freespinText as any).anchor?.set?.(1, 0.5);
				this.freespinText.x = Math.max(0, twLeftX - gap);
			}
		}
	}

	public endFreespinMode(): void {
		this.hideFreespinCounter();
		this.showBonusButton();
		this.showAutoSpinButton();
		this.removeTotalWin();
	}

	public toggleAutoSpin(): void {
		
		if (this._isMenuOpen) {
			this.closeMenu();
		}
		
		if (this._isAutoSpinMenuOpen || this.autoSpinMenuContainer) {
			this.hideAutoSpinMenu();
			return;
		}

		if (this._isAutoSpinActive) {
			this.stopAutoSpin();
		} else {
			this.showAutoSpinMenu();
		}
	}

	public startAutoSpin(spins: number = GameConstants.AUTO_SPIN.DEFAULT_SPINS): void {
		this._isAutoSpinActive = true;
		this._autoSpinRemaining = spins;
		this._client.autoSpinLoop();
		this.updateAutoSpinDisplay();
	}

	public stopAutoSpin(): void {
		this._isAutoSpinActive = false;
		this._autoSpinRemaining = 0;
		this.updateAutoSpinDisplay();
	}

	public decrementAutoSpin(): boolean {
		if (!this._isAutoSpinActive || this._autoSpinRemaining <= 0) {
			return false;
		}
		
		this._autoSpinRemaining--;
		this.updateAutoSpinDisplay();
		
		if (this._autoSpinRemaining <= 0) {
			this.stopAutoSpin();
			return false;
		}
		
		return true;
	}

	private updateAutoSpinDisplay(): void {
		if (!this.autoSpinText) return;
		
		if (this._isAutoSpinActive && this._autoSpinRemaining > 0) {
			this.autoSpinText.text = `${this._autoSpinRemaining}`;
			this.autoSpinText.style.fill = GameConstants.COLORS.GOLD;
			
			if (GameConstants.IS_MOBILE) {
				const digits = (`${this._autoSpinRemaining}`).length;
				let px = 30; 
				if (digits === 2) px = 28; 
				else if (digits >= 3) px = 24; 
				this.autoSpinText.style.fontSize = scalePx(px, this.screenWidth, this.screenHeight) * this.MOBILE_UI_SCALE;
			}
		} else {
			this.autoSpinText.text = "AUTO";
			this.autoSpinText.style.fill = GameConstants.COLORS.WHITE;
			
			if (GameConstants.IS_MOBILE) {
				this.autoSpinText.style.fontSize = scalePx(22, this.screenWidth, this.screenHeight) * this.MOBILE_UI_SCALE;
			}
		}
	}

	public get isAutoSpinActive(): boolean {
		return this._isAutoSpinActive;
	}

	public set isAutoSpinActive(value: boolean) {
		this._isAutoSpinActive = value;
	}

	public get autoSpinRemaining(): number {
		return this._autoSpinRemaining;
	}

	public setAutoSpinStopConditions(conditions: {
		onWin?: boolean;
		onFeature?: boolean;
		onBalanceLoss?: boolean;
		maxWinAmount?: number;
	}): void {
		this.autoSpinStopConditions = {
			...this.autoSpinStopConditions,
			...conditions
		};
	}

	public shouldStopAutoSpin(winAmount: number = 0, hasFeature: boolean = false): boolean {
		if (!this._isAutoSpinActive) return true;

		if (this.autoSpinStopConditions.onWin && winAmount > 0) {
			this.stopAutoSpin();
			return true;
		}

		if (this.autoSpinStopConditions.onFeature && hasFeature) {
			this.stopAutoSpin();
			return true;
		}

		if (this.autoSpinStopConditions.maxWinAmount > 0 && winAmount >= this.autoSpinStopConditions.maxWinAmount) {
			this.stopAutoSpin();
			return true;
		}

		return false;
	}

	public hideAutoSpinButton(): void {
		if (this.autoSpinButton) {
			this.autoSpinButton.visible = false;
		}
	}

	public showAutoSpinButton(): void {
		if (this.autoSpinButton) {
			this.autoSpinButton.visible = true;
		}
	}

	public getAutoSpinButton(): Container | null {
		return this.autoSpinButton;
	}

	public get isAutoSpinMenuOpen(): boolean {
		return this._isAutoSpinMenuOpen;
	}

	private setBonusButtonOrange(): void {
		if (!this.bonusButton) return;
		
		const g = this.bonusButton.children[0] as Graphics;
		if (!g || typeof g.clear !== 'function') return;
		try {
			g.clear();
			const buttonRadius = scalePx(55, this.screenWidth, this.screenHeight);
			g.circle(0, 0, buttonRadius)
			 .fill({ color: 0x000000, alpha: 0.5 })
			 .stroke({ color: GameConstants.COLORS.ORANGE_BRIGHT, width: 2 });
		} catch {}
	}

	private resetBonusButton(): void {
		if (!this.bonusButton) return;
		
		const g = this.bonusButton.children[0] as Graphics;
		if (!g || typeof g.clear !== 'function') return;
		try {
			g.clear();
			const buttonRadius = scalePx(55, this.screenWidth, this.screenHeight);
			g.circle(0, 0, buttonRadius)
			 .fill({ color: 0x000000, alpha: 0.5 })
			 .stroke({ color: GameConstants.COLORS.WHITE, width: 2 });
		} catch {}
	}

	private setBonusTextOrange(): void {
		if (!this.bonusButton) return;
		const txt = this.bonusButton.children.find(c => c instanceof Text) as Text | undefined;
		if (txt) {
			txt.style.fill = GameConstants.COLORS.ORANGE_BRIGHT;
			
			txt.text = 'DISABLE';
			
			const baseSize = (txt.style.fontSize as number) || 24;
			(txt.style as any).fontSize = Math.floor(baseSize * 0.85);
		}
	}

	private resetBonusText(): void {
		if (!this.bonusButton) return;
		const txt = this.bonusButton.children.find(c => c instanceof Text) as Text | undefined;
		if (txt) {
			txt.style.fill = GameConstants.COLORS.WHITE;
			
			txt.text = 'BONUS';
			
			const target = GameConstants.IS_MOBILE
				? scalePx(22, this.screenWidth, this.screenHeight) * this.MOBILE_UI_SCALE
				: scalePx(25, this.screenWidth, this.screenHeight) * this.MOBILE_UI_SCALE;
			(txt.style as any).fontSize = target;
		}
	}

	private setBetTextOrange(): void {
		if (this.betText) {
			this.betText.style.fill = GameConstants.COLORS.ORANGE_BRIGHT;
			const currentBet = this._client.realAmount;
			const boostedBet = currentBet * 2.5;
			this.betText.text = `${GameConstants.currency}${boostedBet.toFixed(2).replace(".", ",")}`;
		}
	}

	private resetBetText(): void {
		if (this.betText) {
			this.betText.style.fill = GameConstants.COLORS.WHITE;
			const currentBet = this._client.realAmount;
			this.betText.text = `${GameConstants.currency}${currentBet.toFixed(2).replace(".", ",")}`;
		}
	}

	private showAutoSpinMenu(): void {
		
		if (this.autoSpinMenuContainer) {
			this.hideAutoSpinMenu();
		}

		this._isAutoSpinMenuOpen = true;
		const pool: ObjectPool | undefined = this._client.gameRenderer?.objectPool;
		if (GameConstants.IS_MOBILE) {
			const overlay = pool ? pool.acquireGraphics() : new Graphics();
			try { overlay.clear(); } catch {}
			overlay.rect(0, 0, this.screenWidth, this.screenHeight).fill({ color: 0x000000, alpha: 0.6 });
			(overlay as any).interactive = true;
			(overlay as any).eventMode = 'static';
			(overlay as any).zIndex = 2005;
			overlay.on('pointerdown', (e: any) => e.stopPropagation?.());
			overlay.on('pointerup', (e: any) => e.stopPropagation?.());
			overlay.on('pointertap', (e: any) => e.stopPropagation?.());
			this.autoSpinMenuOverlay = overlay;
			this.container.addChild(overlay);

			
			const grid = pool ? pool.acquireContainer() : new Container();
			(grid as any).zIndex = 2015;
			grid.sortableChildren = false;
			(grid as any).interactive = true;
			(grid as any).eventMode = 'auto';

			const counts = GameConstants.AUTO_SPIN.AVAILABLE_COUNTS;
			const cols = 2;
			const rightPad = Math.max(8, Math.floor(this.screenWidth * 0.02));
			const leftPad = Math.max(8, Math.floor(this.screenWidth * 0.02));
			const gapX = Math.max(6, Math.floor(this.screenWidth * 0.02));
			const gapY = Math.max(4, Math.floor(this.screenHeight * 0.008));
			const tileW = Math.floor((this.screenWidth - leftPad - rightPad - gapX) / cols);
			const tileH = Math.max(44, Math.floor(this.screenHeight * 0.075));
			let btnY = this.autoSpinButton ? (this.autoSpinButton as any).y : this.screenHeight - tileH - 8;

			counts.forEach((count, idx) => {
				const row = Math.floor(idx / cols);
				const col = idx % cols; 
				const rightX = this.screenWidth - rightPad - tileW;
				const leftX = rightX - gapX - tileW;
				const x = col === 1 ? rightX : leftX;
				const y = btnY - (row + 1) * (tileH + gapY);
				const tile = pool ? pool.acquireContainer() : new Container();
				(tile as any).label = `${count}`;
				tile.sortableChildren = false;
				tile.x = Math.max(leftPad, x);
				tile.y = Math.max(8, y);
				const bg = pool ? pool.acquireGraphics() : new Graphics();
				try { bg.clear(); } catch {}
				bg.roundRect(0, 0, tileW, tileH, 0)
					.fill({ color: 0x000000, alpha: 0.9 })
					.stroke({ color: 0xffffff, width: 2 });
				(bg as any).zIndex = 0;
				let t: Text;
				if (pool) t = pool.acquireText(); else t = new Text({ text: '', style: {} } as any);
				t.text = `${count} SPINS`;
				(t.style as any).fontFamily = 'BEBAS NEUE';
				(t.style as any).fontSize = Math.max(22, Math.floor(tileH * 0.45));
				(t.style as any).fill = 0xffffff as any;
				(t.style as any).fontWeight = 'bold';
				(t.style as any).align = 'center';
				t.anchor?.set?.(0.5);
				t.x = tileW / 2; t.y = tileH / 2;
				(t as any).zIndex = 1;
				tile.addChild(bg);
				tile.addChild(t);
				(tile as any).hitArea = new Rectangle(0, 0, tileW, tileH);
				tile.interactive = true;
				(tile as any).eventMode = 'static';
				tile.cursor = 'pointer';
				
				tile.on('pointerdown', (e: any) => { e.stopPropagation?.(); try { bg.clear(); bg.roundRect(0,0,tileW,tileH,0).fill({ color: 0x000000, alpha: 1.0 }).stroke({ color: 0xffffff, width: 2 }); } catch {} });
				
				tile.on('pointerup', (e: any) => { e.stopPropagation?.(); try { bg.clear(); bg.roundRect(0,0,tileW,tileH,0).fill({ color: 0x000000, alpha: 0.9 }).stroke({ color: 0xffffff, width: 2 }); } catch {}; this.startAutoSpin(count); this.hideAutoSpinMenu(); });
				tile.on('pointerupoutside', (e: any) => { e.stopPropagation?.(); try { bg.clear(); bg.roundRect(0,0,tileW,tileH,0).fill({ color: 0x000000, alpha: 0.9 }).stroke({ color: 0xffffff, width: 2 }); } catch {} });

				grid.addChild(tile);
			});

			this.autoSpinMenuContainer = grid;
			
			try {
				(this.autoSpinButton as any).zIndex = 2025; 
				this.updateAutoButtonToX();
				
				if (this.infoButton) { (this.infoButton as any).zIndex = 1990; }
			} catch {}
			this.container.addChild(grid);
			this.container.sortChildren?.();
			return;
		}
		const baseMenuW = scalePx(150, this.screenWidth, this.screenHeight);
		const baseItemH = scalePx(40, this.screenWidth, this.screenHeight);
		const mScale = 1;
		const menuWidth = baseMenuW * mScale;
		const menuItemHeight = baseItemH * mScale;
		const menuHeight = GameConstants.AUTO_SPIN.AVAILABLE_COUNTS.length * menuItemHeight + (10 * mScale);
		const menuContainer = new Container();
		const menuBg = pool ? pool.acquireGraphics() : new Graphics();
		menuBg.roundRect(0, 0, menuWidth, menuHeight, 5).fill({ color: GameConstants.COLORS.BLACK, alpha: 0.95 }).stroke({ color: GameConstants.COLORS.WHITE, width: 2 });
		menuContainer.addChild(menuBg);
		menuContainer.interactive = true;
		menuContainer.eventMode = 'auto';
		this.autoSpinMenuContainer = menuContainer;
		GameConstants.AUTO_SPIN.AVAILABLE_COUNTS.forEach((count, index) => {
			const itemY = index * menuItemHeight + 10;
			const itemContainer = new Container();
			const itemBg = pool ? pool.acquireGraphics() : new Graphics();
			itemBg.clear(); itemBg.roundRect(5, 0, menuWidth - 10, menuItemHeight - 5, 3).fill({ color: GameConstants.COLORS.BLACK, alpha: 0.8 });
			itemContainer.y = itemY; 
			itemContainer.interactive = true; 
			itemContainer.eventMode = 'static'; 
			itemContainer.cursor = 'pointer';
			itemContainer.hitArea = new Rectangle(5, 0, menuWidth - 10, menuItemHeight - 5);
			const itemText = pool ? pool.acquireText() : new Text({ text: '', style: {}} as any);
			itemText.text = `${count} SPINS`; (itemText.style as any).fontFamily = GameConstants.FONTS.DEFAULT;
			(itemText.style as any).fontSize = scalePx(16, this.screenWidth, this.screenHeight) * mScale; (itemText.style as any).fill = GameConstants.COLORS.WHITE; (itemText.style as any).fontWeight = 'bold'; (itemText.style as any).align = 'center';
			itemText.anchor.set(0.5); itemText.x = menuWidth / 2; itemText.y = menuItemHeight / 2;
			itemContainer.addChild(itemBg);
			itemContainer.addChild(itemText);
			itemContainer.on('pointerover', () => { itemBg.clear(); itemBg.roundRect(5, 0, menuWidth - 10, menuItemHeight - 5, 3).fill({ color: GameConstants.COLORS.DARK_GRAY, alpha: 0.3 }); });
			itemContainer.on('pointerout', () => { itemBg.clear(); itemBg.roundRect(5, 0, menuWidth - 10, menuItemHeight - 5, 3).fill({ color: GameConstants.COLORS.BLACK, alpha: 0.8 }); });
			itemContainer.on('pointerdown', (e: any) => { e?.stopPropagation?.(); this.startAutoSpin(count); this.hideAutoSpinMenu(); });
			menuContainer.addChild(itemContainer);
		});
		if (!this.autoSpinMenuContainer) return;
		if (this.autoSpinButton) {
			
			const btnBounds = this.autoSpinButton.getBounds();
			const btnX = Math.floor(btnBounds.x);
			const btnY = Math.floor(btnBounds.y);
			const btnW = Math.floor(btnBounds.width);
			const btnH = Math.floor(btnBounds.height);
			const pad = 10;
			
			let targetX = btnX + btnW - menuWidth;
			let targetY = btnY - menuHeight - (10 * mScale);
			
			if (targetY < pad) {
				targetY = btnY + btnH + (10 * mScale);
			}
			
			targetX = Math.max(pad, Math.min(targetX, this.screenWidth - menuWidth - pad));
			targetY = Math.max(pad, Math.min(targetY, this.screenHeight - menuHeight - pad));
			this.autoSpinMenuContainer.x = targetX;
			this.autoSpinMenuContainer.y = targetY;
		}
		this.autoSpinMenuContainer.zIndex = 1000; this.container.addChild(this.autoSpinMenuContainer);
		this.autoSpinMenuHandler = (event: any) => {
			if (!this.autoSpinMenuContainer || !this._isAutoSpinMenuOpen) return; 
			try {
				const globalPoint = event.global;
				const menuBounds = this.autoSpinMenuContainer.getBounds();
				const inMenu = globalPoint.x >= menuBounds.x && globalPoint.x <= menuBounds.x + menuBounds.width && globalPoint.y >= menuBounds.y && globalPoint.y <= menuBounds.y + menuBounds.height;
				
				let inAutoBtn = false;
				if (this.autoSpinButton) {
					const autoBounds = this.autoSpinButton.getBounds();
					inAutoBtn = globalPoint.x >= autoBounds.x && globalPoint.x <= autoBounds.x + autoBounds.width && globalPoint.y >= autoBounds.y && globalPoint.y <= autoBounds.y + autoBounds.height;
				}
				if (!inMenu && !inAutoBtn) this.hideAutoSpinMenu();
			} catch (error) { this.hideAutoSpinMenu(); }
		};
		
		(this.container as any).interactive = true; this.container.on('pointerup', this.autoSpinMenuHandler);
	}

	private hideAutoSpinMenu(): void {
		this._isAutoSpinMenuOpen = false;
		const pool: ObjectPool | undefined = this._client.gameRenderer?.objectPool;
		if (this.autoSpinMenuOverlay) {
			try { this.container.removeChild(this.autoSpinMenuOverlay); } catch {}
			if (pool) {
				try { this.autoSpinMenuOverlay.clear(); } catch {}
				pool.releaseGraphics(this.autoSpinMenuOverlay);
			}
			this.autoSpinMenuOverlay = null;
		}
		if (this.autoSpinMenuContainer && this.autoSpinMenuContainer.parent) {
			this.container.removeChild(this.autoSpinMenuContainer);
			
			try {
				this.releaseDisplayObjectDeep(this.autoSpinMenuContainer, pool);
			} catch (e) {
				try { this.autoSpinMenuContainer.destroy({ children: true }); } catch {}
			}
			this.autoSpinMenuContainer = null;
		}
		
		if (GameConstants.IS_MOBILE && this.autoSpinButton) {
			try { (this.autoSpinButton as any).zIndex = 2000; } catch {}
			this.updateAutoButtonToNormal();
			this.container.sortChildren?.();
		}
		
		if (this.autoSpinMenuHandler) {
			this.container.off('pointerup', this.autoSpinMenuHandler);
			this.autoSpinMenuHandler = null;
		}
	}
	public get spinButtonStatic(): Sprite | null {
		return this.spinButton;
	}
	public get gameSound(): boolean{
		return (this._gameSound);
	}
}
