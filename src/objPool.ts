import { Sprite, Texture, Text, TextStyle, Graphics, Container } from "pixi.js";

export class SpritePool {
    private pool: Sprite[] = [];
    private textures: Record<number, Texture>;
    private maxPool: number;
    private createdCount: number = 0;
    private reusedCount: number = 0;

    constructor(textures: Record<number, Texture>, maxPool = 200) {
        this.textures = textures;
        this.maxPool = maxPool;
    }

    get(symbolId: number): Sprite {
        let sprite: Sprite | undefined;
        while (this.pool.length > 0 && (!sprite || (sprite as any).destroyed)) {
            sprite = this.pool.pop();
        }
        if (sprite && !(sprite as any).destroyed) {
            this.reusedCount++;
            try { (sprite as any).removeAllListeners && (sprite as any).removeAllListeners(); } catch {}
        } else {
            sprite = new Sprite(this.textures[symbolId]);
            this.createdCount++;
        }
        
    try { sprite.texture = this.textures[symbolId]; } catch {}
    try { (sprite as any).__symbolId = symbolId; } catch {}
        try { sprite.visible = true; } catch {}
        try { sprite.rotation = 0; } catch {}
        try { sprite.scale.set(1, 1); } catch {}
        try { sprite.position.set(0, 0); } catch {}
        try { (sprite as any).zIndex = 0; } catch {}
        try { (sprite as any).tint = 0xFFFFFF; } catch {}
        try { sprite.alpha = 1; } catch {}
        try { sprite.filters = null; } catch {}
    try { sprite.interactive = false; } catch {}
    try { (sprite as any).eventMode = 'none'; } catch {}
        try { (sprite as any).buttonMode = false; } catch {}
        try { (sprite as any).hitArea = null; } catch {}
        try { (sprite as any).cursor = ''; } catch {}
        try { sprite.anchor && sprite.anchor.set && sprite.anchor.set(0.5); } catch {}
        try { (sprite as any).cacheAsTexture && (sprite as any).cacheAsTexture(false); } catch {}
        return sprite;
    }

    applyTexture(sprite: Sprite, symbolId: number) {
    sprite.texture = this.textures[symbolId];
    try { (sprite as any).__symbolId = symbolId; } catch {}
        sprite.visible = true;
    }
    acquireTextureSprite(texture: Texture): Sprite {
        let sprite: Sprite;
        if (this.pool.length > 0) {
            sprite = this.pool.pop()!;
            this.reusedCount++;
            sprite.texture = texture;
            sprite.visible = true;
        } else {
            sprite = new Sprite(texture);
            this.createdCount++;
            try { sprite.anchor.set(0, 0); } catch (e) {}
        }
        try {
            sprite.rotation = 0;
            sprite.scale.set(1, 1);
            if (texture && texture.width && texture.height) {
                sprite.width = texture.width;
                sprite.height = texture.height;
            }
            try { sprite.anchor && sprite.anchor.set && sprite.anchor.set(0, 0); } catch (e) {}
            try { (sprite as any).removeAllListeners && (sprite as any).removeAllListeners(); } catch (e) {}
            try { sprite.interactive = false; } catch (e) {}
            try { (sprite as any).eventMode = 'none'; } catch (e) {}
            try { (sprite as any).buttonMode = false; } catch (e) {}
            try { (sprite as any).hitArea = null; } catch (e) {}
            try { (sprite as any).cursor = ''; } catch (e) {}
            try { sprite.alpha = 1; } catch (e) {}
            try { (sprite as any).tint = 0xFFFFFF; } catch (e) {}
            try { sprite.filters = null; } catch (e) {}
            try { (sprite as any).cacheAsTexture && (sprite as any).cacheAsTexture(false); } catch (e) {}
        } catch (e) {}
        return sprite;
    }

    release(sprite: Sprite) {
        try {
            if ((sprite as any).destroyed) return;
            if (sprite.parent) {
                try { sprite.parent.removeChild(sprite); } catch (e) {}
            }
            sprite.visible = false;
            if (this.pool.indexOf(sprite) !== -1) return;
            if (this.pool.length < this.maxPool) {
                try { (sprite as any).removeAllListeners && (sprite as any).removeAllListeners(); } catch (e) {}
                try { sprite.interactive = false; } catch (e) {}
                try { (sprite as any).eventMode = 'none'; } catch (e) {}
                try { (sprite as any).buttonMode = false; } catch (e) {}
                try { (sprite as any).hitArea = null; } catch (e) {}
                try { (sprite as any).cursor = ''; } catch (e) {}
                try { sprite.alpha = 1; } catch (e) {}
                try { (sprite as any).tint = 0xFFFFFF; } catch (e) {}
                try { sprite.filters = null; } catch (e) {}
                try { (sprite as any).cacheAsTexture && (sprite as any).cacheAsTexture(false); } catch (e) {}
                try { this.pool.push(sprite); } catch (e) {}
            } else {
                try { sprite.destroy(); } catch (e) {}
            }
        } catch (e) {
            try { sprite.destroy(); } catch (e) {}
        }
    }
    public getPoolSize(): number {
        return this.pool.length;
    }

