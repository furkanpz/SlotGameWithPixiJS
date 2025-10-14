import { Howl, Howler } from "howler";

type PlayOptions = {
    volume?: number;
    loop?: boolean;
    speed?: number; 
};

export class SoundManager {
    private static instance: SoundManager;
    private isInitialized = false;
    private soundsLoaded = false;
    private sounds: Map<string, Howl> = new Map();

    private constructor() {}

    public static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    public async initializeOnUserGesture(): Promise<void> {
        if (this.isInitialized) return;
        try {
            
            const ctx = (Howler as any).ctx as AudioContext | undefined;
            if (ctx && ctx.state === "suspended") {
                await ctx.resume();
                console.log("AudioContext resumed successfully after user gesture");
            }
            this.isInitialized = true;
        } catch (error) {
            console.warn("Failed to initialize AudioContext:", error);
        }
    }

    public async loadSounds(): Promise<void> {
        if (this.soundsLoaded) return;
        const add = (alias: string, url: string) => {
            if (this.sounds.has(alias)) return;
            try {
                const howl = new Howl({
                    src: [url],
                    preload: true,
                    html5: false, 
                    volume: 1.0,
                    loop: false,
                });
                this.sounds.set(alias, howl);
            } catch (e) {
                console.warn(`Failed to create Howl for ${alias}:`, e);
            }
        };
        try {
            add("bgm", "assets/sounds/bgm.mp3");
            add("start", "assets/sounds/start.mp3");
            add("stop0", "assets/sounds/stop0.mp3");
            add("stop1", "assets/sounds/stop1.mp3");
            add("stop2", "assets/sounds/stop2.mp3");
            add("stop3", "assets/sounds/stop3.mp3");
            add("stop4", "assets/sounds/stop4.mp3");
            add("scatter", "assets/sounds/scatter.mp3");
            add("scattermiss", "assets/sounds/scattermiss.mp3");
            add("bonus_wolf", "assets/sounds/bonus_wolf.mp3");
            add("payline", "assets/sounds/payline.mp3");
            add("win", "assets/sounds/win.mp3");
            add("symbol1_0", "assets/sounds/1_0.mp3");
            add("symbol1_1", "assets/sounds/1_1.mp3");
            add("symbol1_2", "assets/sounds/1_2.mp3");
            add("symbol1_3", "assets/sounds/1_3.mp3");
            add("symbol1_4", "assets/sounds/1_4.mp3");
            add("symbol1_main", "assets/sounds/1.mp3");
            this.soundsLoaded = true;
        } catch (error) {
            console.warn("Sound loading failed:", error);
        }
    }

    public async play(alias: string, options?: PlayOptions): Promise<void> {
        try {
            if (!this.isInitialized) {
                await this.initializeOnUserGesture();
            }
            const howl = this.sounds.get(alias);
            if (!howl) throw new Error(`Sound '${alias}' not loaded`);

            
            await new Promise<void>((resolve, reject) => {
                if (howl.state() === "loaded") return resolve();
                const onLoad = () => { howl.off("load", onLoad); resolve(); };
                const onLoadErr = (_id: any, err: any) => { howl.off("loaderror", onLoadErr); reject(err); };
                howl.once("load", onLoad);
                howl.once("loaderror", onLoadErr);
            });

            if (options?.volume !== undefined) howl.volume(options.volume);
            if (options?.speed !== undefined) howl.rate(options.speed);
            if (options?.loop !== undefined) howl.loop(options.loop);
            howl.play();
        } catch (error) {
            console.warn(`Failed to play sound ${alias}:`, error);
        }
    }

    public stop(alias: string): void {
        try {
            const howl = this.sounds.get(alias);
            if (howl) howl.stop();
        } catch (error) {
            console.warn(`Failed to stop sound ${alias}:`, error);
        }
    }

    public find(alias: string): any {
        try {
            const howl = this.sounds.get(alias);
            if (!howl) return null;
            
            return {
                get volume() { return howl.volume(); },
                set volume(v: number) { try { howl.volume(v); } catch {} },
                get isPlaying() { try { return howl.playing(); } catch { return false; } },
                pause() { try { howl.pause(); } catch {} },
                resume() { try { if (!howl.playing()) { howl.play(); } } catch {} },
                play(opts?: PlayOptions) {
                    try {
                        if (opts?.volume !== undefined) howl.volume(opts.volume);
                        if (opts?.speed !== undefined) howl.rate(opts.speed);
                        if (opts?.loop !== undefined) howl.loop(opts.loop);
                        howl.play();
                    } catch {}
                },
                stop() { try { howl.stop(); } catch {} },
                _howl: howl,
            };
        } catch (error) {
            console.warn(`Failed to find sound ${alias}:`, error);
            return null;
        }
    }
}

export const soundManager = SoundManager.getInstance();
