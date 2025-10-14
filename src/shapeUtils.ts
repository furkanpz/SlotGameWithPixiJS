import { Application, Graphics, Sprite, Texture } from "pixi.js";

type CircleOpts = {
  fill?: number;
  fillAlpha?: number;
  stroke?: number;
  strokeWidth?: number;
  
  ssaa?: number;
  
  mipmap?: boolean;
};


const circleTextureCache = new Map<string, Texture>();

function cacheKey(radius: number, o: CircleOpts) {
  return [radius, o.fill ?? 0xffffff, o.fillAlpha ?? 1, o.stroke ?? 0, o.strokeWidth ?? 0, o.ssaa ?? 2, o.mipmap ? 1 : 0].join(":");
}

export function makeHiResCircleSprite(app: Application, radius: number, opts: CircleOpts = {}): Sprite {
  const { fill = 0xffffff, fillAlpha = 1, stroke, strokeWidth = 0, ssaa = 2, mipmap = true } = opts;

  const key = cacheKey(radius, { fill, fillAlpha, stroke, strokeWidth, ssaa, mipmap });
  let tex = circleTextureCache.get(key);
  if (!tex) {
    
    const g = new Graphics();
    const r = Math.max(1, radius);
    const rr = r * ssaa;
    g.circle(rr, rr, rr);
    g.fill({ color: fill, alpha: fillAlpha });
    if (stroke !== undefined && strokeWidth > 0) {
      g.stroke({ color: stroke, width: strokeWidth * ssaa });
    }
    tex = app.renderer.generateTexture({
      target: g,
      resolution: ssaa
    });    
    try { (tex.source.style as any).mipmap = !!mipmap; } catch {}
    circleTextureCache.set(key, tex);
    try { g.destroy(); } catch {}
  }

  const spr = new Sprite(tex);
  spr.anchor.set(0.5);
  
  spr.width = radius * 2 + (strokeWidth || 0);
  spr.height = radius * 2 + (strokeWidth || 0);
  return spr;
}
