/**
 * Tüm oyun sınıflarında kullanılan ortak sabitler ve değişkenler
 */
export class GameConstants {
    // Grid sabitleri
    public static readonly GRID_ROWS: number = 5;
    public static readonly GRID_COLS: number = 5;
    
    // Reel boyutları (başlangıç değerleri, runtime'da ölçeklenecek)
    public static REEL_SIZE: number = 125;
    public static REEL_SIZE_FOR_FRAME: number = 150;

    public static readonly GAME_FIRST_START_FADE_TIME: number = 2000;
    
    // Para birimi sabitleri
    public static readonly MIN_AMOUNT_TO_MIN_CURRENCY: number = 10;
    public static readonly MIN_CURRENCY: number = 0.1;
    public static readonly SELECTION_AMOUNT_INDEX: number = 10;
    public static readonly SELECT_AMOUNT = 
        [
            10, 20, 40, 60, 80, 100, 120, 140,
            160, 180, 200, 300, 400, 500, 600, 700, 800, 900,
            1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000,
            7500, 10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000
        ];
    public static readonly SELECT_AMOUNT_LENGTH = this.SELECT_AMOUNT.length;
    // Demo modu sabitleri
    public static readonly DEMO_BALANCE: number = 500000;
    public static readonly DEFAULT_BET: number = 2;

    public static currency = "$";
    public static home_url = "/";
    // Device flag
    private static _IS_MOBILE: boolean = false;
    public static setIsMobile(v: boolean) { this._IS_MOBILE = !!v; }
    public static get IS_MOBILE(): boolean { return this._IS_MOBILE; }

    // Spin animasyonu sabitleri - 3 Level Turbo System
    public static readonly SPIN_SPEED_NORMAL: number = 45;
    public static readonly SPIN_SPEED_TURBO: number = 78; // Slightly faster turbo
    public static readonly SPIN_SPEED_SUPER_TURBO: number = 112; // Slightly faster super turbo
    public static readonly MIN_SPEED_NORMAL: number = 24;
    public static readonly MIN_SPEED_TURBO: number = 46; // Keep min proportionally higher
    public static readonly MIN_SPEED_SUPER_TURBO: number = 67; // Keep min proportionally higher
    public static readonly DECELERATION_NORMAL: number = 0.95;
    public static readonly DECELERATION_TURBO: number = 0.88; // New middle level
    public static readonly DECELERATION_SUPER_TURBO: number = 0.3; // Old turbo becomes super turbo
    // Mobile-only slight boost for normal mode (not turbo)
    public static readonly MOBILE_NORMAL_SPIN_MULT: number = 1.35; // ~%12 faster
    public static readonly MOBILE_NORMAL_MIN_MULT: number = 1.10;  // keep min speed close
    // Global mobile multiplier applied to ALL levels (normal + turbo) for a slight proportional boost
    public static readonly MOBILE_GLOBAL_SPIN_MULT: number = 1.10; // +10% speed on mobile
    public static readonly MOBILE_GLOBAL_MIN_MULT: number = 1.05;  // +5% min speed on mobile
    
    // Reel başlangıç gecikmeleri - 3 Level System
    public static readonly REEL_START_DELAY_NORMAL: number = 150; // ms per reel
    public static readonly REEL_START_DELAY_TURBO: number = 90; // Slightly shorter start delay
    public static readonly REEL_START_DELAY_SUPER_TURBO: number = 26; // Slightly shorter start delay
    public static readonly TURBO_ANIMATOR_DELAY: number = 50; // ms per animator
    public static readonly TURBO_FINALIZE_DELAY: number = 400; // ms turbo finalize delay
    
    // Backward compatibility
    public static readonly SPIN_SPEED_TURBO_OLD: number = 100; // For backward compatibility
    public static readonly MIN_SPEED_TURBO_OLD: number = 60;
    public static readonly DECELERATION_TURBO_OLD: number = 0.8;
    public static readonly REEL_START_DELAY: number = 150; // Kept for compatibility
    public static readonly TURBO_REEL_START_DELAY: number = 50; // Kept for compatibility
    
    // Symbol boyut oranı
    public static readonly SYMBOL_SIZE_RATIO: number = 0.95;
    