    public getCreatedCount(): number {
        return this.createdCount;
    }

    public getReusedCount(): number {
        return this.reusedCount;
    }
    public getActiveCount(): number {
        return Math.max(0, this.createdCount - this.getPoolSize());
    }
    public debugLog(prefix = ''): void {
        try {
            console.log(`${prefix} SpritePool created=${this.createdCount} reused=${this.reusedCount} pool=${this.getPoolSize()} active=${this.getActiveCount()}`);
        } catch (e) {}
    }
}

export class ObjectPool {
    private textPool: Text[] = [];
    private graphicsPool: Graphics[] = [];
    private containerPool: Container[] = [];
    private maxTextPool: number;
    private maxGraphicsPool: number;
    private maxContainerPool: number;
    private defaultTextStyle: TextStyle;
    private textCreated: number = 0;
    private textReused: number = 0;
    private graphicsCreated: number = 0;
    private graphicsReused: number = 0;
    private containerCreated: number = 0;
    private containerReused: number = 0;

    constructor(defaultTextStyle?: TextStyle, maxTextPool = 100, maxGraphicsPool = 100, maxContainerPool = 100) {
        this.defaultTextStyle = defaultTextStyle || new TextStyle({
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xffffff
        });
        this.maxTextPool = maxTextPool;
        this.maxGraphicsPool = maxGraphicsPool;
        this.maxContainerPool = maxContainerPool;
    }

    acquireText(): Text {
        let t: Text | undefined;
        while (this.textPool.length > 0 && (!t || (t as any).destroyed)) {
            t = this.textPool.pop();
        }
        if (t && !(t as any).destroyed) {
            this.textReused++;
        } else {
			t = new Text({text: '', style: this.defaultTextStyle.clone()}); 
            this.textCreated++;
        }
    try { (t as any).removeAllListeners && (t as any).removeAllListeners(); } catch (e) {}
    this.resetText(t);
        t.visible = true;
        return t;
    }

    releaseText(t: Text) {
        try {
            if ((t as any).destroyed) return;
            if (t.parent) {
                try { t.parent.removeChild(t); } catch (e) {}
            }
            
            try { (t as any).removeAllListeners && (t as any).removeAllListeners(); } catch (e) {}
            try { (t as any).buttonMode = false; } catch (e) {}
            try { (t as any).hitArea = null; } catch (e) {}
            this.resetText(t);
            t.visible = false;
            if (this.textPool.length < this.maxTextPool && !(t as any).destroyed) {
                this.textPool.push(t);
            } else {
                t.destroy();
            }
        } catch (e) {
            try { t.destroy(); } catch {}
        }
    }

    acquireGraphics(): Graphics {
        let g: Graphics | undefined;
        while (this.graphicsPool.length > 0 && (!g || (g as any).destroyed)) {
            g = this.graphicsPool.pop();
        }
        if (g && !(g as any).destroyed) {
            this.graphicsReused++;
        } else {
            g = new Graphics();
            this.graphicsCreated++;
        }
    try { (g as any).removeAllListeners && (g as any).removeAllListeners(); } catch (e) {}
    this.resetGraphics(g);
        g.visible = true;
        return g;
    }

    releaseGraphics(g: Graphics) {
        try {
            if ((g as any).destroyed) return;
            if (g.parent) {
                try { g.parent.removeChild(g); } catch (e) {}
            }
            
            try { (g as any).removeAllListeners && (g as any).removeAllListeners(); } catch (e) {}
            try { (g as any).buttonMode = false; } catch (e) {}
            try { (g as any).hitArea = null; } catch (e) {}
            
            try { (g as any).removeChildren && (g as any).removeChildren(); } catch (e) {}
            this.resetGraphics(g);
            g.visible = false;
            if (this.graphicsPool.length < this.maxGraphicsPool && !(g as any).destroyed) {
                this.graphicsPool.push(g);
            } else {
                g.destroy();
            }
        } catch (e) {
            try { g.destroy(); } catch {}
        }
    }

    acquireContainer(): Container {
        let c: Container | undefined;
        while (this.containerPool.length > 0 && (!c || (c as any).destroyed)) {
            c = this.containerPool.pop();
        }
        if (c && !(c as any).destroyed) {
            this.containerReused++;
        } else {
            c = new Container();
            this.containerCreated++;
        }
        try { (c as any).removeAllListeners && (c as any).removeAllListeners(); } catch (e) {}
    this.resetContainer(c);
        c.visible = true;
        return c;
    }

