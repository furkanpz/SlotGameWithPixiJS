import { TextStyle } from "pixi.js";
import { GameConstants } from "./GameConstants";
import { scalePx } from "./game.utils";

export class StyleConstants {
    private static instance: StyleConstants;
    private styleCache = new Map<string, TextStyle>();
    private screenWidth: number = 0;
    private screenHeight: number = 0;
    
    public static getInstance(): StyleConstants {
        if (!StyleConstants.instance) {
            StyleConstants.instance = new StyleConstants();
        }
        return StyleConstants.instance;
    }
    
    public initialize(screenWidth: number, screenHeight: number): void {
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;
        this.preloadCommonStyles();
    }
    
    private preloadCommonStyles(): void {
        this.getQuickPaylineWinStyle();
        this.getDetailedPaylineStyle();
        this.getMultiplierTextStyle();
        this.getBigWinTitleStyle();
        this.getBigWinAmountStyle();
    }
    
    public getQuickPaylineWinStyle(): TextStyle {
        const key = 'quickPaylineWin';
        if (!this.styleCache.has(key)) {
            
            const baseSize = GameConstants.IS_MOBILE ? 56 : 36;
            const strokeW = GameConstants.IS_MOBILE ? 4 : 3;
            const shadowBlur = GameConstants.IS_MOBILE ? 8 : 6;
            const shadowDistance = GameConstants.IS_MOBILE ? 5 : 4;
            const style = new TextStyle({
                fontFamily: GameConstants.FONTS.DEFAULT,
                fontSize: scalePx(baseSize, this.screenWidth, this.screenHeight),
                fill: GameConstants.COLORS.GOLD,
                fontWeight: 'bold',
                stroke: { color: GameConstants.COLORS.BLACK, width: strokeW },
                dropShadow: {
                    color: GameConstants.COLORS.BLACK,
                    blur: shadowBlur,
                    angle: Math.PI / 4,
                    distance: shadowDistance
                }
            });
            this.styleCache.set(key, style);
        }
        return this.styleCache.get(key)!;
    }
    
    public getDetailedPaylineStyle(): TextStyle {
        const key = 'detailedPayline';
        if (!this.styleCache.has(key)) {
            const style = new TextStyle({
                fontFamily: GameConstants.FONTS.DEFAULT,
                fontSize: scalePx(GameConstants.FONTS.SIZE_XL, this.screenWidth, this.screenHeight),
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
            this.styleCache.set(key, style);
        }
        return this.styleCache.get(key)!;
    }
    
    public getMultiplierTextStyle(): TextStyle {
        const key = 'multiplierText';
        if (!this.styleCache.has(key)) {
            
            const baseSize = GameConstants.IS_MOBILE ? 34 : 28;
            const style = new TextStyle({
                fontFamily: GameConstants.FONTS.LOGO,
                fontSize: scalePx(baseSize, this.screenWidth, this.screenHeight),
                fill: GameConstants.COLORS.GOLD,
                fontWeight: 'bold',
                stroke: { color: GameConstants.COLORS.BLACK, width: 2 },
                dropShadow: {
                    color: GameConstants.COLORS.BLACK,
                    blur: 4,
                    angle: Math.PI / 4,
                    distance: 3
                }
            });
            this.styleCache.set(key, style);
        }
        return this.styleCache.get(key)!;
    }
    
    public getBigWinTitleStyle(): TextStyle {
        const key = 'bigWinTitle';
        if (!this.styleCache.has(key)) {
            const style = new TextStyle({
                fontFamily: GameConstants.FONTS.DEFAULT,
                fontSize: scalePx(GameConstants.FONTS.SIZE_XXL, this.screenWidth, this.screenHeight),
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
            this.styleCache.set(key, style);
        }
        return this.styleCache.get(key)!;
    }
    
    public getBigWinAmountStyle(): TextStyle {
        const key = 'bigWinAmount';
        if (!this.styleCache.has(key)) {
            const style = new TextStyle({
                fontFamily: GameConstants.FONTS.DEFAULT,
                fontSize: scalePx(GameConstants.FONTS.SIZE_HUGE, this.screenWidth, this.screenHeight),
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
            this.styleCache.set(key, style);
        }
        return this.styleCache.get(key)!;
    }
    
    public getWinnerMultiplierStyle(): TextStyle {
        const key = 'winnerMultiplier';
        if (!this.styleCache.has(key)) {
            const style = new TextStyle({
                fontFamily: GameConstants.FONTS.DEFAULT,
                fontSize: scalePx(32, this.screenWidth, this.screenHeight),
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
            this.styleCache.set(key, style);
        }
        return this.styleCache.get(key)!;
    }
    public getOrCreateStyle(key: string, config: any): TextStyle {
        if (this.styleCache.has(key)) {
            return this.styleCache.get(key)!;
        }
        
        const style = new TextStyle(config);
        this.styleCache.set(key, style);
        return style;
    }
    public clearCache(): void {
        this.styleCache.forEach(style => style.destroy());
        this.styleCache.clear();
    }
    public getCacheStats(): { count: number, keys: string[] } {
        return {
            count: this.styleCache.size,
            keys: Array.from(this.styleCache.keys())
        };
    }
}
