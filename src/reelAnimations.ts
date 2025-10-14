import { Container, Sprite } from "pixi.js";
import { GameClient } from "./gameClient";
import { GameConstants } from "./GameConstants";
import { scalePx } from "./game.utils";
import { SpritePool } from "./objPool";
import { soundManager } from "./soundManager";



export class ReelAnimator {
	private client: GameClient;
	private container: Container;
	private symbols: Sprite[] = [];
	private reelData: number[];
	private reelIndex: number;
	private stopIndex: number;
	private currentIndex: number;
	public isSpinning = false;
	private symbolSize: number;
	private initalGrid: Record<string, any>;
	private boundUpdate: (() => void) | null = null;
	private spinSpeed = GameConstants.SPIN_SPEED_NORMAL; 
	private minSpeed = GameConstants.MIN_SPEED_NORMAL;
	private deceleration = GameConstants.DECELERATION_NORMAL;
	private startDelay: number;
	private ssss = true;
	private startTime: number;
	private gameRenderer: any;
	private _turboLevel: number = 0;
	private _turboLevel_for_sound: number = 0;
	private offsetX = GameConstants.getGridOffsetX();
	private offsetY = GameConstants.getGridOffsetY();
	private _spritePool: SpritePool;
	private startBouncePhase: 'pullback' | 'acceleration' | 'normal' = 'pullback';
	private startBounceTime: number = 0;
	private initialPositions: number[] = [];
	private isActive: boolean = true;
	
	private lowQualityActive: boolean = false;
	private lowQualityApplied: boolean = false;
	private qualityRestored: boolean = false;
	private readonly qualityScaleFactor: number = 0.92; 
    


	constructor (
		container: Container,
		spritePool: SpritePool,
		reelData: number[],
		reelIndex: number,
		client: GameClient,
		stopIndex: number,
		initalGrid: Record<string, any>,
		private frameX: number,
		private frameY: number,
		gameRenderer?: any 
	) {
		this.container = container;
		this._spritePool = spritePool;
		this.reelData = reelData;
		this.reelIndex = reelIndex;
		this.client = client;
		this.stopIndex = stopIndex;
		this.gameRenderer = gameRenderer;
		const distance = 25;
		this.currentIndex =  (stopIndex + distance + this.reelData.length) % this.reelData.length;
		this.symbolSize = GameConstants.REEL_SIZE;
		this.initalGrid = initalGrid;
		this.startDelay = reelIndex * GameConstants.REEL_START_DELAY;
		this.startTime = Date.now();

		this._turboLevel_for_sound = this.gameRenderer.turboLevel;
		this.setTurboLevel(this.gameRenderer.turboLevel);
		this.boundUpdate = this.update.bind(this);
		this.gameRenderer.addAnimationCallback(this.boundUpdate as any);
		this.initSymbols();

	}

	private getSymbolPosition(yIndex: number): { x: number; y: number } {
		
		if (this.gameRenderer && typeof this.gameRenderer.getOptimizedCoordinates === 'function') {
			return this.gameRenderer.getOptimizedCoordinates(this.reelIndex, yIndex);
		}
		const x = this.reelIndex * this.symbolSize + this.symbolSize / 2 + this.frameX - this.offsetX;
		const y = yIndex * this.symbolSize + this.symbolSize / 2 + this.frameY - this.offsetY;

		return { x, y };
	}

	private initSymbols() {
		for (const sprite of this.symbols) {
			this.container.removeChild(sprite);
		}
		this.symbols = [];
		this.initialPositions = [];
	
		let i = 0;
		while (this.symbols.length < GameConstants.GRID_ROWS) {
			const symbolId = this.initalGrid[i][this.reelIndex];
			const sprite = this._spritePool.get(symbolId);
			sprite.anchor.set(0.5);
			const pos = this.getSymbolPosition(i);
			sprite.x = pos.x;
			sprite.y = pos.y;
			this.initialPositions.push(pos.y);
			
			const sizeRatio = GameConstants.SYMBOL_SIZE_RATIO * (this.lowQualityActive ? this.qualityScaleFactor : 1);
			sprite.width = this.symbolSize * sizeRatio;
			sprite.height = this.symbolSize * sizeRatio;
			sprite.zIndex = 100; 
			
			this.container.addChild(sprite);
			this.symbols.push(sprite);
			i++;
		}
		if (this._turboLevel_for_sound == 0)
			this.gameRenderer.reel_sounds_effects(`start`);
	}
 
