import { Container, AnimatedSprite, Graphics, Text, TextStyle } from "pixi.js";
import { scalePx } from "./game.utils";
import type { GameRenderer } from "./gameRenderer";
import { GameConstants } from "./GameConstants";
import { StyleConstants } from "./StyleConstants";
import { soundManager } from "./soundManager";

export interface WildPosition {
	column: number;
	multiplier: number[];
}

export interface WinDetail {
	positions: number[][];
	symbol?: string;
	payout?: number;
	lineIndex?: number;
	count?: number;
	multiplier?: number;
	isGrouped?: boolean;
	groupedMatches?: Array<{
		lineIndex: number;
		count: number;
		positions: [number, number][];
		payout: number;
		multiplier: number;
	}>;
}

export class GameAnimations {
	private container: Container;
	
	private fxBelow!: Container;   
	private fxMain!: Container;    
	private fxText!: Container;    
	private fxOverlay!: Container; 
	private app: any;
	private client: any;
	private _gamerenderer: GameRenderer | null = null;
	private assetLoader: any;
	private frameSprite: any;
	private initialGrid: any;
	private wildAnimations: AnimatedSprite[] = [];
	private wheelAnimations: { wheel: AnimatedSprite, topText: Text, bottomText: Text, border: Graphics }[] = [];
	private paylineGraphics: Graphics[] = [];
	private isWildAnimationsPlaying: boolean = false;
	private isPaylineAnimationsPlaying: boolean = false;
	private wildAnimationsAccelerated: boolean = false;
	private isSlowDetailedAnimationPlaying: boolean = false;
	private storedWinDetails: WinDetail[] = [];
	private storedWildPositions: WildPosition[] | undefined = undefined;
	private bigWinOverlay: Graphics | null = null;
	private bigWinText: Text | null = null;
	private bigWinTitle: Text | null = null;
	private isBigWinAnimationPlaying: boolean = false;
	private totalWinAmount = 0;
	private paylineCompleted = 0;
	private clickToSkip = false;
	private lastMilestone = 0;
	private milestoneAnimationStartTime = 0;
	private isMilestoneAnimating = false;
	private offsetX = GameConstants.getGridOffsetX();
	private offsetY = GameConstants.getGridOffsetY();
	
	
	private multiplierCache = new Map<string, number>();
	private coordinateCache = new Map<string, { x: number, y: number }>();
	private preFilteredWildsByColumn = new Map<number, WildPosition[]>();
	private styleConstants = StyleConstants.getInstance();

	

	
	private get pool() { return (this._gamerenderer as any)?.objectPool ?? null; }
	private acquireGraphics(): Graphics { return this.pool ? this.pool.acquireGraphics() : new Graphics(); }
	private releaseGraphics(g: Graphics) { try { this.pool ? this.pool.releaseGraphics(g) : g.destroy(); } catch {} }
	private acquireText(): Text { return this.pool ? this.pool.acquireText() : new Text({ text: '', style: new TextStyle() }); }
	private releaseText(t: Text) { try { this.pool ? this.pool.releaseText(t) : t.destroy(); } catch {} }
	private acquireContainer(): Container { return this.pool ? this.pool.acquireContainer() : new Container(); }

	constructor(
		container: Container, 
		app: any, 
		client: any, 
		assetLoader: any, 
		frameSprite: any, 
		initialGrid: any,
		renderer: GameRenderer,
		overlayRoot?: Container
	) {
		this.container = container;
		this.app = app;
		this.client = client;
		this.assetLoader = assetLoader;
		this.frameSprite = frameSprite;
		this.initialGrid = initialGrid;
		this.isWildAnimationsPlaying = false;
		this.isPaylineAnimationsPlaying = false;
		this.wildAnimationsAccelerated = false;
		this._gamerenderer = renderer;
		this.styleConstants.initialize(app.screen.width, app.screen.height);

		
		try {
			this.fxBelow = this.acquireContainer();
			this.fxMain = this.acquireContainer();
			this.fxText = this.acquireContainer();
			
			this.fxOverlay = overlayRoot ?? this.acquireContainer();
			this.fxBelow.sortableChildren = false;
			this.fxMain.sortableChildren = false;
			this.fxText.sortableChildren = false;
			this.fxOverlay.sortableChildren = true;
			
			this.container.addChild(this.fxBelow, this.fxMain, this.fxText);
			
			if (!overlayRoot) {
				this.container.addChild(this.fxOverlay);
			}
		} catch {}
	}

	public clearAllAnimations(): void {		
		this.isWildAnimationsPlaying = false;
		this.isPaylineAnimationsPlaying = false;
		this.isSlowDetailedAnimationPlaying = false;
		this.isBigWinAnimationPlaying = false;
		this.clearWildAnimations();
		this.clearWheelAnimations();
		this.clearPaylineAnimations();
		this.clearBigWinAnimation();
		this.resetAnimationStates();
		this.storedWinDetails = [];
		this.storedWildPositions = undefined;
		this.forceCleanupSlowAnimations();
		this.totalWinAmount = 0;
		this.paylineCompleted = 0;
		this.clickToSkip = false;
		this.lastMilestone = 0;
		this.milestoneAnimationStartTime = 0;
		this.isMilestoneAnimating = false;
		this.multiplierCache.clear();
		this.coordinateCache.clear();
		this.preFilteredWildsByColumn.clear();
	}
	
	private preFilterWildPositions(wildPositions?: WildPosition[]): void {
		if (!wildPositions) return;
		
		this.preFilteredWildsByColumn.clear();
		for (const wild of wildPositions) {
			if (!this.preFilteredWildsByColumn.has(wild.column)) {
				this.preFilteredWildsByColumn.set(wild.column, []);
			}
			this.preFilteredWildsByColumn.get(wild.column)!.push(wild);
		}
	}
	
	private clearWildAnimations(): void {
		this.wildAnimations.forEach(wildAnim => {
			if (wildAnim.parent) {
				this.container.removeChild(wildAnim);
			}
			wildAnim.destroy();
		});
		this.wildAnimations = [];
	}

	private clearWheelAnimations(): void {
		this.wheelAnimations.forEach(wheelAnim => {
			if (wheelAnim.wheel.parent) {
				this.container.removeChild(wheelAnim.wheel);
			}
			if (wheelAnim.topText.parent) {
				this.container.removeChild(wheelAnim.topText);
			}
			if (wheelAnim.bottomText.parent) {
				this.container.removeChild(wheelAnim.bottomText);
			}
			if (wheelAnim.border.parent) {
				try { wheelAnim.border.parent.removeChild(wheelAnim.border); } catch {}
			}
			wheelAnim.wheel.destroy();
			wheelAnim.topText.destroy();
			wheelAnim.bottomText.destroy();
			wheelAnim.border.destroy();
		});
		this.wheelAnimations = [];
	}

	private clearPaylineAnimations(): void {
		this.paylineGraphics.forEach(paylineGraphic => {
			if (paylineGraphic.parent) {
				this.container.removeChild(paylineGraphic);
			}
			paylineGraphic.destroy();
		});
		this.paylineGraphics = [];
	}
	
	private clearBigWinAnimation(): void {
		if (this.bigWinOverlay && this.bigWinOverlay.parent) {
			try { this.bigWinOverlay.parent.removeChild(this.bigWinOverlay); } catch {}
			try { this.bigWinOverlay.destroy(); } catch {}
			this.bigWinOverlay = null;
		}
        
		if (this.bigWinText && this.bigWinText.parent) {
			try { this.bigWinText.parent.removeChild(this.bigWinText); } catch {}
			try { this.bigWinText.destroy(); } catch {}
			this.bigWinText = null;
		}
        
		if (this.bigWinTitle && this.bigWinTitle.parent) {
			try { this.bigWinTitle.parent.removeChild(this.bigWinTitle); } catch {}
			try { this.bigWinTitle.destroy(); } catch {}
			this.bigWinTitle = null;
		}
        
		
		const parentsToScan: Container[] = [];
		try { if (this.container) parentsToScan.push(this.container); } catch {}
		try { if (this.fxOverlay) parentsToScan.push(this.fxOverlay); } catch {}
		parentsToScan.forEach(parent => {
			const titles = parent.children.filter(child => 
				child instanceof Text && ['BIG WIN!', 'BIG WIN', 'MEGA WIN', 'SUPER MEGA WIN', 'EPIC WIN', 'MAX WIN', 'WIN'].includes(child.text)
			);
			titles.forEach((title: any) => {
				try { if (title.parent) title.parent.removeChild(title); } catch {}
				try { title.destroy(); } catch {}
			});
		});
        
		this.clickToSkip = false;
	}
	
