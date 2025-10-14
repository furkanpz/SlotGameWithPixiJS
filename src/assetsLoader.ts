import { Assets, Texture, Ticker } from 'pixi.js';
import { LayoutManager } from './LayoutManager';
import type { Sprite } from 'pixi.js';
import type { SymbolType } from "./types"; 
import { updateLoadingProgress } from './progressUI';
import type { GameClient } from './gameClient';
import { errorBox } from "./game.utils";
import { soundManager } from "./soundManager";
import { GameConstants } from './GameConstants';


export class AssetLoader {
	private _symbolTextures: Record<string, Texture> = {};
	private _backgroundFrames: Texture[] = [];
	private _bonusbackgroundFrames: Texture[] = [];
	private _wildFrames: Texture[] = [];
	private _spinButtonFrames: Texture[] = [];
	private _wildStartImage: Texture | null = null;
	private _spinButtonStatic: Texture | null = null;
	private FRAME_TEXTURE: Texture | null = null;
	private FRAME_TEXTURE_2 : Texture | null = null;
	private info_bar_box0_image: Texture | null = null;
	private info_bar_box1_image: Texture | null = null;
	private info_bar_box2_image: Texture | null = null;
	private _gameClient: GameClient;
	private _soundsLoaded: boolean = false;
	private _maxImage: Texture | null = null;

	constructor (client: GameClient) {
		this._gameClient = client;
	}

	private setNoMips(tex: Texture | null | undefined) {
		try {
			if (!tex) return;
			const src: any = (tex as any).source;
			if (!src) return;
			
			if (src.style && typeof src.style === 'object') {
				if ('mipmap' in src.style) src.style.mipmap = false;
				if ('anisotropicLevel' in src.style) src.style.anisotropicLevel = 0;
			} else {
				
				if ('mipmap' in src) src.mipmap = false;
				if ('anisotropicLevel' in src) src.anisotropicLevel = 0;
			}
		} catch {}
	}

	private setNoMipsForTextureMap(map: Record<string, Texture>) {
		try {
			const seen = new Set<any>();
			for (const key in map) {
				const t = map[key];
				const bt = t?.source;
				if (bt && !seen.has(bt)) {
					this.setNoMips(t);
					seen.add(bt);
				}
			}
		} catch {}
	}

	public async loadSymbolTextures(symbols: SymbolType[]): Promise<boolean> {
		try {
			
			const layoutAtlas = LayoutManager.instance.current.symbols?.atlas;
			const mobilePath = "assets/mobile_symbols/mobile_symbols.json";
			const desktopPath = "assets/symbols/symbols.json";
			const primary = layoutAtlas ?? (GameConstants.IS_MOBILE ? mobilePath : desktopPath);
			const fallback = GameConstants.IS_MOBILE ? desktopPath : mobilePath;
			let sheet: any;
			try {
				sheet = await Assets.load(primary);
			} catch {
				sheet = await Assets.load(fallback);
			}
			this._symbolTextures = symbols.reduce((acc: Record<string, Texture>, symbol: SymbolType) => {
				const frameName = `${symbol.id}.png`; 
				if (sheet.textures[frameName]) {
					acc[symbol.id] = sheet.textures[frameName];
				} else {
					throw Error("symbols!!");
				}
				return acc;
			}, {} as Record<string, Texture>);

			
			this.setNoMipsForTextureMap(this._symbolTextures);

			return true;
		} catch (error) {
			console.error("Symbol textures failed to load:", error);
			return false;
		}
	}

	private async loadinfobar() {
		await Assets.load("assets/fs_boost.png");
		await Assets.load("assets/buy_b.png");
		await Assets.load("assets/buy_b2.png");
		await Assets.load("assets/max.png");
		this.info_bar_box0_image = Texture.from("assets/fs_boost.png");
		this.info_bar_box1_image = Texture.from("assets/buy_b.png");
		this.info_bar_box2_image = Texture.from("assets/buy_b2.png");
		this._maxImage = Texture.from("assets/max.png");
		this.setNoMips(this.info_bar_box0_image);
		this.setNoMips(this.info_bar_box1_image);
		this.setNoMips(this.info_bar_box2_image);
		this.setNoMips(this._maxImage);
	}

	