	private update() {
		if (!this.isActive) return;

		
		{
			const skipEndSlowdown = false; 
			if (!this.isSpinning) {
				if (Date.now() - this.startTime < this.startDelay) return;
				this.isSpinning = true;
				this.startBounceTime = Date.now();
				this.startBouncePhase = 'pullback';
			}
			if (this.symbols.length === 0) return;
			const currentTime = Date.now();
			const bounceElapsed = currentTime - this.startBounceTime;
			if (this.startBouncePhase === 'pullback') {
				const progress = Math.min(bounceElapsed / GameConstants.PULLBACK_DISTANCE, 1);
				const easeOut = 1 - Math.pow(1 - progress, 3);
				const pullbackOffset = GameConstants.PULLBACK_DISTANCE * easeOut;

				for (let i = 0; i < this.symbols.length; i++) {
					this.symbols[i].y = this.initialPositions[i] - pullbackOffset;
				}

				if (progress >= 1) {
					this.startBouncePhase = 'acceleration';
					this.startBounceTime = currentTime;
				}
				return;
			}
	    if (this.startBouncePhase === 'acceleration') {
				const progress = Math.min(bounceElapsed / GameConstants.PULLBACK_AACCELERATION_DURATION, 1);
				const easeIn = Math.pow(progress, 2);
				const totalDistance = GameConstants.PULLBACK_DISTANCE + (this.symbolSize * 0.3);
				const accelerationOffset = totalDistance * easeIn;

				for (let i = 0; i < this.symbols.length; i++) {
					this.symbols[i].y = this.initialPositions[i] - GameConstants.PULLBACK_DISTANCE + accelerationOffset;
				}

				if (progress >= 1) {
					this.startBouncePhase = 'normal';
					for (let i = 0; i < this.symbols.length; i++) {
						this.symbols[i].y = this.initialPositions[i] + (this.symbolSize * 0.3);
					}
		    
		    this.applyLowQualityIfNeeded();
				}
				return;
			}

			for (const sprite of this.symbols) {
				sprite.y += this.spinSpeed;
			}

			
			const scatterCount = this.countScattersOnScreen();
			const shouldSlowDown = scatterCount >= 2 && this.reelIndex <= 4;

			const bottomLimit = this.getSymbolPosition(GameConstants.GRID_ROWS).y;
			const reelDataLength = this.reelData.length;
			const bottomSymbol = this.symbols[this.symbols.length - 1];
			if (bottomSymbol && bottomSymbol.y > bottomLimit) {
				const recycled = this.symbols.pop()!;
				this.currentIndex = (this.currentIndex - 1 + reelDataLength) % reelDataLength;
				const newSymbolId = this.reelData[(this.currentIndex + GameConstants.GRID_ROWS - 1) % reelDataLength];
				const topSymbol = this.symbols[0];
				recycled.x = topSymbol.x;
				recycled.y = topSymbol.y - this.symbolSize;
				const sizeRatio = GameConstants.SYMBOL_SIZE_RATIO * (this.lowQualityActive ? this.qualityScaleFactor : 1);
				recycled.width = this.symbolSize * sizeRatio;
				recycled.height = this.symbolSize * sizeRatio;
				recycled.zIndex = 100;
				this._spritePool.applyTexture(recycled, newSymbolId);
				this.symbols.unshift(recycled);
				
			}
			
			if (shouldSlowDown) {
				try { this.gameRenderer.onScatterSlowdownTriggered?.(); } catch {}
			}

			
			if (this.lowQualityActive && !this.qualityRestored) {
				const distance = (this.stopIndex - this.currentIndex + reelDataLength) % reelDataLength;
				const Ldistance = reelDataLength - distance;
				if (shouldSlowDown || distance <= 10 || Ldistance <= 10) {
					this.restoreQuality();
				}
			}

			if (shouldSlowDown && this.ssss) {
				
				if (this.gameRenderer?.gameInfo?.gameSound !== false) {
					try {
						let hasOne = false;
						for (let y = 0; y < GameConstants.GRID_ROWS; y++) {
							const id = this.reelData[(this.stopIndex + y) % reelDataLength];
							if (String(id) === '1') { hasOne = true; break; }
						}
						if (hasOne) { soundManager.play('symbol1_main', { volume: 0.5 }); }
					} catch {}
				}
				if (this.reelIndex >= 1)
					this.currentIndex += 10 * this.reelIndex;
				this.ssss = false;
			}
			const distance = (this.stopIndex - this.currentIndex + reelDataLength) % reelDataLength;
			const Ldistance = reelDataLength - distance;
			if (!skipEndSlowdown) {
				if (shouldSlowDown) {
					const factor = (this._turboLevel > 0) ? 0.9 : 0.95;
					if ((distance >= 0 && distance <= 8) || (Ldistance >= 0 && Ldistance <= 10)) {
						this.spinSpeed = Math.max(this.spinSpeed * factor, this.minSpeed * 0.5);
					}
				} else {
					if (distance >= 0 && distance <= 4) {
						this.spinSpeed = Math.max(this.spinSpeed * this.deceleration, this.minSpeed);
					}
				}
			}
			if (distance === 4) {
				this.spinSpeed = 0;
				this.finalizeStop();
			}
			return;
		}
	}

