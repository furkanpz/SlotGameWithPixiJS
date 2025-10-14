import { Application, Container, Text, TextStyle, Graphics, Sprite, AnimatedSprite } from "pixi.js";

type SpritePoolStats = { created: number; reused: number; pool: number; active: number };
type ObjectPoolStats = {
    textCreated: number; textReused: number; textPool: number;
    graphicsCreated: number; graphicsReused: number; graphicsPool: number;
    containerCreated: number; containerReused: number; containerPool: number;
};

type Providers = {
    getSpritePoolStats?: () => SpritePoolStats;
    getObjectPoolStats?: () => ObjectPoolStats;
};

export class PerformanceMonitor {
    private app: Application;
    private container: Container;
    private text: Text;
    private bg: Graphics;
    private visible: boolean = true;
    private detailsVisible: boolean = false;
    private detailsBg: Graphics;
    private detailsText: Text;
    private detailsButton: Container;
    private dumpButton: Container;

    private lastTime: number = 0;
    private frameCount: number = 0;
    private fps: number = 0;
    private updateInterval: number = 500; 
    private accumulator: number = 0;
    private running: boolean = false;

    constructor(app: Application, private spritePoolProvider?: () => number, private objectPoolProvider?: () => number, private providers?: Providers) {
        this.app = app;
        this.container = new Container();
        this.container.zIndex = 9999;
        this.container.sortableChildren = false;

        this.bg = new Graphics();
        this.bg.rect(0, 0, 200, 60).fill({ color: 0x000000, alpha: 0.5 });
        this.container.addChild(this.bg);

        this.text = new Text({
            text: 'FPS: -\nMEM: -\nOBJS: -\nPOOL: -',
            style: new TextStyle({
                fontFamily: 'monospace',
                fontSize: 12,
                fill: 0x00ff00,
                lineHeight: 14
            })
        });
        this.text.x = 6;
        this.text.y = 6;
        this.container.addChild(this.text);

        
        this.detailsBg = new Graphics();
        this.detailsBg.visible = false;
        this.detailsText = new Text({
            text: '',
            style: new TextStyle({ fontFamily: 'monospace', fontSize: 12, fill: 0xffffff, lineHeight: 16, wordWrap: true, wordWrapWidth: 520 })
        });
        this.detailsText.visible = false;
        this.detailsText.x = 10;
        this.detailsText.y = 80;
        this.container.addChild(this.detailsBg);
        this.container.addChild(this.detailsText);

        
        this.detailsButton = this.createButton(6, 66, 80, 18, 'DETAILS', () => this.toggleDetails());
        this.dumpButton = this.createButton(92, 66, 60, 18, 'DUMP', () => this.dumpSnapshot());
        this.container.addChild(this.detailsButton);
        this.container.addChild(this.dumpButton);

        this.lastTime = performance && performance.now ? performance.now() : Date.now();
    }

    public getContainer(): Container {
        return this.container;
    }

    public start(): void {
        if (this.running) return;
        this.running = true;
    this.app.ticker.add(this._tickerWrapper as any);
    }

    public stop(): void {
        if (!this.running) return;
        this.running = false;
    try { this.app.ticker.remove(this._tickerWrapper as any); } catch (e) {}
    }

    private onTick = (_delta: number) => {
        const now = performance && performance.now ? performance.now() : Date.now();
        this.frameCount++;
        const dt = now - this.lastTime;
        this.accumulator += dt;
        if (this.accumulator >= this.updateInterval) {
            this.fps = Math.round((this.frameCount / this.accumulator) * 1000);
            this.frameCount = 0;
            this.accumulator = 0;
            this.lastTime = now;
            this.updateText();
        } else {
            this.lastTime = now;
        }
    }

    private _tickerWrapper = (_ticker: any) => {
        try { this.onTick(0); } catch (e) {}
    }