	private forceCleanupSlowAnimations(): void {
		const textsToRemove = this.container.children.filter(child => child instanceof Text);
		textsToRemove.forEach(text => {
			if (text.parent) {
				this.container.removeChild(text);
			}
			text.destroy();
		});
		
		const graphicsToRemove = this.container.children.filter(child => 
			child instanceof Graphics &&
			!this.paylineGraphics.includes(child as Graphics)
		);
		graphicsToRemove.forEach(graphic => {
			const g = graphic as Graphics;
			if (g.parent 
				&& g !== this.frameSprite
				&& g !== this.container.children[3]
				&& g !== this._gamerenderer?.gridLines ) {
				this.container.removeChild(g);
				g.destroy();
			}
		});
	}

	private resetAnimationStates(): void {
		this.isWildAnimationsPlaying = false;
		this.isPaylineAnimationsPlaying = false;
		this.wildAnimationsAccelerated = false;
		this.isSlowDetailedAnimationPlaying = false;
		this.isBigWinAnimationPlaying = false;
		this.totalWinAmount = 0;
		this.paylineCompleted = 0;
		this.clickToSkip = false;
		this.lastMilestone = 0;
		this.milestoneAnimationStartTime = 0;
		this.isMilestoneAnimating = false;
	}

	public playWildAnimations(wildPositions: WildPosition[], onComplete?: () => void): void {
		
		if (this.isWildAnimationsPlaying) {
			return;
		}
		
		if (!this.initialGrid || !this.assetLoader.wildFrames || this.assetLoader.wildFrames.length === 0) {
			this.isWildAnimationsPlaying = false;
			if (onComplete) onComplete();
			return;
		}
		
		
		const columnsWithWild: number[] = wildPositions
			.map(wildPos => wildPos.column)
			.filter((column, index, self) => self.indexOf(column) === index) 
			.sort((a, b) => a - b);
		
		if (columnsWithWild.length === 0) {
			this.isWildAnimationsPlaying = false;
			if (onComplete) onComplete();
			return;
		}
		
		this.isWildAnimationsPlaying = true;
		this.playWildAnimationsSequentially(columnsWithWild, 0, wildPositions, onComplete);
	}

	private playWildAnimationsSequentially(
		columns: number[], 
		index: number, 
		wildPositions: WildPosition[], 
		onComplete?: () => void
	): void {
		if (index >= columns.length) {
			this.isWildAnimationsPlaying = false;
			if (onComplete) onComplete();
			return;
		}
		
		const currentColumn = columns[index];
		
		this.createWildAnimationWithMultiplier(currentColumn, wildPositions, () => {
			const turboLevel = this._gamerenderer ? this._gamerenderer.turboLevel : 0;
			
			let delay: number;
			if (turboLevel === 2) {
				delay = 25; 
			} else if (turboLevel === 1) {
				delay = GameConstants.WILD_ANIMATION.DELAY_TURBO; 
			} else {
				delay = GameConstants.WILD_ANIMATION.DELAY_NORMAL;
			}
			setTimeout(() => {
				this.playWildAnimationsSequentially(columns, index + 1, wildPositions, onComplete);
			}, delay);
		});
	}

	private createWildAnimationWithMultiplier(
		x: number, 
		wildPositions: WildPosition[], 
		onComplete?: () => void
	): void {
		const borderX = x * GameConstants.REEL_SIZE + this.frameSprite.x - this.offsetX;
		const borderY = this.frameSprite.y - GameConstants.REEL_SIZE * 2.5;
		const borderWidth = GameConstants.REEL_SIZE;
		const borderHeight = GameConstants.REEL_SIZE * 5;
		
	const border = this.acquireGraphics();
	border.rect(borderX, borderY, borderWidth, borderHeight);
	border.stroke({ color: GameConstants.COLORS.ORANGE, width: 4, alpha: 0.8 });

		const wildAnimation = new AnimatedSprite(this.assetLoader.wildFrames);
		wildAnimation.anchor.set(0.5);
		
		wildAnimation.x = x * GameConstants.REEL_SIZE + GameConstants.REEL_SIZE / 2 + this.frameSprite.x - this.offsetX;
		wildAnimation.y = this.frameSprite.y; 
		
		wildAnimation.width = GameConstants.REEL_SIZE;
		wildAnimation.height = GameConstants.REEL_SIZE * 5;
		
		const turboLevel = this._gamerenderer ? this._gamerenderer.turboLevel : 0;
		
		let baseSpeed = GameConstants.getWildAnimationSpeed(turboLevel);
		if (turboLevel === 2) baseSpeed *= 2; 
		wildAnimation.animationSpeed = baseSpeed;
		
		wildAnimation.loop = false;
		wildAnimation.zIndex = 170; 
		
		const wildPosition = wildPositions.find(wp => wp.column === x);        
		if (wildPosition && wildPosition.multiplier && wildPosition.multiplier.length >= 2) {
			const multipliers = wildPosition.multiplier;
			const winner = multipliers[0]; 
			
			const isTopFirst = Math.random() > 0.5;
			const topMultiplier = isTopFirst ? multipliers[0] : multipliers[1];
			const bottomMultiplier = isTopFirst ? multipliers[1] : multipliers[0];
			
			const textStyle = this.styleConstants.getMultiplierTextStyle();
			
			const topText = this.acquireText();
			topText.text = `${topMultiplier}X`;
			topText.style = textStyle;
			topText.anchor.set(0.5);
			topText.x = wildAnimation.x;
			topText.y = wildAnimation.y - GameConstants.REEL_SIZE * 2;
			topText.zIndex = 180;

			const bottomText = this.acquireText();
			bottomText.text = `${bottomMultiplier}X`;
			bottomText.style = textStyle;
			bottomText.anchor.set(0.5);
			bottomText.x = wildAnimation.x;
			bottomText.y = wildAnimation.y + GameConstants.REEL_SIZE * 2;
			bottomText.zIndex = 180;
			
			this.fxMain.addChild(wildAnimation);
			
			this.fxText.addChild(border);
			
			this.fxText.addChild(topText);
			this.fxText.addChild(bottomText);
			wildAnimation.onComplete = () => {
				wildAnimation.stop();
				wildAnimation.gotoAndStop(wildAnimation.totalFrames - 1);
				this.playMultiplierSelectionAnimation(topText, bottomText, winner, topMultiplier, onComplete);
			};
			
			this.wheelAnimations.push({
				wheel: wildAnimation,
				topText: topText,
				bottomText: bottomText,
				border: border
			});
			wildAnimation.play();
		} else {
			wildAnimation.onComplete = () => {
				wildAnimation.stop();
				wildAnimation.gotoAndStop(wildAnimation.totalFrames - 1);
				if (border.parent) {
					try { border.parent.removeChild(border); } catch {}
					this.releaseGraphics(border);
				}
				if (onComplete) {
					onComplete();
				}
			};
			
			this.fxMain.addChild(wildAnimation);
			
			this.fxText.addChild(border);
			wildAnimation.play();
		}
		this.wildAnimations.push(wildAnimation);
		this.ensureWildsOnTop();
	}

	private ensureWildsOnTop(): void {
		
	}