	public async loadBackgroundFrames(onProgress?: (progress: number) => void): Promise<boolean> {
		try {
				let bgSrc = LayoutManager.instance.current.background.video;
				let videoTexture: any;
				try {
					videoTexture = await Assets.load(bgSrc);
				} catch {
					
					bgSrc = 'assets/background.mp4';
					videoTexture = await Assets.load(bgSrc);
				}
    
            if (onProgress) {
                onProgress(100);
            }
			const videoSource = videoTexture.source.resource;
			if (videoSource instanceof HTMLVideoElement) {
				try { videoSource.loop = true; } catch {}
				try { videoSource.muted = true; } catch {}
				try { (videoSource as any).playsInline = true; } catch {}
				try { videoSource.setAttribute('playsinline', 'true'); } catch {}
				try { videoSource.setAttribute('muted', 'true'); } catch {}
				try { videoSource.autoplay = true; } catch {}
				try { videoSource.setAttribute('autoplay', 'true'); } catch {}
				try { videoSource.preload = 'auto'; } catch {}
				try { const p = videoSource.play(); if (p && typeof p.catch === 'function') { p.catch(() => {}); } } catch {}
			} else {
				console.error("Yüklenen dosya video kaynağı değil.");
				return false;
			}
            this._backgroundFrames = [videoTexture];
			this.setNoMips(videoTexture);
            return true;
		} catch (error) {
			console.error("Background frames failed to load:", error);
			return false;
		}
	}


	public async bonusLoadBackgroundFrames(onProgress?: (progress: number) => void): Promise<boolean> {
		try {
				let bonusSrc = LayoutManager.instance.current.background.bonusVideo;
				let videoTexture: any;
				try {
					videoTexture = await Assets.load(bonusSrc);
				} catch {
					bonusSrc = 'assets/b_background.mp4';
					videoTexture = await Assets.load(bonusSrc);
				}
            if (onProgress) {
                onProgress(100);
            }
			const videoSource = videoTexture.source.resource;
			if (videoSource instanceof HTMLVideoElement) {
				try { videoSource.loop = true; } catch {}
				try { videoSource.muted = true; } catch {}
				try { (videoSource as any).playsInline = true; } catch {}
				try { videoSource.setAttribute('playsinline', 'true'); } catch {}
				try { videoSource.setAttribute('muted', 'true'); } catch {}
				try { videoSource.autoplay = true; } catch {}
				try { videoSource.setAttribute('autoplay', 'true'); } catch {}
				try { videoSource.preload = 'auto'; } catch {}
				try { const p = videoSource.play(); if (p && typeof p.catch === 'function') { p.catch(() => {}); } } catch {}
			} else {
				console.error("Yüklenen dosya video kaynağı değil.");
				return false;
			}
            this._bonusbackgroundFrames = [videoTexture];
			this.setNoMips(videoTexture);
            return true;
		} catch (error) {
			console.error("Bonus Background frames failed to load:", error);
			return false;
		}
	}

	public async loadWildFrames(onProgress?: (progress: number) => void): Promise<boolean> {
		try {
			const sheet = await Assets.load("assets/extended_s/texture.json");

			const frames: Texture[] = [];
			const keys = Object.keys(sheet.textures);

			keys.forEach((key, i) => {
				frames.push(sheet.textures[key]);

				if (onProgress) {
					onProgress(((i + 1) / keys.length) * 100);
				}
			});
			this._wildFrames = frames;
			
			const seen = new Set<any>();
			for (const t of this._wildFrames) {
				const bt = t?.source;
				if (bt && !seen.has(bt)) { this.setNoMips(t); seen.add(bt); }
			}
			return true;
		} catch (error) {
			console.error("Wild frames failed to load:", error);
			return false;
		}
	}


	public async loadSpinButtonFrames(): Promise<boolean> {
		try {
			await Assets.load('assets/spnbtn.png');
			this._spinButtonStatic = Texture.from('assets/spnbtn.png');
			this.setNoMips(this._spinButtonStatic);
			return true;
		} catch (error) {
			console.error("Spin button frames failed to load:", error);
			return false;
		}
	}

