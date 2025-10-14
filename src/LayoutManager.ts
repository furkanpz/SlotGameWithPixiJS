import { Assets } from 'pixi.js';
import { GameConstants } from './GameConstants';

export type LayoutPoint = { x: number; y: number; };
export type LayoutSize = { width: number; height: number; };
export type LayoutLogo = { asset: string; x: number; y: number; anchorX?: number; anchorY?: number; scale?: number };
export type LayoutConfig = {
  background: { video: string; bonusVideo: string };
  symbols?: { atlas: string };
  frame?: { texture: string; inner?: string };
  start?: { logo?: LayoutLogo };
  ui?: { spinButton?: LayoutPoint & LayoutSize };
};

export class LayoutManager {
  private static _instance: LayoutManager | null = null;
  private _layouts: { desktop: LayoutConfig; mobile: LayoutConfig } | null = null;

  static get instance(): LayoutManager {
    if (!this._instance) this._instance = new LayoutManager();
    return this._instance;
  }

  public async load(): Promise<void> {
    if (this._layouts) return;
    const data = await Assets.load('layouts.json');
    this._layouts = data as any;
  }

  public get current(): LayoutConfig {
    if (!this._layouts) throw new Error('Layouts not loaded');
    return GameConstants.IS_MOBILE ? this._layouts.mobile : this._layouts.desktop;
  }

  public get desktop(): LayoutConfig {
    if (!this._layouts) throw new Error('Layouts not loaded');
    return this._layouts.desktop;
  }

  public get mobile(): LayoutConfig {
    if (!this._layouts) throw new Error('Layouts not loaded');
    return this._layouts.mobile;
  }
}