    // Animasyon hızları
    public static readonly WILD_ANIMATION_SPEED_NORMAL: number = 0.8;
    public static readonly WILD_ANIMATION_SPEED_TURBO: number = 1.6;
    public static readonly BACKGROUND_ANIMATION_SPEED: number = 0.6;
    public static readonly BONUS_BACKGROUND_ANIMATION_SPEED: number = 0.55;
    public static readonly SPIN_BUTTON_ANIMATION_SPEED: number = 0.9;
    
    // Spin butonu gecikme süreleri - 3 Level System
    public static readonly SPIN_BUTTON_DELAY_NORMAL: number = 500;
    public static readonly SPIN_BUTTON_DELAY_TURBO: number = 300; // New middle level
    public static readonly SPIN_BUTTON_DELAY_SUPER_TURBO: number = 100; // Old turbo becomes super turbo
    public static readonly SLOW_ANIMATION_DELAY_NORMAL: number = 3000;
    public static readonly SLOW_ANIMATION_DELAY_TURBO: number = 1500; // New middle level
    public static readonly SLOW_ANIMATION_DELAY_SUPER_TURBO: number = 1000; // Old turbo becomes super turbo
    
    // Big Win multiplier thresholds
    public static readonly BIG_WIN_THRESHOLD: number = 25;
    public static readonly MEGA_WIN_THRESHOLD: number = 50;
    public static readonly SUPER_MEGA_WIN_THRESHOLD: number = 100;
    public static readonly EPIC_WIN_THRESHOLD: number = 300;
    public static readonly MAX_WIN_THRESHOLD: number = 15000;
    
    // WILD PLAY DELAY
    
    public static readonly WILD_DELAY_NORMAL: number = 400;
    public static readonly WILD_DELAY_TURBO: number = 200; // New middle level
    public static readonly WILD_DELAY_SUPER_TURBO: number = 50; // Old turbo becomes super turbo
    

    // Renk sabitleri
    public static readonly COLORS = {
        BACKGROUND: 0x000000,
        GOLD: 0xFFD700,
        ORANGE: 0xFFA500,
        RED: 0xFF4444,
        ORANGE_BRIGHT: 0xfc540d,
        GREEN: 0x78C841,
        PURPLE: 0x8000FF,
        PINK: 0xFF0080,
        WHITE: 0xFFFFFF,
        LIGHT_GRAY: 0xCCCCCC,
        DARK_GRAY: 0x808080,
        BLACK: 0x000000,
        DARK_BLUE:0x213555
    } as const;


    // PULLBACK ANİMASYON
    public static readonly PULLBACK_DISTANCE: number = this.REEL_SIZE / 3;
    public static readonly PULLBACK_AACCELERATION_DURATION: number = 100;
    public static readonly pullbackDuration: number = 200;

    
    public static readonly BASE_URL = "https://ram3mz7u6j.execute-api.us-east-1.amazonaws.com/demo";
    public static readonly priv = 0;
    public static readonly API_URLS = this.priv ? {
        BASE: `${this.BASE_URL}/api`,
        SYMBOLS: `${this.BASE_URL}/api/symbols`,
        SERVERCHECK: `${this.BASE_URL}/ping`,
        SPIN: `${this.BASE_URL}/api/spin`,
        BONUS_BUY: `${this.BASE_URL}/api/bonus-buy`
    } as const : {
        BASE: `http://localhost:3001/demo/api`,
        SYMBOLS: `http://localhost:3001/demo/api/symbols`,
        SERVERCHECK: `http://localhost:3001/demo/ping`,
        SPIN: `http://localhost:3001/demo/api/spin`,
        BONUS_BUY: `http://localhost:3001/demo/api/bonus-buy`
    } as const;
    
    // Bahis limitleri
    public static readonly MIN_BET: number = 10;
    public static readonly MAX_BET: number = 1000;
    
    // Font sabitleri
    public static readonly FONTS = {
        DEFAULT: 'Arial',
        DEFAULT2: 'Bebas Neue',
        LOGO: 'Cinzel Decorative',
        SIZE_SMALL: 20,
        SIZE_MEDIUM: 24,
        SIZE_LARGE: 32,
        SIZE_XL: 40,
        SIZE_XXL: 80,
        SIZE_HUGE: 120
    } as const;
    