	private playMultiplierSelectionAnimation(
		topText: Text, 
		bottomText: Text, 
		winner: number, 
		topMultiplier: number,
		onComplete?: () => void
	): void {
		const winnerIsTop = winner === topMultiplier;
		const selectedText = winnerIsTop ? topText : bottomText;
		const otherText = winnerIsTop ? bottomText : topText;
		
		topText.alpha = 1;
		bottomText.alpha = 1;
		
		const isSuperTurbo = this._gamerenderer && this._gamerenderer.turboLevel === 2;
		if (isSuperTurbo) {
			topText.alpha = 1;
			bottomText.alpha = 1;
			this.selectWinner(selectedText, otherText, onComplete);
			return;
		}
		
		const turboLevel = this._gamerenderer ? this._gamerenderer.turboLevel : 0;
		const blinkDuration = GameConstants.getWildBlinkDuration(turboLevel);
		const blinkCycleSpeed = GameConstants.getWildBlinkCycleSpeed(turboLevel);
		
		const blinkStartTime = Date.now();
		
		const blinkAnimation = () => {
			const elapsed = Date.now() - blinkStartTime;
			
			if (this._gamerenderer && this._gamerenderer.turboLevel === 2) {
				topText.alpha = 1;
				bottomText.alpha = 1;
				this.selectWinner(selectedText, otherText, onComplete);
				return;
			}
			
			if (elapsed < blinkDuration) {
				const blinkCycle = (elapsed % blinkCycleSpeed) / blinkCycleSpeed; 
				const alpha = 0.4 + 0.6 * (Math.sin(blinkCycle * Math.PI * 2) + 1) / 2;
				
				topText.alpha = alpha;
				bottomText.alpha = alpha;
				
				requestAnimationFrame(blinkAnimation);
			} else {
				topText.alpha = 1;
				bottomText.alpha = 1;
				this.selectWinner(selectedText, otherText, onComplete);
			}
		};
		
		requestAnimationFrame(blinkAnimation);
	}
	
	private selectWinner(selectedText: Text, otherText: Text, onComplete?: () => void): void {
		const winnerStyle = new TextStyle({
			fontFamily: GameConstants.FONTS.LOGO,
			fontSize: scalePx(32, this.app.screen.width, this.app.screen.height),
			fill: GameConstants.COLORS.GOLD,
			fontWeight: 'bold',
			stroke: { color: GameConstants.COLORS.BLACK, width: 3 },
			dropShadow: {
				color: GameConstants.COLORS.BLACK,
				blur: 6,
				angle: Math.PI / 4,
				distance: 4
			}
		});
		
		selectedText.style = winnerStyle;
		selectedText.alpha = 1;
		
		otherText.visible = false;
		
		setTimeout(() => {
			const targetX = selectedText.x;
			const targetY = this.frameSprite.y; 
			
			const startX = selectedText.x;
			const startY = selectedText.y;
			const turboLevel = this._gamerenderer ? this._gamerenderer.turboLevel : 0;
			const duration = GameConstants.getWildMoveDuration(turboLevel); 
			const startTime = Date.now();
			
			const animate = () => {
				const elapsed = Date.now() - startTime;
				const progress = Math.min(elapsed / duration, 1);
				
				const easeOut = 1 - Math.pow(1 - progress, 3);
				
				selectedText.x = startX + (targetX - startX) * easeOut;
				selectedText.y = startY + (targetY - startY) * easeOut;
			
				selectedText.scale.set(1 + 0.5 * easeOut);
				
				if (progress < 1) {
					requestAnimationFrame(animate);
				} else {
					const finalDelay = turboLevel === 2 ? 40 : turboLevel === 1 ? 60 : 100;
					setTimeout(() => {
						if (onComplete) {
							onComplete();
						}
					}, finalDelay);
				}
			};
			
			animate();
		}, GameConstants.getWildMoveDelay(this._gamerenderer ? this._gamerenderer.turboLevel : 0));
	}

	public playPaylineAnimations(winDetails: WinDetail[], wildPositions?: WildPosition[], onComplete?: () => void): void {
		
		if (this.isPaylineAnimationsPlaying) {
			return;
		}

		if (!winDetails || winDetails.length === 0) {
			this.isPaylineAnimationsPlaying = false;
			if (onComplete) onComplete();
			return;
		}

		this.isPaylineAnimationsPlaying = true;
		this.paylineCompleted = 0;
		this.totalWinAmount = 0;

		this.preFilterWildPositions(wildPositions);

		const isAutoSpinActive = this._gamerenderer && this._gamerenderer.gameInfo?.isAutoSpinActive;
		const isSuperTurbo = this._gamerenderer && this._gamerenderer.turboLevel === 2;

		let animationDelay: number;
		if (isSuperTurbo) {
			animationDelay = 10;
		} else if (isAutoSpinActive) {
			animationDelay = 50; 
		} else if (this._gamerenderer && this._gamerenderer.turboLevel > 0) {
			animationDelay = winDetails.some(w => w.isGrouped) ? 100 : 150;
		} else {
			animationDelay = winDetails.some(w => w.isGrouped) ? 800 : 1000;
		}

		const winAmounts = new Map<number, number>();
		winDetails.forEach((winDetail, index) => {
			const baseWinAmount = winDetail.payout || 0;
			if (baseWinAmount > 0) {
				let finalWinAmount = baseWinAmount;
				const realBalanceWin = (finalWinAmount / this.client.minAmountCredit) * this.client.minCreditCurrency;
				winAmounts.set(index, realBalanceWin);
				this.totalWinAmount += realBalanceWin;
			}
		});

		winDetails.forEach((winDetail, index) => {
			setTimeout(() => {
				if (winDetail.isGrouped) {
					this.drawGroupedPayline(winDetail, index === winDetails.length - 1, wildPositions, onComplete, winAmounts.get(index) || 0);
				} else {
					this.drawQuickPayline(winDetail, index === winDetails.length - 1, wildPositions, onComplete, winAmounts.get(index) || 0);
				}
			}, index * animationDelay);
		});
	}

	private paylineSound()
	{
		if (!this._gamerenderer?.gameInfo.gameSound)
			return;
		soundManager.play("payline", {volume:0.8, speed: 1.1});
	}
	private drawGroupedPayline(
		winDetail: WinDetail, 
		isLastPayline: boolean = false, 
		wildPositions?: WildPosition[], 
		onComplete?: () => void,
		preCalculatedWinAmount?: number
	): void {
		const paylineGraphic = this.acquireGraphics();
	paylineGraphic.zIndex = 150;
		if (!winDetail.groupedMatches || winDetail.groupedMatches.length === 0) {
			if (isLastPayline) {
				this.isPaylineAnimationsPlaying = false;
				if (onComplete) onComplete();
			}
			return;
		}
		const paths: { x: number, y: number }[][] = [];
		const allCoordinates: { x: number, y: number }[] = [];
		for (const match of winDetail.groupedMatches) {
			const coords = this.positionsToCoordinates(match.positions as unknown as number[][]);
			if (coords.length >= 2) {
				paths.push(coords);
				allCoordinates.push(...coords);
			}
		}
		this.fxBelow.addChild(paylineGraphic);
		paylineGraphic.zIndex = 150;
		this.paylineGraphics.push(paylineGraphic);
		this.ensurePaylinesBehindWilds();
		this.paylineSound();
		this.animateTrailPaths(paylineGraphic, paths, false, () => {
			if (paylineGraphic.parent) this.fxBelow.removeChild(paylineGraphic);
			this.releaseGraphics(paylineGraphic);
				const idx = this.paylineGraphics.indexOf(paylineGraphic);
				if (idx > -1) this.paylineGraphics.splice(idx, 1);
			this.showPaylineAmount(winDetail, allCoordinates, () => {
				if (!this.storedWinDetails.some(stored => JSON.stringify(stored.positions) === JSON.stringify(winDetail.positions))) {
					this.storedWinDetails.push(winDetail);
				}
				this.storedWildPositions = wildPositions;
				this.paylineCompleted++;
				if (isLastPayline) {
					const isSuperTurbo = this._gamerenderer && this._gamerenderer.turboLevel === 2;
					const finalDelay = isSuperTurbo ? 15 : 200;
					setTimeout(() => {
						this.isPaylineAnimationsPlaying = false;
						if (this._gamerenderer) {
							const reelAmountmoney = (this._gamerenderer.amount / this.client.minAmountCredit) * this.client.minCreditCurrency;
							if (this.totalWinAmount >= reelAmountmoney * GameConstants.BIG_WIN_THRESHOLD) {
								this.playBigWinAnimation(this.totalWinAmount, () => { if (onComplete) onComplete(); });
								return;
							}
						}
						if (onComplete) onComplete();
					}, finalDelay);
				}
			}, preCalculatedWinAmount);
		});
	}

