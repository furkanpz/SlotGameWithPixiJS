
import { SymbolDef, Money, PaytableEntry } from "../types/types";
import { MathModelConfig, ReelSet } from "../types/data.types";
import REELSETS_RAW from './forModels.json'

export const SYMBOLS = [
	{ id: "0", name: "wolf_wild", type: "wild", isWild: "1", isScatter: "0", payouts: { "5": "100" } },
	{ id: "1", name: "wolf_scatter", type: "scatter", isWild: "0", isScatter: "1", payouts: {} },
	{ id: "2", name: "ace_symbol", type: "low", isWild: "0", isScatter: "0", payouts: { "3": "1", "4": "5", "5": "10" } },
	{ id: "3", name: "king_symbol", type: "low", isWild: "0", isScatter: "0", payouts: { "3": "1", "4": "5", "5": "10" } },
	{ id: "4", name: "deer_symbol", type: "high", isWild: "0", isScatter: "0", payouts: { "3": "20", "4": "50", "5": "100" } },
	{ id: "5", name: "branch_symbol", type: "high", isWild: "0", isScatter: "0", payouts: { "3": "10", "4": "25", "5": "50" } },
	{ id: "6", name: "axe_symbol", type: "high", isWild: "0", isScatter: "0", payouts: { "3": "15", "4": "30", "5": "60" } },
	{ id: "7", name: "ten_symbol", type: "low", isWild: "0", isScatter: "0", payouts: { "3": "1", "4": "5", "5": "10" } },
	{ id: "8", name: "wolf_expanding_wild", type: "special_bonus", isWild: "0", isScatter: "0", isSpecial: "1", payouts: { "3": "10", "4": "30", "5": "60" } },
	{ id: "9", name: "symbol_archer_1", type: "mid", isWild: "0", isScatter: "0", payouts: { "3": "5", "4": "15", "5": "30" } }, 
	{ id: "10", name: "symbol_coin_1", type: "mid", isWild: "0", isScatter: "0", payouts: { "3": "5", "4": "15", "5": "30" } },
	{ id: "11", name: "symbol_gem_1", type: "mid", isWild: "0", isScatter: "0", payouts: { "3": "5", "4": "15" , "5": "30" } }
] satisfies SymbolDef[];

const LINES_Y: number[][] = [
    [0,0,0,0,0],
    [0,1,0,1,0],
    [0,1,2,3,4],
    [1,1,1,1,1],
    [1,2,1,2,1],
    [1,0,1,0,1],
    [1,2,3,2,1],
    [2,2,2,2,2],
    [2,3,2,3,2],
    [2,1,2,1,2],
    [2,3,4,3,2],
    [2,1,0,1,2],
    [3,3,3,3,3],
    [3,4,3,4,3],
    [3,2,3,2,3],
    [3,2,1,2,3],
    [4,4,4,4,4],
    [4,3,4,3,4],
    [4,3,2,1,0]
];

function buildPaytableFromSymbols() : PaytableEntry[] {
  return SYMBOLS.map(s => {
    const counts: Record<number, Money> = {};
    for (const k of Object.keys(s.payouts || {})) {
      const n = parseInt(k, 10);
      const v = Math.round(Number((s.payouts as any)[k]) ); 
      counts[n] = v;
    }
    return {
      symbol: s.id,
      countsToPayout: counts,
      isScatter: s.isScatter === "1",
      substitutes: s.isWild === "1" || s.id === "0"
    };
  });
}
function buildPaylines(rowsVisible = 5): number[][] {
  return LINES_Y.map((yArr, idx) => {
    
    return yArr.map((row, col) => col * rowsVisible + row);
  });
}

const PAYLINES_POSITIONS = buildPaylines(5);
const PAYTABLE = buildPaytableFromSymbols();

function buildReelSetFromRaw(name: string, raw: string[][]): ReelSet {
  return {
    id: name,
    rowsVisible: 5,
    ways: false,
    reels: raw.map((symbols, idx) => ({ id: `${name}_R${idx}`, symbols: symbols.slice() }))
  };
}

const ReelSets: Record<string, ReelSet> = {
  default: buildReelSetFromRaw("default", REELSETS_RAW.default),
  default_boost: buildReelSetFromRaw("default_boost", REELSETS_RAW.default_boost),
  bonus: buildReelSetFromRaw("bonus", REELSETS_RAW.bonus),
};

export const FiveByFiveModel: MathModelConfig = {
  name: "wolf_5x5_integrated",
  denomination: 1,
  minBet: 10,
  maxBet: 50000,
  maxWinCapMultiplier: 15000, 
  paytable: PAYTABLE,
  paylines: PAYLINES_POSITIONS,
  reelSets: ReelSets,
  baseReelSetId: "default",
  features: [
    { id: "fs_3", kind: "FREE_SPINS", trigger: { type: "SCATTER_COUNT", symbol: "1", min: 3 }, payload: { spins: 10 } },
    { id: "fs_4", kind: "FREE_SPINS", trigger: { type: "SCATTER_COUNT", symbol: "1", min: 4 }, payload: { spins: 10 } },
    
  ],
  wildId: "0",
  expandingId: "8",
  scatterId: "1"
};