    // Ticker sabitleri
    public static readonly TICKER = {
        MIN_FPS: 60,
        MAX_FPS: 120
    } as const;
    
    // Ekran sabitleri
    public static readonly SCREEN = {
        BASE_WIDTH: 1920,
        BASE_HEIGHT: 1080
    } as const;
    // Mobile reference logical resolution (portrait)
    public static readonly MOBILE_SCREEN = {
        BASE_WIDTH: 1080,
        BASE_HEIGHT: 1920
    } as const;
    
    // Symbol ID'leri
    public static readonly SYMBOL_IDS = {
        WILD: '8',        // String olarak
        SCATTER: '1'      // String olarak
    } as const;
    
    // Freespin sabitleri
    public static readonly FREESPIN = {
        MIN_SCATTERS_TO_TRIGGER: 3,
        BONUS_ROUNDS_10_SPINS: 10,
        SCATTER_ANIMATION_DURATION_NORMAL: 2000,
        SCATTER_ANIMATION_DURATION_TURBO: 1000,
        FREESPIN_START_DELAY_NORMAL: 1000,
        FREESPIN_START_DELAY_TURBO: 500, // New middle level
        FREESPIN_START_DELAY_SUPER_TURBO: 300, // Old turbo becomes super turbo
        FREESPIN_MODE_BACKGROUND_COLOR: 0x1a0d4d, // Daha koyu mor ton
        FREESPIN_INTERVAL_NORMAL: 750, // Her freespin arası 3 saniye
        FREESPIN_INTERVAL_TURBO: 500,  // New middle level
        FREESPIN_INTERVAL_SUPER_TURBO: 250,  // Old turbo becomes super turbo
        FREESPIN_ANIMATION_DELAY: 1500, // Freespin başlamadan önce bekleme
        OVERLAY_ANIMATION_DURATION: 1500 // Overlay açılış animasyonu
    } as const;
    
    // Auto Spin sabitleri
    public static readonly AUTO_SPIN = {
        DEFAULT_SPINS: 10,
        MAX_SPINS: 1000,
        AVAILABLE_COUNTS: [1000, 500, 250, 100, 50, 25, 10],
    // Daha akıcı bir autospin deneyimi için bekleme süreleri azaltıldı
    DELAY_BETWEEN_SPINS_NORMAL: 900, // ms (önce 2000)
    DELAY_BETWEEN_SPINS_TURBO: 250,  // ms (önce 500)
        BUTTON_WIDTH: 60,
        BUTTON_HEIGHT: 40
    } as const;
    
    // Payline animasyon sabitleri
    public static readonly PAYLINE_ANIMATION = {
        FADE_IN_DURATION: 200,
        HOLD_DURATION: 800,
        FADE_OUT_DURATION: 200,
        STROKE_WIDTH: 6,
        STROKE_WIDTH_DETAILED: 8
    } as const;
    
    // Wild animasyon sabitleri
    public static readonly WILD_ANIMATION = {
        DELAY_NORMAL: 500,
        DELAY_TURBO: 300, // New middle level
        DELAY_SUPER_TURBO: 100, // Old turbo becomes super turbo
        BLINK_DURATION_NORMAL: 3000,
        BLINK_DURATION_TURBO: 1000,
        BLINK_CYCLE_SPEED_NORMAL: 600,
        BLINK_CYCLE_SPEED_TURBO: 300,
        MOVE_DURATION_NORMAL: 1000,
        MOVE_DURATION_TURBO: 500,
        MOVE_DELAY_NORMAL: 500,
        MOVE_DELAY_TURBO: 375, // New middle level  
        MOVE_DELAY_SUPER_TURBO: 250 // Old turbo becomes super turbo
    } as const;
    
    // Big Win animasyon sabitleri
    public static readonly BIG_WIN_ANIMATION = {
        OVERLAY_FADE_DURATION: 500,
        TEXT_FADE_IN_DURATION: 400,
        HOLD_DURATION: 1000,
        FADE_OUT_DURATION: 500,
        COUNT_UP_DURATION: 10000,
        MILESTONE_ANIMATION_DURATION: 800
    } as const;
    