	private drawQuickPayline(
		winDetail: WinDetail, 
		isLastPayline: boolean = false, 
		wildPositions?: WildPosition[], 
		onComplete?: () => void,
		preCalculatedWinAmount?: number
	): void {
		const paylineGraphic = this.acquireGraphics();
		paylineGraphic.zIndex = 150;
		const positions = winDetail.positions;

		if (!positions || positions.length < 2) {
			if (isLastPayline) {
				this.isPaylineAnimationsPlaying = false;
				if (onComplete) onComplete();
			}
			return;
		}

		const coordinates = this.positionsToCoordinates(positions);
		this.fxBelow.addChild(paylineGraphic);
		paylineGraphic.zIndex = 150;
		this.paylineGraphics.push(paylineGraphic);
		this.ensurePaylinesBehindWilds();
		
		this.paylineSound();
		this.animateTrailPaths(paylineGraphic, [coordinates], false, () => {
			if (paylineGraphic.parent) this.fxBelow.removeChild(paylineGraphic);
			this.releaseGraphics(paylineGraphic);
			const idx = this.paylineGraphics.indexOf(paylineGraphic);
			if (idx > -1) this.paylineGraphics.splice(idx, 1);
			this.showPaylineAmount(winDetail, coordinates, () => {
				if (!this.storedWinDetails.some(stored => JSON.stringify(stored.positions) === JSON.stringify(winDetail.positions))) {
					this.storedWinDetails.push(winDetail);
				}
				this.storedWildPositions = wildPositions;
				this.paylineCompleted++;
				if (isLastPayline && this._gamerenderer) {
					this.isPaylineAnimationsPlaying = false;
					const reelAmountmoney = (this._gamerenderer.amount / this.client.minAmountCredit) * this.client.minCreditCurrency;
					if (this.totalWinAmount >= reelAmountmoney * GameConstants.BIG_WIN_THRESHOLD) {
						this.playBigWinAnimation(this.totalWinAmount, () => { if (onComplete) onComplete(); });
					} else {
						if (onComplete) onComplete();
					}
				}
			}, preCalculatedWinAmount);
		});
	}

	private showPaylineAmount(
		winDetail: WinDetail,
		coordinates: { x: number, y: number }[],
		onComplete?: () => void,
		preCalculatedWinAmount?: number
	): void {
		
		const avgX = coordinates.reduce((sum, c) => sum + c.x, 0) / coordinates.length;
		const avgY = coordinates.reduce((sum, c) => sum + c.y, 0) / coordinates.length;

		const baseWinAmount = winDetail.payout || 0;
		if (baseWinAmount <= 0) {
			if (onComplete) onComplete();
			return;
		}
			const realBalanceWin = preCalculatedWinAmount || (() => {
			const finalWinAmount = baseWinAmount;
			return (finalWinAmount / this.client.minAmountCredit) * this.client.minCreditCurrency;
		})();

		const winTextStyle = this.styleConstants.getQuickPaylineWinStyle();
		let winText: Text | null = null;
		try {
			winText = this.acquireText();
			winText.text = `${realBalanceWin.toFixed(2)} $`;
			winText.style = winTextStyle;
			winText.anchor.set(0.5);
			winText.x = avgX;
			winText.y = avgY;
			winText.alpha = 0;
			winText.zIndex = 200;
			this.fxText.addChild(winText);
			winText.zIndex = 200;
		} catch (error) {
			console.error("Error creating payline win text:", error);
			if (onComplete) onComplete();
			return;
		}

		
		const turboLevel = this._gamerenderer ? this._gamerenderer.turboLevel : 0;
		
		let fadeInDuration = GameConstants.getPaylineFadeIn(turboLevel);
		let holdDuration = GameConstants.getPaylineHold(turboLevel);
		let fadeOutDuration = GameConstants.getPaylineFadeOut(turboLevel);

		const startTime = Date.now();
		const animate = () => {
			if (!winText) return;
			
			if (this._gamerenderer && this._gamerenderer.turboLevel === 2) {
				fadeInDuration = Math.min(fadeInDuration, 60);
				holdDuration = Math.min(holdDuration, 100);
				fadeOutDuration = Math.min(fadeOutDuration, 60);
			}
			const elapsed = Date.now() - startTime;
			if (elapsed < fadeInDuration) {
				const p = elapsed / fadeInDuration;
				winText.alpha = p; winText.scale.set(0.5 + 0.5 * p);
				requestAnimationFrame(animate);
			} else if (elapsed < fadeInDuration + holdDuration) {
				winText.alpha = 1; winText.scale.set(1);
				requestAnimationFrame(animate);
			} else if (elapsed < fadeInDuration + holdDuration + fadeOutDuration) {
				const p = (elapsed - fadeInDuration - holdDuration) / fadeOutDuration;
				winText.alpha = 1 - p;
				requestAnimationFrame(animate);
			} else {
				if (winText.parent) this.fxText.removeChild(winText);
				this.releaseText(winText);
				if (onComplete) onComplete();
			}
		};
		requestAnimationFrame(animate);
	}