	public async loadFrames() {
		try {
			
			const frameTexPath = LayoutManager.instance.current.frame?.texture || (GameConstants.IS_MOBILE ? 'assets/mobile_frame.png' : 'assets/frame.png');
			const frameInnerPath = LayoutManager.instance.current.frame?.inner || 'assets/frame_2.jpg';
			await Assets.load(frameTexPath);
			await Assets.load(frameInnerPath);
			this.FRAME_TEXTURE = Texture.from(frameTexPath);
			this.FRAME_TEXTURE_2 = Texture.from(frameInnerPath);
			this.setNoMips(this.FRAME_TEXTURE);
			this.setNoMips(this.FRAME_TEXTURE_2);

			await this.loadinfobar();
			return true;
		} catch (error) {
			return false;
		}
	}
	public async soundLoader()
	{
		if (this._soundsLoaded) return;
		
		
		await soundManager.loadSounds();
		this._soundsLoaded = true;
	}

	public async initializeAudioContext(): Promise<void> {
		await soundManager.initializeOnUserGesture();
	}

	public async loadAssets(steps: number[], progressFill: Sprite, maxWidth: number): Promise<boolean> {
		if (!this._gameClient.app) return false;

		let progressValue = 10;

		let targetProgress = 10;
		const smoothUpdate = (newTarget: number) => {
    		targetProgress = Math.min(Math.max(newTarget, 0), 100);
		};
		const ticker = new Ticker();
		const tickerCallback = () => {
			if (!progressFill || (progressFill as any).destroyed) {
				ticker.stop();
				ticker.remove(tickerCallback);
				return;
			}
			progressValue += (targetProgress - progressValue) * 0.15;
			if (Math.abs(targetProgress - progressValue) < 0.1) {
				progressValue = targetProgress;
			}
			updateLoadingProgress(progressValue, progressFill, maxWidth);
			if (progressValue >= 99.9 && targetProgress >= 99.9) {
				updateLoadingProgress(100, progressFill, maxWidth);
				ticker.stop();
				ticker.remove(tickerCallback);
			}
		};

		ticker.add(tickerCallback);
		ticker.start();
		const texturesLoaded = await this.loadSymbolTextures(this._gameClient.symbols);
		if (!texturesLoaded) { errorBox(this._gameClient.app, "Unable to Load Game!"); return false; }
		smoothUpdate(steps[1]);

		const bgLoaded = await this.loadBackgroundFrames((progress) => {
			const target = steps[2] + progress * (steps[3] - steps[2]);
			smoothUpdate(target);
		});
		if (!bgLoaded) { errorBox(this._gameClient.app, "Unable to Load Game!"); return false; }
		const bonusLoaded = await this.bonusLoadBackgroundFrames((progress) => {
			const target = steps[3] + progress * (steps[4] - steps[3]);
			smoothUpdate(target);
		});
		if (!bonusLoaded) { errorBox(this._gameClient.app, "Unable to Load Game!"); return false; }

		const wildLoaded = await this.loadWildFrames((progress) => {
			const target = steps[4] + progress * (steps[5] - steps[4]);
			smoothUpdate(target);
		});
		if (!wildLoaded) { errorBox(this._gameClient.app, "Unable to Load Game!"); return false; }

		const frameLoaded = await this.loadFrames();
		if (!frameLoaded) { errorBox(this._gameClient.app, "Unable to Load Game!"); return false; }

		const spinLoaded = await this.loadSpinButtonFrames();
		if (!spinLoaded) { errorBox(this._gameClient.app, "Unable to Load Game!"); return false; }

		smoothUpdate(99);
		return true;
	}



	public get symbolTextures(): Record<string, Texture> {
		return this._symbolTextures;
	}

	public get backgroundFrames(): Texture[] {
		return this._backgroundFrames;
	}

	public get bonusBackgroundFrames(): Texture[] {
		return this._bonusbackgroundFrames;
	}

	public get wildFrames(): Texture[] {
		return this._wildFrames;
	}

	public get spinButtonFrames(): Texture[] {
		return this._spinButtonFrames;
	}

	public get spinButtonStatic(): Texture | null {
		return this._spinButtonStatic;
	}
	public get frame_texture(): Texture | null {
		return this.FRAME_TEXTURE;
	}
	public get frame_texture_2(): Texture | null {
		return this.FRAME_TEXTURE_2;
	}

	public get box0_texture(): Texture | null {
		return this.info_bar_box0_image;
	}
	public get box1_texture(): Texture | null {
		return this.info_bar_box1_image;
	}
	public get box2_texture(): Texture | null {
		return this.info_bar_box2_image;
	}
	public get wildStartImage(): Texture | null {
		return this._wildStartImage;
	}
	public get maxImage(): Texture | null {
		return this._maxImage;
	}
}