	private countScattersOnScreen(): number {
		if (!this.gameRenderer || !this.gameRenderer.reelAnimators) return 0;
		
		let scatterCount = 0;
		for (let x = 0; x < this.reelIndex; x++) {
			const animator = this.gameRenderer.reelAnimators[x];
			if (animator && !animator.isReelSpinning) { 
				for (let y = 0; y < 5; y++) {
					if (this.gameRenderer.initialGrid[y] && this.gameRenderer.initialGrid[y][x] === "1") {
						scatterCount++;
					}
				}
			}
		}
		return scatterCount;
	}

	private applyLowQualityIfNeeded() {
		if (this.lowQualityApplied) return;
		this.lowQualityActive = true;
		this.lowQualityApplied = true;
		try {
			for (const sprite of this.symbols) {
				const src: any = sprite.texture?.source;
				if (src?.style) {
					
					src.style.scaleMode = 'nearest';
				}
				const sizeRatio = GameConstants.SYMBOL_SIZE_RATIO * this.qualityScaleFactor;
				sprite.width = this.symbolSize * sizeRatio;
				sprite.height = this.symbolSize * sizeRatio;
			}
		} catch {}
	}

	private restoreQuality() {
		this.lowQualityActive = false;
		this.qualityRestored = true;
		try {
			for (const sprite of this.symbols) {
				const src: any = sprite.texture?.source;
				if (src?.style) {
					src.style.scaleMode = 'linear';
				}
				const sizeRatio = GameConstants.SYMBOL_SIZE_RATIO;
				sprite.width = this.symbolSize * sizeRatio;
				sprite.height = this.symbolSize * sizeRatio;
			}
		} catch {}
	}

	public stopSpin() {
		const slowDownTick = () => {
			if (this.spinSpeed > this.minSpeed) {
				this.spinSpeed -= this.deceleration;
			} else {
				try { this.gameRenderer.removeAnimationCallback(slowDownTick as any); } catch {}
				this.finalizeStop();
			}
		};
		this.gameRenderer.addAnimationCallback(slowDownTick as any);
	}

	public  accelerateSpin() {
		if (!this.isSpinning) return;
		const capSpeed = GameConstants.getSpinSpeed(this._turboLevel);
		const capMin = GameConstants.getMinSpeed(this._turboLevel);
		
		const boostAdd = capSpeed * 0.25; 
		this.spinSpeed = Math.min(this.spinSpeed * 1.6 + boostAdd, capSpeed);
		
		this.minSpeed = Math.min(this.minSpeed + capMin * 0.1, capMin);
		
		if (this._turboLevel === 2) {
			this.deceleration = Math.max(this.deceleration, 0.99);
		}
	}

	private finalizeStop() {
		this.isSpinning = false;
		this.isActive = false;
		if (this.boundUpdate) {
			try { this.gameRenderer.removeAnimationCallback(this.boundUpdate as any); } catch {}
		}

		for (const sprite of this.symbols) {
			this.container.removeChild(sprite);
			this._spritePool.release(sprite);
		}
		this.symbols = [];
	

		for (let y = 0; y < GameConstants.GRID_ROWS; y++) {
			const index = (this.stopIndex + y) % this.reelData.length;
			const id = this.reelData[index];
			const sprite = this._spritePool.get(id);
			sprite.anchor.set(0.5);
			const pos = this.getSymbolPosition(y);
			sprite.x = pos.x;
			sprite.y = pos.y;
			sprite.width = this.symbolSize * 0.95;
			sprite.height = this.symbolSize * 0.95;
			sprite.zIndex = 100; 
			this.container.addChild(sprite);
			this.symbols.push(sprite);
		}
		if (this.gameRenderer?.gameInfo?.gameSound !== false) {
			try {
				let hasOne = false;
				for (let y = 0; y < GameConstants.GRID_ROWS; y++) {
					const id = this.reelData[(this.stopIndex + y) % this.reelData.length];
					if (String(id) === '1') { hasOne = true; break; }
				}
				if (hasOne) {
					soundManager.play(`symbol1_${this.reelIndex}`, { volume: 0.5 });
				}
			} catch {}
		}
		if (this._turboLevel_for_sound == 2)
		{
			if (this.reelIndex == 4)
				this.gameRenderer.reel_sounds_effects(`stop${this.reelIndex}`);
		}
		else if (this._turboLevel_for_sound == 1)
		{
			if (this.reelIndex % 2)
				this.gameRenderer.reel_sounds_effects(`stop${this.reelIndex}`);
		}
		else
			this.gameRenderer.reel_sounds_effects(`stop${this.reelIndex}`);
		this.applyOvershootEffect();
		}