	public playBigWinAnimation(winAmount: number, onComplete?: () => void, isBonus: boolean = false): void {
		if (this.isBigWinAnimationPlaying) {
			if (onComplete) onComplete();
			return;
		}
		this.isBigWinAnimationPlaying = true;
		this.clickToSkip = false;
		this.bigWinOverlay = this.acquireGraphics();
		this.bigWinOverlay.rect(0, 0, this.app.screen.width, this.app.screen.height);
		this.bigWinOverlay.fill({ color: 0x000000, alpha: 0 });
		this.bigWinOverlay.zIndex = 1000; 
		
		this.bigWinOverlay.eventMode = 'static';
		this.bigWinOverlay.cursor = 'pointer';
		this.bigWinOverlay.on('pointerdown', () => {
			this.clickToSkip = true;
		});
		
	this.fxOverlay.addChild(this.bigWinOverlay);
		const bigWinTextStyle = new TextStyle({
			fontFamily: GameConstants.FONTS.DEFAULT,
			fontSize: scalePx(GameConstants.FONTS.SIZE_HUGE, this.app.screen.width, this.app.screen.height),
			fill: GameConstants.COLORS.GOLD,
			fontWeight: 'bold',
			stroke: { color: GameConstants.COLORS.BLACK, width: 6 },
			dropShadow: {
				color: GameConstants.COLORS.BLACK,
				blur: 10,
				angle: Math.PI / 4,
				distance: 6
			}
		});
		
		this.bigWinText = this.acquireText();
		this.bigWinText.text = `0.00 $`;
		this.bigWinText.style = bigWinTextStyle;
		this.bigWinText.anchor.set(0.5);
		this.bigWinText.x = this.app.screen.width / 2;
		this.bigWinText.y = this.app.screen.height / 2 + 50;
		this.bigWinText.alpha = 0;
		this.bigWinText.scale.set(0.1);
		this.bigWinText.zIndex = 1002; 
		
	this.fxOverlay.addChild(this.bigWinText);
		
		
		let currentTitle = this.acquireText();
		currentTitle.text = 'WIN';
		currentTitle.style = new TextStyle({
				fontFamily: GameConstants.FONTS.DEFAULT,
				fontSize: scalePx(GameConstants.FONTS.SIZE_XXL, this.app.screen.width, this.app.screen.height),
				fill: GameConstants.COLORS.GOLD,
				fontWeight: 'bold',
				stroke: { color: GameConstants.COLORS.BLACK, width: 4 },
				dropShadow: {
					color: GameConstants.COLORS.BLACK,
					blur: 8,
					angle: Math.PI / 4,
					distance: 4
				}
			});
		currentTitle.anchor.set(0.5);
		currentTitle.x = this.app.screen.width / 2;
		currentTitle.y = this.app.screen.height / 2 - 100;
		currentTitle.alpha = 0;
		currentTitle.zIndex = 1001; 
		
	this.fxOverlay.addChild(currentTitle);
		
		
		this.bigWinTitle = currentTitle;
		
		if (!this._gamerenderer)
			return;
		const reelAmountmoney = (this._gamerenderer.amount / this.client.minAmountCredit) * this.client.minCreditCurrency;

		const maxMultiplier = winAmount / reelAmountmoney;
		const overlayFadeDuration = GameConstants.BIG_WIN_ANIMATION.OVERLAY_FADE_DURATION;
		const textFadeInDuration = GameConstants.BIG_WIN_ANIMATION.TEXT_FADE_IN_DURATION;
		const holdDuration = GameConstants.BIG_WIN_ANIMATION.HOLD_DURATION;
		const fadeOutDuration = GameConstants.BIG_WIN_ANIMATION.FADE_OUT_DURATION;
		
		let currentAmount = 0;
		let animationPhase = 'overlay';
		let fadeOutStartTime = 0; 
		let holdStartTime = 0; 
		const startTime = Date.now();
		let CSkip = 0;
		
		const animate = () => {
			if (!this.isBigWinAnimationPlaying) {
				this.clearBigWinAnimation();
				if (onComplete) onComplete();
				return;
			}
			this.ensureBigWinOnTop();
			
			const elapsed = Date.now() - startTime;
			
			if (animationPhase === 'overlay' && elapsed >= overlayFadeDuration) {
				animationPhase = 'fadeIn';
			} else if (animationPhase === 'fadeIn' && elapsed >= overlayFadeDuration + textFadeInDuration) {
				animationPhase = 'countUp';
			} else if (animationPhase === 'countUp' && currentAmount >= winAmount) {
				animationPhase = 'hold';
				holdStartTime = Date.now(); 
				currentAmount = winAmount;
			} else if (animationPhase === 'hold' && holdStartTime > 0 && (Date.now() - holdStartTime) >= holdDuration) {
				
				animationPhase = 'fadeOut';
				fadeOutStartTime = Date.now();
			}
			if (animationPhase === 'overlay') {
				const progress = elapsed / overlayFadeDuration;
				if (this.bigWinOverlay) {
					this.bigWinOverlay.clear();
					this.bigWinOverlay.rect(0, 0, this.app.screen.width, this.app.screen.height);
					this.bigWinOverlay.fill({ color: 0x000000, alpha: 0.8 * progress });
				}
			}
			else if (animationPhase === 'fadeIn') {
				const progress = (elapsed - overlayFadeDuration) / textFadeInDuration;
				const easeOut = 1 - Math.pow(1 - progress, 3);
				
				if (currentTitle) {
					currentTitle.alpha = easeOut;
					currentTitle.scale.set(0.1 + 0.9 * easeOut);
				}
				
				if (this.bigWinText) {
					this.bigWinText.alpha = easeOut;
					this.bigWinText.scale.set(0.1 + 0.9 * easeOut);
				}
			}
			else if (animationPhase === 'countUp') {
				const currentMultiplierValue = (currentAmount / winAmount) * maxMultiplier;
				const milestones = [...GameConstants.MULTIPLIER_MILESTONES];
				
				if (this.clickToSkip) {    
					let currentMilestoneIndex = -1;
					for (let i = 0; i < milestones.length; i++) {
						if (currentMultiplierValue < milestones[i]) {
							currentMilestoneIndex = i;
							break;
						}
					}
					if (currentMilestoneIndex >= 0 && currentMilestoneIndex < milestones.length - 1) {
						if (currentAmount < reelAmountmoney * milestones[0])
						{	
							currentMilestoneIndex = CSkip;
						}
						const nextMilestone = milestones[currentMilestoneIndex + 1];
						currentAmount = Math.min((nextMilestone / maxMultiplier) * winAmount, winAmount);
						
						
						this.lastMilestone = nextMilestone;
						this.isMilestoneAnimating = true;
						this.milestoneAnimationStartTime = Date.now();
					} else if (currentMilestoneIndex === milestones.length - 1 || currentMultiplierValue >= 15000) {
						
						currentAmount = winAmount;
						animationPhase = 'hold';
					} else {
						
						currentAmount = Math.min((25 / maxMultiplier) * winAmount, winAmount);
						this.lastMilestone = 25;
						this.isMilestoneAnimating = true;
						this.milestoneAnimationStartTime = Date.now();
					}
					
					this.clickToSkip = false;
					CSkip++;
				}
				
				
				if (this.isMilestoneAnimating) {
					const milestoneElapsed = Date.now() - this.milestoneAnimationStartTime;
					const milestoneDuration = GameConstants.BIG_WIN_ANIMATION.MILESTONE_ANIMATION_DURATION; 
					
					if (milestoneElapsed >= milestoneDuration) {
						this.isMilestoneAnimating = false;
					}
				} else {
					
					let baseSpeed = 0;
					if (currentMultiplierValue >= 15000) {
						currentAmount = reelAmountmoney * 15000;
						animationPhase = 'hold';
					} else {
						
						const nextMilestone = milestones.find(m => currentMultiplierValue < m);
						
						if (nextMilestone) {
							const milestoneAmount = (nextMilestone / maxMultiplier) * winAmount;
							
							if (currentAmount >= milestoneAmount * 0.995) {
								currentAmount = milestoneAmount;

								if (this.lastMilestone < nextMilestone) {
									this.lastMilestone = nextMilestone;
									this.isMilestoneAnimating = true;
									this.milestoneAnimationStartTime = Date.now();
								}
							} else {
								if (currentMultiplierValue < 25) {
									const progress = currentMultiplierValue / 25;
									baseSpeed = 100 * 0.00085 * (1 + progress * 0.2);
								} else if (currentMultiplierValue < 50) {
									const progress = (currentMultiplierValue - 25) / 25;
									baseSpeed = currentAmount * 0.00095 * (1 + progress * 0.15);
								} else if (currentMultiplierValue < 100) {
									const progress = (currentMultiplierValue - 50) / 50;
									baseSpeed = currentAmount * 0.0010 * (1 + progress * 0.2);
								} else if (currentMultiplierValue < 300) {
									const progress = (currentMultiplierValue - 100) / 200;
									baseSpeed = currentAmount * 0.001 * (1 + progress * 0.3);
								} else if (currentMultiplierValue < 1000) {
									const progress = (currentMultiplierValue - 300) / 700;
									baseSpeed = currentAmount * 0.001 * (1 + progress * 0.3);
								} else if (currentMultiplierValue < 5000) {
									const progress = (currentMultiplierValue - 1000) / 4000;
									baseSpeed = currentAmount * 0.001 * (1 + progress * 0.4);
								} else {
									const progress = (currentMultiplierValue - 5000) / 10000;
									baseSpeed = currentAmount * 0.001 * (1 + progress * 0.3);
								}
								currentAmount = Math.min(currentAmount + baseSpeed, winAmount);
							}
						}
					}
				}
				
				const updatedMultiplierValue = (currentAmount / winAmount) * maxMultiplier;
				
				if (updatedMultiplierValue >= GameConstants.BIG_WIN_THRESHOLD && currentTitle.text === 'WIN') {
					this.updateWinTitle(currentTitle, 'BIG WIN', GameConstants.COLORS.RED);
				} else if (updatedMultiplierValue >= GameConstants.MEGA_WIN_THRESHOLD && currentTitle.text === 'BIG WIN') {
					this.updateWinTitle(currentTitle, 'MEGA WIN', GameConstants.COLORS.ORANGE_BRIGHT);
				} else if (updatedMultiplierValue >= GameConstants.SUPER_MEGA_WIN_THRESHOLD && currentTitle.text === 'MEGA WIN') {
					this.updateWinTitle(currentTitle, 'SUPER MEGA WIN', GameConstants.COLORS.GREEN);
				} else if (updatedMultiplierValue >= GameConstants.EPIC_WIN_THRESHOLD && currentTitle.text === 'SUPER MEGA WIN') {
					this.updateWinTitle(currentTitle, 'EPIC WIN', GameConstants.COLORS.PURPLE);
				} else if (updatedMultiplierValue >= GameConstants.MAX_WIN_THRESHOLD && currentTitle.text === 'EPIC WIN') {
					this.updateWinTitle(currentTitle, 'MAX WIN', GameConstants.COLORS.PINK);
				}
				
				if (this.bigWinText) {
					this.bigWinText.text = `${currentAmount.toFixed(2)} $`;
					this.bigWinText.alpha = 1;
					if (this.isMilestoneAnimating) {
						const milestoneElapsed = Date.now() - this.milestoneAnimationStartTime;
						const animationProgress = milestoneElapsed / 800; 
						
						if (animationProgress < 0.4) {
							const scaleProgress = animationProgress / 0.4;
							const scale = 1.0 + (0.3 * scaleProgress);
							this.bigWinText.scale.set(scale);
						} else if (animationProgress < 1.0) {
							const scaleProgress = (animationProgress - 0.4) / 0.6;
							const scale = 1.3 - (0.3 * scaleProgress);
							this.bigWinText.scale.set(Math.max(scale, 1.0));
						} else {
							this.bigWinText.scale.set(1.0);
						}
					} else {
						this.bigWinText.scale.set(1.0);
					}
					const shake = Math.sin(elapsed * 0.1) * 1;
					this.bigWinText.x = this.app.screen.width / 2 + shake;
					this.bigWinText.y = this.app.screen.height / 2 + 50 + shake * 0.5;
				}
				
				if (currentTitle) {
					currentTitle.alpha = 1;
					currentTitle.scale.set(1);
				}
			}
			
			else if (animationPhase === 'hold') {
				if (this.clickToSkip) {
					animationPhase = 'fadeOut';
					fadeOutStartTime = Date.now(); 
					this.clickToSkip = false;
				}
				
				if (currentTitle) {
					currentTitle.alpha = 1;
					currentTitle.scale.set(1);
					currentTitle.x = this.app.screen.width / 2;
					currentTitle.y = this.app.screen.height / 2 - 100;
				}
				
				if (this.bigWinText) {
					this.bigWinText.text = `${winAmount.toFixed(2)} $`;
					this.bigWinText.alpha = 1;
					this.bigWinText.scale.set(1);
					this.bigWinText.x = this.app.screen.width / 2;
					this.bigWinText.y = this.app.screen.height / 2 + 50;
				}
			}
			else if (animationPhase === 'fadeOut') {
				
				let fadeProgress;
				if (fadeOutStartTime > 0) {
					
					const fadeElapsed = Date.now() - fadeOutStartTime;
					fadeProgress = fadeElapsed / fadeOutDuration;
				} else {
					
					fadeProgress = (elapsed - overlayFadeDuration - textFadeInDuration - GameConstants.BIG_WIN_ANIMATION.COUNT_UP_DURATION - holdDuration) / fadeOutDuration;
				}
				
				const fadeAlpha = Math.max(0, 1 - fadeProgress);
				
				if (this.bigWinOverlay && !isBonus) {
					this.bigWinOverlay.clear();
					this.bigWinOverlay.rect(0, 0, this.app.screen.width, this.app.screen.height);
					this.bigWinOverlay.fill({ color: GameConstants.COLORS.BLACK, alpha: 0.8 * fadeAlpha });
				}
				
				if (currentTitle) {
					currentTitle.alpha = fadeAlpha;
				}
				
				if (this.bigWinText) {
					this.bigWinText.alpha = fadeAlpha;
				}
				
				if (fadeProgress >= 1) {	
					this.isBigWinAnimationPlaying = false;
					this.clearBigWinAnimation();
					
					try { if (this._gamerenderer?.gameInfo?.gameSound !== false) soundManager.play('win', { volume: 0.5 }); } catch {}
					if (onComplete) onComplete();
					return;
				}
			}
			requestAnimationFrame(animate);
		};
		
		
		requestAnimationFrame(animate);
	}
	