    // Multiplier milestones
    public static readonly MULTIPLIER_MILESTONES: readonly number[] = [25, 50, 100, 300, 1000, 5000, 15000] as const;
    
    // Grid lines
    public static readonly GRID_LINES = {
        COLOR: 0x808080,
        WIDTH: 1,
        ALPHA: 0.3
    } as const;
    
    // Blur filter
    public static readonly BLUR_FILTER = {
        BLUR_AMOUNT: 5
    } as const;
    
    // Box styling
    public static readonly BOX_STYLING = {
        SHADOW_ALPHA: 0.3,
        BACKGROUND_ALPHA: 0.4,
        BORDER_WIDTH: 2,
        BOTTOM_MARGIN: 20,
        SHADOW_OFFSET: 6
    } as const;
    
    /**
     * Reel boyutlarını ekran ölçeğine göre günceller
     */
    public static updateReelSizes(screenWidth: number, screenHeight: number): void {
        // Use device-aware reference so mobile (1080x1920) doesn’t shrink the grid
        const baseWidth = GameConstants.getRefWidth();
        const baseHeight = GameConstants.getRefHeight();
        const scaleX = screenWidth / baseWidth;
        const scaleY = screenHeight / baseHeight;
    let scale = Math.min(scaleX, scaleY);
    // Slightly larger grid on mobile
    if (GameConstants.IS_MOBILE) scale *= 1.25;
        GameConstants.REEL_SIZE = Math.floor(125 * scale);
        GameConstants.REEL_SIZE_FOR_FRAME = Math.floor(150 * scale);
    }
    
    /**
     * Pixel değerini ekran ölçeğine göre hesaplar
     */
    public static scalePx(
        basePx: number,
        screenWidth: number,
        screenHeight: number,
    refWidth: number = GameConstants.getRefWidth(),
    refHeight: number = GameConstants.getRefHeight()
    ): number {
        const scaleX = screenWidth / refWidth;
        const scaleY = screenHeight / refHeight;
        const scale = Math.min(scaleX, scaleY);
        return Math.floor(basePx * scale);
    }
    
    /**
     * Oyun grid'inin toplam genişliğini döndürür
     */
    public static getGridWidth(): number {
    return GameConstants.GRID_COLS * GameConstants.REEL_SIZE;
    }
    
    /**
     * Oyun grid'inin toplam yüksekliğini döndürür
     */
    public static getGridHeight(): number {
        return GameConstants.GRID_ROWS * GameConstants.REEL_SIZE;
    }
    
    /**
     * Frame genişliğini döndürür
     */
    public static getFrameWidth(): number {
        return (GameConstants.GRID_COLS + 2.2) * GameConstants.REEL_SIZE_FOR_FRAME;
    }
    
    /**
     * Frame yüksekliğini döndürür
     */
    public static getFrameHeight(): number {
        return (GameConstants.GRID_ROWS + 2.2) * GameConstants.REEL_SIZE_FOR_FRAME;
    }
    
    /**
     * Inner frame genişliğini döndürür
     */
    public static getInnerFrameWidth(): number {
        return (GameConstants.GRID_COLS + 1) * GameConstants.REEL_SIZE_FOR_FRAME;
    }
    
    /**
     * Inner frame yüksekliğini döndürür
     */
    public static getInnerFrameHeight(): number {
        return (GameConstants.GRID_ROWS + 1) * GameConstants.REEL_SIZE_FOR_FRAME;
    }
    
    /**
     * Grid offset X değerini döndürür
     */
    public static getGridOffsetX(): number {
        return (GameConstants.REEL_SIZE * GameConstants.GRID_COLS) / 2;
    }
    
    /**
     * Grid offset Y değerini döndürür
     */
    public static getGridOffsetY(): number {
        return (GameConstants.REEL_SIZE * GameConstants.GRID_ROWS) / 2;
    }

    // Reference base width/height depending on device
    public static getRefWidth(): number {
        return this.IS_MOBILE ? this.MOBILE_SCREEN.BASE_WIDTH : this.SCREEN.BASE_WIDTH;
    }
    public static getRefHeight(): number {
        return this.IS_MOBILE ? this.MOBILE_SCREEN.BASE_HEIGHT : this.SCREEN.BASE_HEIGHT;
    }