	private applyOvershootEffect() {
		if (!this.client.app)
			return;
		const overshootAmount = scalePx(35, this.client.app?.screen.width, this.client.app?.screen.height);
		const duration = 180;
		let startTime = Date.now();
		
		const originalPositions = this.symbols.map(sprite => sprite.y);
		
		const animate = () => {
			const elapsed = Date.now() - startTime;
			const progress = Math.min(elapsed / duration, 1);
			const bounce = Math.sin(progress * Math.PI) * (1 - progress);
			this.symbols.forEach((sprite, index) => {
				sprite.y = originalPositions[index] + (overshootAmount * bounce);
			});
			
			if (progress < 1) {
				this.gameRenderer.addAnimationCallback(animate as any);
			} else {
				this.gameRenderer.removeAnimationCallback(animate as any);
			}
		};
		
		this.gameRenderer.addAnimationCallback(animate as any);
	}
		public get Symbols()
			{
			return this.symbols;
			}

		public get isReelSpinning(): boolean {
			return this.isSpinning;
		}

		public destroy() {
				this.isSpinning = false;
				this.isActive = false;
			if (this.boundUpdate) {
				try { this.gameRenderer.removeAnimationCallback(this.boundUpdate as any); } catch {}
				this.boundUpdate = null;
			}
		
		
		for (const sprite of this.symbols) {
   			 if (sprite.parent) {
				this.container.removeChild(sprite);
			}
			this._spritePool.release(sprite);
		}
		this.symbols = [];
	}
	public get grids()  {
		return this.initalGrid;
	}

	public startSpin(onComplete?: () => void): void {
		if (this._turboLevel === 2) {
			this.isSpinning = true;
			setTimeout(() => {
				this.finalizeStop();
				if (onComplete) onComplete();
			}, 50);
		} else if (this._turboLevel > 0) {
			
			this.isSpinning = true;
			this.ssss = true;
			this.startTime = Date.now();
			this.startBouncePhase = 'pullback';
			this.startBounceTime = 0;
			if (onComplete) {
				const checkCompleteTick = () => {
					if (!this.isSpinning) {
						try { this.gameRenderer.removeAnimationCallback(checkCompleteTick as any); } catch {}
						onComplete();
					}
				};
				this.gameRenderer.addAnimationCallback(checkCompleteTick as any);
			}
		} else {
			
			this.isSpinning = true;
			this.ssss = true;
			this.startTime = Date.now();
			this.startBouncePhase = 'pullback';
			this.startBounceTime = 0;
			if (onComplete) {
				const checkCompleteTick = () => {
					if (!this.isSpinning) {
						try { this.gameRenderer.removeAnimationCallback(checkCompleteTick as any); } catch {}
						onComplete();
					}
				};
				this.gameRenderer.addAnimationCallback(checkCompleteTick as any);
			}
		}
	}

	public setTurboMode(enabled: boolean): void {
		this.setTurboLevel(enabled ? 2 : 0);
	}

	public setTurboLevel(turboLevel: number): void {
		this._turboLevel = Math.max(0, Math.min(2, turboLevel));
		this.spinSpeed = GameConstants.getSpinSpeed(this._turboLevel);
		this.minSpeed = GameConstants.getMinSpeed(this._turboLevel);
		this.deceleration = GameConstants.getDeceleration(this._turboLevel);
	}

	public get isTurboMode(): boolean {
		return this._turboLevel > 0;
	}

	public get turboLevel(): number {
		return this._turboLevel;
	}

	public get getStopIndex(): number {
		return this.stopIndex;
	}
	public setSymbols(value: number[])
	{
		this.reelData = value;
	}
	public setStopIndex(value: number)
	{
		this.stopIndex = value;
	}

	public setInitalGrid(value: Record<string, any>) {
		this.initalGrid = value;
	}

}