	private updateWinTitle(titleText: Text, newTitle: string, newColor: number): void {
		titleText.text = newTitle;
		titleText.style.fill = newColor;
		
		if (!titleText)
			return;
		titleText.scale.set(1.3);
		
		const scaleBackDuration = 300;
		const startTime = Date.now();
	
		const scaleBack = () => {
			const elapsed = Date.now() - startTime;
			const progress = Math.min(elapsed / scaleBackDuration, 1);
			
			const scale = 1.3 - (0.3 * progress);
			if (titleText)
				titleText.scale.set(scale);
			
			if (progress < 1) {
				requestAnimationFrame(scaleBack);
			}
		};
		
		requestAnimationFrame(scaleBack);
	}

	public playSlowDetailedPaylineAnimation(): void {
		if (this.storedWinDetails.length > 0 && !this.isSlowDetailedAnimationPlaying) {
			this.isSlowDetailedAnimationPlaying = true;
			this.calculateTotalWinFromStored();
			this.playStoredWinDetailsSlowly(0);
		}
	}
	
	public forcePlaySlowAnimation(): void {
		if (this.storedWinDetails.length > 0) {
			this.isSlowDetailedAnimationPlaying = false;
			this.clearPaylineAnimations();
			this.isSlowDetailedAnimationPlaying = true;
			this.calculateTotalWinFromStored();
			this.playStoredWinDetailsSlowly(0);
		}
	}
	
	private playStoredWinDetailsSlowly(index: number): void {
		if (!this.isSlowDetailedAnimationPlaying) {
			return;
		}
		
		if (index >= this.storedWinDetails.length) {
			this.isSlowDetailedAnimationPlaying = false;
			return;
		}
		
		const winDetail = this.storedWinDetails[index];
		
		this.drawSlowDetailedPayline(winDetail, this.storedWildPositions, () => {
			if (!this.isSlowDetailedAnimationPlaying) {
				return;
			}
			setTimeout(() => {
				this.playStoredWinDetailsSlowly(index + 1);
			}, 1000);
		});
	}

	public clearStoredWinDetails(): void {
		this.storedWinDetails = [];
		this.storedWildPositions = undefined;
	}

	private calculateTotalWinFromStored(): void {
		this.totalWinAmount = 0;
		this.storedWinDetails.forEach(winDetail => {
			const baseWinAmount = winDetail.payout || 0;
			if (baseWinAmount > 0) {
				const realBalanceWin = (baseWinAmount / this.client.minAmountCredit) * this.client.minCreditCurrency;
				this.totalWinAmount += realBalanceWin;
			}
		});
	}

	private ensurePaylinesBehindWilds(): void {
		let lowestWildIndex = this.container.children.length;
		
		this.wildAnimations.forEach(wildAnim => {
			if (wildAnim.parent === this.container) {
				const wildIndex = this.container.getChildIndex(wildAnim);
				if (wildIndex < lowestWildIndex) {
					lowestWildIndex = wildIndex;
				}
			}
		});

		this.wheelAnimations.forEach(wheelAnim => {
			if (wheelAnim.wheel.parent === this.container) {
				const wheelIndex = this.container.getChildIndex(wheelAnim.wheel);
				if (wheelIndex < lowestWildIndex) {
					lowestWildIndex = wheelIndex;
				}
			}
		});

		this.paylineGraphics.forEach(paylineGraphic => {
			if (paylineGraphic.parent === this.container) {
				const paylineIndex = this.container.getChildIndex(paylineGraphic);
				if (paylineIndex >= lowestWildIndex) {
					this.container.setChildIndex(paylineGraphic, Math.max(0, lowestWildIndex - 1));
				}
			}
		});
	}
	
	private ensureBigWinOnTop(): void {
		
		try { if (this.bigWinOverlay) this.bigWinOverlay.zIndex = 1000; } catch {}
		try { if (this.bigWinTitle) this.bigWinTitle.zIndex = 1001; } catch {}
		try { if (this.bigWinText) this.bigWinText.zIndex = 1002; } catch {}
		try { if (this.fxOverlay && (this.fxOverlay as any).sortChildren) (this.fxOverlay as any).sortChildren(); } catch {}
	}
	
