export type SupportedLocale = "tr" | "en";

interface Dictionary {
  [key: string]: string | Dictionary;
}

const dictionaries: Record<SupportedLocale, Dictionary> = {
  tr: {
    hud: {
      balance: "BAKİYE",
      demoBalance: "DEMO BAKİYESİ",
      bet: "BAHİS",
      win: "KAZANÇ",
      totalWin: "TOPLAM KAZANÇ",
      bonus: "BONUS",
      bonusBuy: "BONUS SATIN AL",
      freeSpins: "ÜCRETSİZ DÖNDÜRMELER",
      autoShort: "OTO",
      spinsRemaining: "{count} DÖNDÜRME",
      currentFreespins: "{current}/{total}",
    },
    menu: {
      homepage: "ANA SAYFA",
      info: "BİLGİ",
      sound: "SES",
      music: "MÜZİK",
      superTurbo: "SÜPER TURBO",
      turbo: "TURBO",
    },
    bonusBuy: {
      volatilityVeryHigh: "VOLATİLİTE: ÇOK YÜKSEK",
      buy: "SATIN AL",
      booster: {
        title: "BONUS GÜÇLENDİRME",
        description: "Her çevirmede bonus oyununun tetiklenme olasılığını 4 kat artırır.",
        enable: "ETKİNLEŞTİR",
        disable: "KAPAT",
      },
      wolfBonus: {
        title: "WOLF BONUS",
        description: "Daha fazla Wolf ve Wild sembolü içeren 10 ücretsiz döndürme sunar.",
      },
      darkMoon: {
        title: "DARK MOON",
        description: "10 ücretsiz döndürme boyunca her çevirmede en az bir Wolf sembolü yer alır.",
      },
    },
    infoOverlay: {
      volatilityVeryHigh: "VOLATİLİTE: ÇOK YÜKSEK",
      wolfSymbols: {
        title: "WOLF SEMBOLLERİ",
        description: "Wolf sembolü makaralara yayılarak güçlü çarpan özelliğini etkinleştirir. Her kazanç 200x seviyesine kadar güçlenebilir.",
      },
      freeGames: {
        title: "ÜCRETSİZ OYUNLAR",
        description: "Ücretsiz oyunlar sırasında makaralarda daha fazla Wolf sembolü belirir. Bonus 4 Scatter ile tetiklenir ise her çevirme bir Wolf sembolü içerir.",
      },
      maxWin: {
        title: "MAKSİMUM KAZANÇ",
        description: "Ormandaki gizemli gücü serbest bırakın. Doğru kombinasyonlar, olağanüstü çarpanlarla unutulmaz kazanç fırsatları yaratır.",
      },
    },
    freeSpins: {
      awardedTitle: "10 ÜCRETSİZ DÖNDÜRME KAZANDINIZ",
      introDescription: "Bonus turuna girdiniz. Makaralarda daha fazla Extra Wild görünecek ve genişleyen çarpan özelliğine sahip Wolf sembolünün gelme olasılığı artacak.",
      continueDesktop: "Devam etmek için tıklayın",
      continueMobile: "Devam etmek için dokunun",
      completedTitle: "ÜCRETSİZ DÖNDÜRMELER BİTTİ",
    },
    errors: {
      genericTitle: "BİR SORUN OLUŞTU",
      loadGameFailed: "Oyun yüklenemedi.",
      lowBalance: "Bakiyeniz yetersiz. Oyuna devam etmek için lütfen bakiye ekleyin.",
      returnHome: "Ana Sayfaya Dön",
      unableToStartGame: "Oyun başlatılamadı.",
    },
    recovery: {
      retry: "Tekrar Dene",
      recovering: "Oyun yeniden hazırlanıyor...",
      retrying: "Tekrar deneniyor...",
      unableToStartGame: "Oyun başlatılamadı.",
    },
    bigWin: {
      win: "KAZANÇ",
      big: "BÜYÜK KAZANÇ",
      mega: "MEGA KAZANÇ",
      superMega: "SÜPER MEGA KAZANÇ",
      epic: "EPİK KAZANÇ",
      max: "MAKSİMUM KAZANÇ",
    },
  },
  en: {
    hud: {
      balance: "BALANCE",
      demoBalance: "DEMO BALANCE",
      bet: "BET",
      win: "WIN",
      totalWin: "TOTAL WIN",
      bonus: "BONUS",
      bonusBuy: "BONUS BUY",
      freeSpins: "FREE SPINS",
      autoShort: "AUTO",
      spinsRemaining: "{count} SPINS",
      currentFreespins: "{current}/{total}",
    },
    menu: {
      homepage: "HOME",
      info: "INFO",
      sound: "SOUND",
      music: "MUSIC",
      superTurbo: "SUPER TURBO",
      turbo: "TURBO",
    },
    bonusBuy: {
      volatilityVeryHigh: "VOLATILITY: VERY HIGH",
      buy: "BUY",
      booster: {
        title: "BONUS BOOSTER",
        description: "Increases the chance of triggering the bonus game by 4x on every spin.",
        enable: "ENABLE",
        disable: "DISABLE",
      },
      wolfBonus: {
        title: "WOLF BONUS",
        description: "Awards 10 free spins with more Wolf and Wild symbols on the reels.",
      },
      darkMoon: {
        title: "DARK MOON",
        description: "Awards 10 free spins with a guaranteed Wolf symbol on every spin.",
      },
    },
    infoOverlay: {
      volatilityVeryHigh: "VOLATILITY: VERY HIGH",
      wolfSymbols: {
        title: "WOLF SYMBOLS",
        description: "The Wolf symbol expands across the reels and activates a powerful multiplier feature. Each win can be boosted up to 200x.",
      },
      freeGames: {
        title: "FREE GAMES",
        description: "During Free Games, more Wolf symbols appear on the reels. Trigger the bonus with 4 Scatters, and every spin is guaranteed to include a Wolf symbol.",
      },
      maxWin: {
        title: "MAX WIN",
        description: "Unleash the full power of the wolves. In the mysterious forest, every spin can open the way to extraordinary reward potential.",
      },
    },
    freeSpins: {
      awardedTitle: "YOU WON 10 FREE SPINS",
      introDescription: "You have entered the bonus round. Expect more Extra Wilds on the reels and a stronger chance of landing the expanding Wolf multiplier symbol.",
      continueDesktop: "Click to Continue",
      continueMobile: "Tap to Continue",
      completedTitle: "FREE SPINS COMPLETED",
    },
    errors: {
      genericTitle: "SOMETHING WENT WRONG",
      loadGameFailed: "Unable to load the game.",
      lowBalance: "Your balance is too low. Please add funds to continue playing.",
      returnHome: "Return to Home",
      unableToStartGame: "Unable to start the game.",
    },
    recovery: {
      retry: "Retry",
      recovering: "Recovering...",
      retrying: "Retrying...",
      unableToStartGame: "Unable to start the game.",
    },
    bigWin: {
      win: "WIN",
      big: "BIG WIN",
      mega: "MEGA WIN",
      superMega: "SUPER MEGA WIN",
      epic: "EPIC WIN",
      max: "MAX WIN",
    },
  },
};