    private updateText(): void {
        const fpsText = `FPS: ${this.fps}`;
        let memText = 'MEM: n/a';
        if ((performance as any) && (performance as any).memory) {
            const mem = (performance as any).memory.usedJSHeapSize / 1024 / 1024;
            memText = `MEM: ${mem.toFixed(1)} MB`;
        }
        
        const snapshot = this.createSnapshot();
        const objsText = `OBJS: ${snapshot.objects.total}`;
        let poolText = '';
        try {
            const sp = this.spritePoolProvider ? this.spritePoolProvider() : null;
            const op = this.objectPoolProvider ? this.objectPoolProvider() : null;
            poolText = `SPRITE_POOL: ${sp !== null ? sp : '-'}  OBJ_POOL(TXT,GR): ${op !== null ? op : '-'} `;
        } catch (e) { poolText = 'POOL: n/a'; }
        const texMB = (snapshot.textures.totalBytes / (1024 * 1024)).toFixed(2);
        const texText = `TEX: ≈${texMB} MB`;
        this.text.text = `${fpsText}\n${memText}\n${objsText}\n${poolText}\n${texText}`;
        const w = Math.max(160, this.text.width + 12);
        const baseH = Math.max(48, this.text.height + 12);
        const buttonArea = 28; 
        const h = baseH + buttonArea;
        this.bg.clear();
        this.bg.rect(0, 0, w, h).fill({ color: 0x000000, alpha: 0.5 });

        
        try {
            this.detailsButton.x = 6;
            this.detailsButton.y = baseH + 6;
            this.dumpButton.x = this.detailsButton.x + (this.detailsButton.width || 86) + 8;
            
            if ((this.dumpButton.x + (this.dumpButton.width || 66)) > (w - 6)) {
                this.dumpButton.x = Math.max(6, w - (this.dumpButton.width || 66) - 6);
            }
            this.dumpButton.y = baseH + 6;
        } catch (e) {}

        if (this.detailsVisible) {
            this.refreshDetailsPanel();
        }
    }

    public show(): void {
        this.visible = true;
        try { this.container.visible = true; } catch (e) {}
    }

    public hide(): void {
        this.visible = false;
        try { this.container.visible = false; } catch (e) {}
    }

    public toggle(): void {
        if (this.visible) this.hide(); else this.show();
    }

    

        
    private createButton(x: number, y: number, w: number, h: number, label: string, onClick: () => void): Container {
        const container = new Container();
        const g = new Graphics();
        g.roundRect(0, 0, w, h, 3).fill({ color: 0x222222, alpha: 0.9 }).stroke({ color: 0xaaaaaa, width: 1 });
        container.x = x; container.y = y;
        container.interactive = true; (container as any).cursor = 'pointer';
        container.on('pointerdown', onClick);
        const t = new Text({ text: label, style: new TextStyle({ fontFamily: 'monospace', fontSize: 10, fill: 0xffffff }) });
        t.x = 6; t.y = 2;
        container.addChild(g);
        container.addChild(t);
        return container;
    }

    private toggleDetails(): void {
        this.detailsVisible = !this.detailsVisible;
        this.detailsBg.visible = this.detailsVisible;
        this.detailsText.visible = this.detailsVisible;
        if (this.detailsVisible) {
            this.refreshDetailsPanel();
        }
    }

    private refreshDetailsPanel(): void {
        const snapshot = this.createSnapshot();
        const lines: string[] = [];
        lines.push('— DETAILS —');
        lines.push(`Objects: total=${snapshot.objects.total} containers=${snapshot.objects.containers} sprites=${snapshot.objects.sprites} texts=${snapshot.objects.texts} graphics=${snapshot.objects.graphics} animSprites=${snapshot.objects.animatedSprites}`);
        if (this.providers?.getSpritePoolStats) {
            const ps = this.providers.getSpritePoolStats();
            lines.push(`SpritePool: created=${ps.created} reused=${ps.reused} pool=${ps.pool} active=${ps.active}`);
        }
        if (this.providers?.getObjectPoolStats) {
            const op = this.providers.getObjectPoolStats();
            lines.push(`ObjectPool: T(${op.textCreated}/${op.textReused}/${op.textPool}) G(${op.graphicsCreated}/${op.graphicsReused}/${op.graphicsPool}) C(${op.containerCreated}/${op.containerReused}/${op.containerPool})`);
        }
        if ((snapshot as any).textures) {
            const tex = (snapshot as any).textures;
            const totalMB = (tex.totalBytes / (1024 * 1024)).toFixed(2);
            lines.push(`Textures: unique=${tex.uniqueCount} total≈${totalMB} MB (est.)`);
            lines.push('Top textures by size:');
            const topTex = tex.items.slice(0, 10);
            for (const t of topTex) {
                const mb = (t.bytes / (1024 * 1024)).toFixed(2);
                lines.push(`• ${t.key}  ${t.width}x${t.height}  ≈${mb} MB  usedBy×${t.usedBy}`);
            }
            if (tex.items.length > 10) lines.push(`… and ${tex.items.length - 10} more`);
        }
        lines.push('Assets in use (top 25):');
        const topAssets = snapshot.assets.slice(0, 25);
        for (const a of topAssets) {
            lines.push(`• ${a.key}  x${a.count}`);
        }
        if (snapshot.assets.length > 25) {
            lines.push(`… and ${snapshot.assets.length - 25} more`);
        }
        this.detailsText.text = lines.join('\n');
        const panelW = Math.max(540, this.detailsText.width + 20);
        const panelH = Math.max(200, Math.min(420, this.detailsText.height + 20));
        this.detailsBg.clear();
        this.detailsBg.rect(4, 84, panelW, panelH).fill({ color: 0x000000, alpha: 0.85 }).stroke({ color: 0x555555, width: 1 });
        this.detailsText.x = 10; this.detailsText.y = 90;
    }