	private drawSlowDetailedPayline(
		winDetail: WinDetail, 
	wildPositions?: WildPosition[],
		onComplete?: () => void
	): void {
		const paylineGraphic = new Graphics();
		paylineGraphic.zIndex = 150;

		
		let paths: { x: number, y: number }[][] = [];
		if (winDetail.isGrouped && winDetail.groupedMatches && winDetail.groupedMatches.length > 0) {
			paths = winDetail.groupedMatches
				.map(m => this.positionsToCoordinates(m.positions as unknown as number[][]))
				.filter(coords => coords.length >= 2);
		} else {
			const positions = winDetail.positions;
			if (!positions || positions.length < 2) {
				if (onComplete) onComplete();
				return;
			}
			paths = [this.positionsToCoordinates(positions)];
		}

		this.container.addChild(paylineGraphic);
		paylineGraphic.zIndex = 150;
		this.paylineGraphics.push(paylineGraphic);
		this.ensurePaylinesBehindWilds();

		
		this.animateTrailPaths(paylineGraphic, paths, true, () => {
			const allCoords = paths.flat();
			if (paylineGraphic.parent) this.container.removeChild(paylineGraphic);
			paylineGraphic.destroy();
			const idx = this.paylineGraphics.indexOf(paylineGraphic);
			if (idx > -1) this.paylineGraphics.splice(idx, 1);
			this.showDetailedPaylineCalculation(winDetail, allCoords, wildPositions, () => {
				if (onComplete) onComplete();
			});
		});
	}

	private showDetailedPaylineCalculation(
		winDetail: WinDetail, 
		coordinates: { x: number, y: number }[], 
		_wildPositions?: WildPosition[],
		onComplete?: () => void
	): void {
		const centerX = coordinates.reduce((s, c) => s + c.x, 0) / coordinates.length;
		const centerY = coordinates.reduce((s, c) => s + c.y, 0) / coordinates.length;
		let baseWinAmount = winDetail.payout || 0;
		if (baseWinAmount <= 0) {
			if (onComplete) onComplete();
			return;
		}
		
		if (!winDetail.isGrouped &&  winDetail.payout)
			baseWinAmount = winDetail.payout;
		const finalWinAmount = baseWinAmount;
		const realBalanceWin = (finalWinAmount / this.client.minAmountCredit) * this.client.minCreditCurrency;
		
		const winTextStyle = new TextStyle({
			fontFamily: GameConstants.FONTS.DEFAULT,
			fontSize: scalePx(GameConstants.FONTS.SIZE_XL, this.app.screen.width, this.app.screen.height),
			fill: GameConstants.COLORS.GOLD,
			fontWeight: 'bold',
			stroke: { color: GameConstants.COLORS.BLACK, width: 3 },
			dropShadow: {
				color: GameConstants.COLORS.BLACK,
				blur: 6,
				angle: Math.PI / 4,
				distance: 4
			}
		});
		
		const fadeInDuration = 500;
		const holdDuration = 1000;
		const fadeOutDuration = 300;

		const isGroupedWin = winDetail.isGrouped && winDetail.groupedMatches && winDetail.groupedMatches.length >= 3;
		
		if (isGroupedWin) {
			const resultText = new Text({ text: `${realBalanceWin.toFixed(2)}$`, style: winTextStyle });
			resultText.anchor.set(0.5);
			resultText.x = centerX;
			resultText.y = centerY;
			resultText.alpha = 0;
			this.container.addChild(resultText);
			resultText.zIndex = 200;

			const resultStartTime = Date.now();
			const animateResultOnly = () => {
				const elapsed = Date.now() - resultStartTime;
				if (!this.isSlowDetailedAnimationPlaying) {
					if (resultText.parent) this.container.removeChild(resultText);
					resultText.destroy();
					if (onComplete) onComplete();
					return;
				}
				if (elapsed < fadeInDuration) {
					const p = elapsed / fadeInDuration;
					resultText.alpha = p;
					resultText.scale.set(0.5 + 0.5 * p);
					requestAnimationFrame(animateResultOnly);
				} else if (elapsed < fadeInDuration + holdDuration) {
					resultText.alpha = 1;
					resultText.scale.set(1);
					requestAnimationFrame(animateResultOnly);
				} else if (elapsed < fadeInDuration + holdDuration + fadeOutDuration) {
					const p = (elapsed - fadeInDuration - holdDuration) / fadeOutDuration;
					resultText.alpha = 1 - p;
					requestAnimationFrame(animateResultOnly);
				} else {
					if (resultText.parent) this.container.removeChild(resultText);
					resultText.destroy();
					if (onComplete) onComplete();
				}
			};
			requestAnimationFrame(animateResultOnly);
			return;
		} else {
			const resultText = new Text({ text: `${realBalanceWin.toFixed(2)}$`, style: winTextStyle });
			resultText.anchor.set(0.5);
			resultText.x = centerX;
			resultText.y = centerY;
			resultText.alpha = 0;
			this.container.addChild(resultText);
			resultText.zIndex = 200;

			const resultStartTime = Date.now();
			const animateResultOnly = () => {
				const elapsed = Date.now() - resultStartTime;
				if (!this.isSlowDetailedAnimationPlaying) {
					if (resultText.parent) this.container.removeChild(resultText);
					resultText.destroy();
					if (onComplete) onComplete();
					return;
				}
				if (elapsed < fadeInDuration) {
					const p = elapsed / fadeInDuration;
					resultText.alpha = p;
					resultText.scale.set(0.5 + 0.5 * p);
					requestAnimationFrame(animateResultOnly);
				} else if (elapsed < fadeInDuration + holdDuration) {
					resultText.alpha = 1;
					resultText.scale.set(1);
					requestAnimationFrame(animateResultOnly);
				} else if (elapsed < fadeInDuration + holdDuration + fadeOutDuration) {
					const p = (elapsed - fadeInDuration - holdDuration) / fadeOutDuration;
					resultText.alpha = 1 - p;
					requestAnimationFrame(animateResultOnly);
				} else {
					if (resultText.parent) this.container.removeChild(resultText);
					resultText.destroy();
					if (onComplete) onComplete();
				}
			};
			requestAnimationFrame(animateResultOnly);
			return;
		}
	}

	
	private positionsToCoordinates(positions: number[][]): { x: number, y: number }[] {
		
		try {
			if (this._gamerenderer) {
				return positions.map((pos: number[]) => {
					const row = pos[0];
					const col = pos[1];
					const coord = this._gamerenderer!.getOptimizedCoordinates(col, row);
					return { x: coord.x, y: coord.y };
				});
			}
		} catch {}
		
		return positions.map((pos: number[]) => ({
			x: pos[1] * GameConstants.REEL_SIZE + GameConstants.REEL_SIZE / 2 + this.frameSprite.x - this.offsetX,
			y: pos[0] * GameConstants.REEL_SIZE + GameConstants.REEL_SIZE / 2 + this.frameSprite.y - this.offsetY
		}));
	}