let currentLocale: SupportedLocale = "en";

const localeTagMap: Record<SupportedLocale, string> = {
  tr: "tr-TR",
  en: "en-US",
};

const resolvePath = (locale: SupportedLocale, key: string): string | undefined => {
  const parts = key.split(".");
  let current: string | Dictionary | undefined = dictionaries[locale];

  for (const part of parts) {
    if (!current || typeof current === "string") {
      return undefined;
    }
    current = current[part];
  }

  return typeof current === "string" ? current : undefined;
};

const interpolate = (template: string, params?: Record<string, string | number>): string => {
  if (!params) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_match, key) => {
    if (!(key in params)) {
      return "";
    }
    return String(params[key]);
  });
};

export const detectLocale = (): SupportedLocale => {
  const languages = [
    ...(Array.isArray(navigator.languages) ? navigator.languages : []),
    navigator.language,
  ].filter((value): value is string => typeof value === "string" && value.length > 0);

  return languages.some((language) => language.toLowerCase().startsWith("tr")) ? "tr" : "en";
};

export const setLocale = (locale: SupportedLocale): void => {
  currentLocale = locale;
};

export const getLocale = (): SupportedLocale => currentLocale;

export const getLocaleTag = (): string => localeTagMap[currentLocale];

export const applyDocumentLocale = (): SupportedLocale => {
  const locale = detectLocale();
  setLocale(locale);
  document.documentElement.lang = locale;
  return locale;
};

export const t = (key: string, params?: Record<string, string | number>): string => {
  const localized = resolvePath(currentLocale, key) ?? resolvePath("en", key) ?? key;
  return interpolate(localized, params);
};

export const formatNumber = (
  value: number,
  options?: Intl.NumberFormatOptions,
): string => new Intl.NumberFormat(getLocaleTag(), options).format(value);

const normalizeCurrencySymbol = (currencySymbol: string): string => {
  if (currentLocale === "tr" && (currencySymbol === "$" || currencySymbol === "TRY")) {
    return "TL ";
  }

  return currencySymbol;
};

export const formatCurrency = (
  value: number,
  currencySymbol = "",
  options?: Intl.NumberFormatOptions,
): string =>
  `${normalizeCurrencySymbol(currencySymbol)}${formatNumber(value, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  })}`;

export const getContinuePrompt = (): string =>
  t(`freeSpins.${window.matchMedia("(pointer: coarse)").matches ? "continueMobile" : "continueDesktop"}`);