    /**
     * Wild Positons X değerini döndürür (sonra)
     */
    
    // Helper functions for 3-level turbo system
    public static getSpinSpeed(turboLevel: number): number {
        let base: number;
        switch (turboLevel) {
            case 0:
                base = this.SPIN_SPEED_NORMAL * (this.IS_MOBILE ? this.MOBILE_NORMAL_SPIN_MULT : 1);
                break;
            case 1:
                base = this.SPIN_SPEED_TURBO;
                break;
            case 2:
                base = this.SPIN_SPEED_SUPER_TURBO;
                break;
            default:
                base = this.SPIN_SPEED_NORMAL;
        }
        if (this.IS_MOBILE) base *= this.MOBILE_GLOBAL_SPIN_MULT;
        return Math.round(base);
    }
    
    public static getMinSpeed(turboLevel: number): number {
        let base: number;
        switch (turboLevel) {
            case 0:
                base = this.MIN_SPEED_NORMAL * (this.IS_MOBILE ? this.MOBILE_NORMAL_MIN_MULT : 1);
                break;
            case 1:
                base = this.MIN_SPEED_TURBO;
                break;
            case 2:
                base = this.MIN_SPEED_SUPER_TURBO;
                break;
            default:
                base = this.MIN_SPEED_NORMAL;
        }
        if (this.IS_MOBILE) base *= this.MOBILE_GLOBAL_MIN_MULT;
        return Math.round(base);
    }
    public static getWildDelay(turboLevel: number): number
    {
        switch (turboLevel) {
            case 0: return this.WILD_DELAY_NORMAL;
            case 1: return this.WILD_DELAY_TURBO;
            case 2: return this.WILD_DELAY_SUPER_TURBO;
            default: return this.WILD_DELAY_NORMAL;
        }
    }
    
    public static getAmountFromIndex(index: number): number
    {
        return this.SELECT_AMOUNT[index];
    }

    public static setCurrency(value: string): void
    {
        this.currency = value;
    }
    public static setHome(value: string): void
    {
        this.home_url = value;
    }
    public static getDeceleration(turboLevel: number): number {
        switch (turboLevel) {
            case 0: return this.DECELERATION_NORMAL;
            case 1: return this.DECELERATION_TURBO;
            case 2: return this.DECELERATION_SUPER_TURBO;
            default: return this.DECELERATION_NORMAL;
        }
    }
    
    public static getReelStartDelay(turboLevel: number): number {
        switch (turboLevel) {
            case 0: return this.REEL_START_DELAY_NORMAL;
            case 1: return this.REEL_START_DELAY_TURBO;
            case 2: return this.REEL_START_DELAY_SUPER_TURBO;
            default: return this.REEL_START_DELAY_NORMAL;
        }
    }
    
    public static getSpinButtonDelay(turboLevel: number): number {
        switch (turboLevel) {
            case 0: return this.SPIN_BUTTON_DELAY_NORMAL;
            case 1: return this.SPIN_BUTTON_DELAY_TURBO;
            case 2: return this.SPIN_BUTTON_DELAY_SUPER_TURBO;
            default: return this.SPIN_BUTTON_DELAY_NORMAL;
        }
    }
    
    public static getSlowAnimationDelay(turboLevel: number): number {
        switch (turboLevel) {
            case 0: return this.SLOW_ANIMATION_DELAY_NORMAL;
            case 1: return this.SLOW_ANIMATION_DELAY_TURBO;
            case 2: return this.SLOW_ANIMATION_DELAY_SUPER_TURBO;
            default: return this.SLOW_ANIMATION_DELAY_NORMAL;
        }
    }
    
    public static getFreespinStartDelay(turboLevel: number): number {
        switch (turboLevel) {
            case 0: return this.FREESPIN.FREESPIN_START_DELAY_NORMAL;
            case 1: return this.FREESPIN.FREESPIN_START_DELAY_TURBO;
            case 2: return this.FREESPIN.FREESPIN_START_DELAY_SUPER_TURBO;
            default: return this.FREESPIN.FREESPIN_START_DELAY_NORMAL;
        }
    }
    