    releaseContainer(c: Container) {
        try {
            if ((c as any).destroyed) return;
            if (c.parent) {
                try { c.parent.removeChild(c); } catch (e) {}
            }
            
            try { c.removeChildren(); } catch (e) {}
            try { (c as any).removeAllListeners && (c as any).removeAllListeners(); } catch (e) {}
            try { c.interactive = false; } catch (e) {}
            try { (c as any).buttonMode = false; } catch (e) {}
            try { (c as any).hitArea = null; } catch (e) {}
            this.resetContainer(c);
            c.visible = false;
            if (this.containerPool.length < this.maxContainerPool && !(c as any).destroyed) {
                this.containerPool.push(c);
            } else {
                try { c.destroy({ children: true }); } catch {}
            }
        } catch (e) {
            try { c.destroy({ children: true }); } catch {}
        }
    }

    private resetText(t: Text) {
        try {
            t.text = '';
            t.alpha = 1;
            (t as any).renderable = true;
            t.rotation = 0;
            t.scale.set(1, 1);
            t.x = 0; t.y = 0;
            t.anchor && (t.anchor.set && t.anchor.set(0.5, 0.5));
            t.style = this.defaultTextStyle.clone();
            t.interactive = false;
            try { (t as any).eventMode = 'none'; } catch {}
            try { (t as any).buttonMode = false; } catch (e) {}
            try { (t as any).hitArea = null; } catch (e) {}
            try { (t as any).cursor = ''; } catch (e) {}
            try { (t as any).tint = 0xFFFFFF; } catch (e) {}
            try { (t as any).filters = null; } catch (e) {}
            try { (t as any).zIndex = 0; } catch (e) {}
            try { (t as any).visible = true; } catch (e) {}
            try { (t as any).label = ''; } catch (e) {}
        } catch (e) {}
    }

    private resetGraphics(g: Graphics) {
        try {
            g.clear();
            g.alpha = 1;
            (g as any).renderable = true;
            g.rotation = 0;
            g.scale.set(1, 1);
            g.x = 0; g.y = 0;
            
            try { (g as any).removeChildren && (g as any).removeChildren(); } catch {}
            
            try { (g as any).interactive = false; } catch {}
            try { (g as any).eventMode = 'none'; } catch {}
            try { (g as any).buttonMode = false; } catch (e) {}
            try { (g as any).hitArea = null; } catch (e) {}
            
            try { (g as any).mask = null; } catch {}
            try { (g as any).cursor = ''; } catch (e) {}
            try { (g as any).tint = 0xFFFFFF; } catch (e) {}
            try { (g as any).filters = null; } catch (e) {}
            try { (g as any).blendMode = 'normal'; } catch {}
            try { (g as any).zIndex = 0; } catch (e) {}
            try { (g as any).visible = true; } catch (e) {}
            try { (g as any).label = ''; } catch {}
            try {
                if ((g as any).cacheAsTexture) (g as any).cacheAsTexture(false);
            } catch {}
        } catch (e) {}
    }

    private resetContainer(c: Container) {
        try {
            c.alpha = 1;
            (c as any).renderable = true;
            c.rotation = 0;
            c.scale.set(1, 1);
            c.x = 0; c.y = 0;
            c.zIndex = 0;
            c.sortableChildren = false;
            
            try { c.removeChildren(); } catch {}
            try { (c as any).interactive = false; } catch {}
            try { (c as any).eventMode = 'none'; } catch {}
            try { (c as any).buttonMode = false; } catch (e) {}
            try { (c as any).hitArea = null; } catch (e) {}
            try { (c as any).mask = null; } catch {}
            try { (c as any).cursor = ''; } catch (e) {}
            try { (c as any).filters = null; } catch (e) {}
            try { (c as any).blendMode = 'normal'; } catch {}
            try { c.visible = true; } catch (e) {}
            try { (c as any).label = ''; } catch {}
            try {
                if ((c as any).cacheAsTexture) (c as any).cacheAsTexture(false);
            } catch {}
        } catch (e) {}
    }

    public clear() {
        for (const t of this.textPool) { try { t.destroy(); } catch {} }
        for (const g of this.graphicsPool) { try { g.destroy(); } catch {} }
    for (const c of this.containerPool) { try { c.destroy({ children: true }); } catch {} }
        this.textPool = [];
        this.graphicsPool = [];
    this.containerPool = [];
    }

    
    public releaseTexts(ts: Text[]) { for (const t of ts) { try { this.releaseText(t); } catch {} } }
    public releaseGraphicsMany(gs: Graphics[]) { for (const g of gs) { try { this.releaseGraphics(g); } catch {} } }
    public releaseContainers(cs: Container[]) { for (const c of cs) { try { this.releaseContainer(c); } catch {} } }
    public getTextPoolSize(): number {
        return this.textPool.length;
    }

    public getGraphicsPoolSize(): number {
        return this.graphicsPool.length;
    }

    public getTextCreated(): number { return this.textCreated; }
    public getTextReused(): number { return this.textReused; }
    public getGraphicsCreated(): number { return this.graphicsCreated; }
    public getGraphicsReused(): number { return this.graphicsReused; }
    public getContainerPoolSize(): number { return this.containerPool.length; }
    public getContainerCreated(): number { return this.containerCreated; }
    public getContainerReused(): number { return this.containerReused; }
}