    private dumpSnapshot(): void {
        const snapshot = this.createSnapshot();
        try { console.groupCollapsed('[Performance] Full Snapshot'); } catch {}
        try { console.log(snapshot); } catch {}
        try { console.groupEnd(); } catch {}
    }

    private createSnapshot(): { objects: any; assets: Array<{ key: string; count: number }>; textures: { uniqueCount: number; totalBytes: number; items: Array<{ key: string; width: number; height: number; bytes: number; usedBy: number }> } } {
        const typeCounts = { total: 0, containers: 0, sprites: 0, graphics: 0, texts: 0, animatedSprites: 0 };
        const assetMap = new Map<string, number>();
        const uniqueTex = new Map<string, { key: string; width: number; height: number; bytes: number; usedBy: number }>();
        const stack: Container[] = [this.app.stage];
        while (stack.length) {
            const node = stack.pop()!;
            typeCounts.total++;
            if (node instanceof Container) typeCounts.containers++;
            for (const child of node.children) {
                typeCounts.total++;
                if (child instanceof Container) {
                    typeCounts.containers++;
                    stack.push(child as Container);
                }
                if (child instanceof Sprite) {
                    typeCounts.sprites++;
                    const key = this.describeTexture((child as any));
                    const prev = assetMap.get(key) || 0;
                    assetMap.set(key, prev + 1);
                    
                    try {
                        const info = this.getTextureInfo((child as any));
                        if (info && info.uid) {
                            const existing = uniqueTex.get(info.uid);
                            if (!existing) {
                                uniqueTex.set(info.uid, { key: info.key, width: info.width, height: info.height, bytes: info.bytes, usedBy: 1 });
                            } else {
                                existing.usedBy += 1;
                            }
                        }
                    } catch {}
                }
                if (child instanceof Graphics) typeCounts.graphics++;
                if (child instanceof Text) typeCounts.texts++;
                if (child instanceof AnimatedSprite) typeCounts.animatedSprites++;
            }
        }
        const assetsArr = Array.from(assetMap.entries()).map(([key, count]) => ({ key, count }));
        assetsArr.sort((a, b) => b.count - a.count);
        let totalBytes = 0;
        const texturesArr = Array.from(uniqueTex.values());
        for (const t of texturesArr) totalBytes += t.bytes || 0;
        texturesArr.sort((a, b) => b.bytes - a.bytes);
        return { objects: typeCounts, assets: assetsArr, textures: { uniqueCount: texturesArr.length, totalBytes, items: texturesArr } };
    }

    private describeTexture(sprite: any): string {
        try {
            const tex = sprite?.texture;
            const base = tex?.source || {};
            const res = base?.resource;
            const label = tex?.label || base?.label || '';
            const cacheIds = tex?.textureCacheIds || tex?._cacheIds || [];
            const src = res?.src || res?.url || res?.source || '';
            const size = (tex?.width && tex?.height) ? `${tex.width}x${tex.height}` : '';
            const key = label || (cacheIds[0] || '') || (typeof src === 'string' ? src.split('/').slice(-2).join('/') : '') || '[unknown]';
            return size ? `${key} (${size})` : key;
        } catch {
            return '[unknown]';
        }
    }

    private getTextureInfo(sprite: any): { uid: string; key: string; width: number; height: number; bytes: number } | null {
        try {
            const tex = sprite?.texture;
            if (!tex) return null;
            const base: any = tex.source || {};
            const w = tex.width || base.width || 0;
            const h = tex.height || base.height || 0;
            const uid = base.uid || base.cacheId || base.label || (base.resource && (base.resource.src || base.resource.url)) || (tex.textureCacheIds && tex.textureCacheIds[0]) || Math.random().toString(36).slice(2);
            const key = this.describeTexture(sprite);
            const bytes = Math.max(0, (w|0) * (h|0) * 4); 
            return { uid: String(uid), key, width: w|0, height: h|0, bytes };
        } catch { return null; }
    }
}