    public static getFreespinInterval(turboLevel: number): number {
        switch (turboLevel) {
            case 0: return this.FREESPIN.FREESPIN_INTERVAL_NORMAL;
            case 1: return this.FREESPIN.FREESPIN_INTERVAL_TURBO;
            case 2: return this.FREESPIN.FREESPIN_INTERVAL_SUPER_TURBO;
            default: return this.FREESPIN.FREESPIN_INTERVAL_NORMAL;
        }
    }

    // Wild animation helpers (extended to respect turbo level directly)
    public static getWildBlinkDuration(turboLevel: number): number {
        switch (turboLevel) {
            case 0: return this.WILD_ANIMATION.BLINK_DURATION_NORMAL;
            case 1: return Math.round(this.WILD_ANIMATION.BLINK_DURATION_TURBO * 0.75); // slightly faster than turbo when mid-level
            case 2: return this.WILD_ANIMATION.BLINK_DURATION_TURBO; // fastest
            default: return this.WILD_ANIMATION.BLINK_DURATION_NORMAL;
        }
    }
    public static getWildBlinkCycleSpeed(turboLevel: number): number {
        switch (turboLevel) {
            case 0: return this.WILD_ANIMATION.BLINK_CYCLE_SPEED_NORMAL;
            case 1: return Math.round((this.WILD_ANIMATION.BLINK_CYCLE_SPEED_NORMAL + this.WILD_ANIMATION.BLINK_CYCLE_SPEED_TURBO) / 2);
            case 2: return this.WILD_ANIMATION.BLINK_CYCLE_SPEED_TURBO;
            default: return this.WILD_ANIMATION.BLINK_CYCLE_SPEED_NORMAL;
        }
    }
    public static getWildMoveDuration(turboLevel: number): number {
        switch (turboLevel) {
            case 0: return this.WILD_ANIMATION.MOVE_DURATION_NORMAL;
            case 1: return Math.round(this.WILD_ANIMATION.MOVE_DURATION_TURBO * 1.25); // mid between normal and turbo
            case 2: return this.WILD_ANIMATION.MOVE_DURATION_TURBO;
            default: return this.WILD_ANIMATION.MOVE_DURATION_NORMAL;
        }
    }
    public static getWildMoveDelay(turboLevel: number): number {
        switch (turboLevel) {
            case 0: return this.WILD_ANIMATION.MOVE_DELAY_NORMAL;
            case 1: return Math.round((this.WILD_ANIMATION.MOVE_DELAY_NORMAL + this.WILD_ANIMATION.MOVE_DELAY_TURBO) / 2);
            case 2: return this.WILD_ANIMATION.MOVE_DELAY_TURBO;
            default: return this.WILD_ANIMATION.MOVE_DELAY_NORMAL;
        }
    }
    public static getWildAnimationSpeed(turboLevel: number): number {
        switch (turboLevel) {
            case 0: return this.WILD_ANIMATION_SPEED_NORMAL;
            case 1: return (this.WILD_ANIMATION_SPEED_NORMAL + this.WILD_ANIMATION_SPEED_TURBO) / 2; // midpoint
            case 2: return this.WILD_ANIMATION_SPEED_TURBO;
            default: return this.WILD_ANIMATION_SPEED_NORMAL;
        }
    }

    // Payline animation helpers (fade/hold durations scale with turbo level)
    public static getPaylineFadeIn(turboLevel: number): number {
        const base = this.PAYLINE_ANIMATION.FADE_IN_DURATION;
        switch (turboLevel) {
            case 0: return base;
            case 1: return Math.round(base * 0.75);
            case 2: return Math.round(base * 0.5);
            default: return base;
        }
    }
    public static getPaylineHold(turboLevel: number): number {
        const base = this.PAYLINE_ANIMATION.HOLD_DURATION;
        switch (turboLevel) {
            case 0: return base;
            case 1: return Math.round(base * 0.7);
            case 2: return Math.round(base * 0.45);
            default: return base;
        }
    }
    public static getPaylineFadeOut(turboLevel: number): number {
        const base = this.PAYLINE_ANIMATION.FADE_OUT_DURATION;
        switch (turboLevel) {
            case 0: return base;
            case 1: return Math.round(base * 0.75);
            case 2: return Math.round(base * 0.5);
            default: return base;
        }
    }
}