	private animateTrailPaths(
		paylineGraphic: Graphics,
		paths: { x: number, y: number }[][],
		detailedWidth: boolean,
		onComplete: () => void
	): void {
		let animationProgress = 0;
		const animationSpeed = this._gamerenderer?.turboLevel == 2 ? 16 : 8; 
		const snakeLength = 3; 
		const tailFadeLength = 1.5;

		
		const perPath = paths.map((coords) => {
			let total = 0;
			const segs: number[] = [];
			for (let i = 0; i < coords.length - 1; i++) {
				const dx = coords[i + 1].x - coords[i].x;
				const dy = coords[i + 1].y - coords[i].y;
				const len = Math.sqrt(dx * dx + dy * dy);
				segs.push(len);
				total += len;
			}
			return { coords, segs, total };
		});

		const animate = () => {
			if (this.isSlowDetailedAnimationPlaying === false && detailedWidth) {
				if (paylineGraphic.parent) this.container.removeChild(paylineGraphic);
				paylineGraphic.destroy();
				return;
			}
			paylineGraphic.clear();
			for (const p of perPath) {
				if (p.coords.length < 2 || p.total <= 0) continue;
				const headDistance = (animationProgress / 100) * p.total;
				const unitLen = p.total / p.coords.length;
				const tailDistance = headDistance - snakeLength * unitLen;
				if (headDistance <= 0) continue;

				let currentDistance = 0;
				const pathPoints: { x: number, y: number, alpha: number }[] = [];
				for (let i = 0; i < p.coords.length - 1; i++) {
					const segmentStart = currentDistance;
					const segLen = p.segs[i];
					const segmentEnd = currentDistance + segLen;
					if (headDistance < segmentStart || tailDistance > segmentEnd) {
						currentDistance = segmentEnd;
						continue;
					}
					const drawStartDistance = Math.max(tailDistance, segmentStart);
					const drawEndDistance = Math.min(headDistance, segmentEnd);
					if (drawStartDistance >= drawEndDistance) {
						currentDistance = segmentEnd;
						continue;
					}
					const startProgress = (drawStartDistance - segmentStart) / segLen;
					const endProgress = (drawEndDistance - segmentStart) / segLen;
					const startX = p.coords[i].x + (p.coords[i + 1].x - p.coords[i].x) * startProgress;
					const startY = p.coords[i].y + (p.coords[i + 1].y - p.coords[i].y) * startProgress;
					const endX = p.coords[i].x + (p.coords[i + 1].x - p.coords[i].x) * endProgress;
					const endY = p.coords[i].y + (p.coords[i + 1].y - p.coords[i].y) * endProgress;
					const distanceFromHead = headDistance - drawEndDistance;
					const maxFadeDistance = snakeLength * unitLen * (tailFadeLength / snakeLength);
					const alpha = Math.max(0.1, 1.0 - Math.max(0, distanceFromHead) / Math.max(1, maxFadeDistance));
					pathPoints.push({ x: startX, y: startY, alpha });
					pathPoints.push({ x: endX, y: endY, alpha });
					currentDistance = segmentEnd;
				}
				if (pathPoints.length >= 2) {
					paylineGraphic.moveTo(pathPoints[0].x, pathPoints[0].y);
					for (let i = 1; i < pathPoints.length; i++) paylineGraphic.lineTo(pathPoints[i].x, pathPoints[i].y);
					const avgAlpha = pathPoints.reduce((s, pt) => s + pt.alpha, 0) / pathPoints.length;
					paylineGraphic.stroke({
						color: GameConstants.COLORS.GOLD,
						width: detailedWidth ? GameConstants.PAYLINE_ANIMATION.STROKE_WIDTH_DETAILED : GameConstants.PAYLINE_ANIMATION.STROKE_WIDTH,
						alpha: avgAlpha,
						cap: 'round',
						join: 'round'
					});
				}
			}

			animationProgress += animationSpeed;
			const totalAnimationTime = 100 + snakeLength * 20;
			if (animationProgress < totalAnimationTime) {
				requestAnimationFrame(animate);
			} else {
				onComplete();
			}
		};
		requestAnimationFrame(animate);
	}

	public accelerateAnimations(): void {
		if (this.wildAnimationsAccelerated) {
			return;
		}

		this.wildAnimationsAccelerated = true;
		const isSuperTurbo = this._gamerenderer && this._gamerenderer.turboLevel === 2;
		const speedMultiplier = isSuperTurbo ? GameConstants.WILD_ANIMATION_SPEED_TURBO * 2 : GameConstants.WILD_ANIMATION_SPEED_TURBO;
		
		this.wildAnimations.forEach(wildAnim => {
			if (wildAnim.playing) {
				wildAnim.animationSpeed = speedMultiplier;
			}
		});
		
		this.wheelAnimations.forEach(wheelAnim => {
			if (wheelAnim.wheel.playing) {
				wheelAnim.wheel.animationSpeed = speedMultiplier;
			}
		});
		   
		this.paylineGraphics.forEach(paylineGraphic => {
			if (paylineGraphic.alpha > 0) {
				paylineGraphic.alpha = Math.min(paylineGraphic.alpha * 1.2, 1);
			}
		});
		
		
		if (this.isBigWinAnimationPlaying) {
			
			this.isBigWinAnimationPlaying = false;
		}
	}
		
	public playQuickFreespinAnimations(winDetails: WinDetail[], onComplete?: () => void): void {
		if (!winDetails || winDetails.length === 0) {
			if (onComplete) onComplete();
			return;
		}
		const validWinDetails = winDetails.filter(detail => {
			const baseWin = detail.payout || 0;
			return baseWin > 0;
		});
		
		if (validWinDetails.length === 0) {
			if (onComplete) onComplete();
			return;
		}
		
		this.isPaylineAnimationsPlaying = true;
		let completedAnimations = 0;
		
		
		validWinDetails.forEach((winDetail, index) => {
			setTimeout(() => {
				this.drawQuickFreespinPayline(winDetail, () => {
					completedAnimations++;
					if (completedAnimations >= validWinDetails.length) {
						this.isPaylineAnimationsPlaying = false;
						if (onComplete) onComplete();
					}
				});
			}, index * 30); 
		});
	}
	
	private drawQuickFreespinPayline(winDetail: WinDetail, onComplete?: () => void): void {
		const positions = winDetail.positions;
		
		if (!positions || positions.length < 2) {
			if (onComplete) onComplete();
			return;
		}
		const centerPos = positions[Math.floor(positions.length / 2)];
		const centerX = centerPos[1] * GameConstants.REEL_SIZE + GameConstants.REEL_SIZE / 2 + this.frameSprite.x - this.offsetX;
		const centerY = centerPos[0] * GameConstants.REEL_SIZE + GameConstants.REEL_SIZE / 2 + this.frameSprite.y - this.offsetY;
		
		const baseWinAmount = winDetail.payout || 0;
		if (baseWinAmount > 0) {
			const realBalanceWin = (baseWinAmount / this.client.minAmountCredit) * this.client.minCreditCurrency;
			
			const winText = new Text({
				text: `+${GameConstants.currency}${realBalanceWin.toFixed(2)}`,
				style: {
					fontFamily: 'Arial',
					fontSize: 24,
					fill: 0xFFD700,
					fontWeight: 'bold',
					stroke: { color: 0x000000, width: 2 }
				}
			});
			
			winText.anchor.set(0.5);
			winText.zIndex = 200; 
			winText.x = centerX;
			winText.y = centerY - 20;
			winText.alpha = 0;
			
			this.container.addChild(winText);
			winText.zIndex = 200; 
			
			const fadeIn = () => {
				winText.alpha = Math.min(winText.alpha + 0.1, 1);
				if (winText.alpha < 1) {
					requestAnimationFrame(fadeIn);
				} else {
					
					setTimeout(() => {
						const fadeOut = () => {
							winText.alpha = Math.max(winText.alpha - 0.1, 0);
							if (winText.alpha > 0) {
								requestAnimationFrame(fadeOut);
							} else {
								if (winText.parent) {
									this.container.removeChild(winText);
								}
								winText.destroy();
								if (onComplete) onComplete();
							}
						};
						requestAnimationFrame(fadeOut);
					}, 300);
				}
			};
			requestAnimationFrame(fadeIn);
		} else {
			if (onComplete) onComplete();
		}
	}
	
	public updateInitialGrid(newGrid: any): void {
		this.initialGrid = newGrid;
	}

	

	public updateFrameSprite(newFrameSprite: any): void {
		this.frameSprite = newFrameSprite;
	}

	public get isAnimationsPlay(){
		return this.isBigWinAnimationPlaying;
	}
	 public get isWildPlaying(): boolean {
		return this.isWildAnimationsPlaying;
	}

	public get isPaylinePlaying(): boolean {
		return this.isPaylineAnimationsPlaying;
	}

	public get isAccelerated(): boolean {
		return this.wildAnimationsAccelerated;
	}
	
	public get isSlowDetailedPlaying(): boolean {
		return this.isSlowDetailedAnimationPlaying;
	}
	
	public get storedWinDetailsCount(): number {
		return this.storedWinDetails.length;
	}
	
	public get isBigWinPlaying(): boolean {
		return this.isBigWinAnimationPlaying;
	}
	
	public getStoredWinDetails(): WinDetail[] {
		return this.storedWinDetails;
	}
}
