import { Money, SymbolDef, SymbolId, PaytableEntry, spinType } from "./types";

export interface ReelStrip { id: string; symbols: SymbolId[]; weights?: number[] }
export interface ReelSet { id: string; reels: ReelStrip[]; rowsVisible: number; ways?: boolean }

export interface MathModelConfig {
	name: string;
	denomination: number;
	minBet: Money; maxBet: Money;
	maxWinCapMultiplier?: number;
	paytable: PaytableEntry[];
	paylines: number[][];
	reelSets: Record<string, ReelSet>;
	baseReelSetId: string;
	features: FeatureDefinition[];
	wildId?: SymbolId;
	expandingId?: SymbolId;
	scatterId?: SymbolId;
}

export type GroupedSymbol = {
	symbol: string;
	totalPayout: number;
	matches: {
		lineIndex: number;
		count: number;
		positions: [number, number][];
		payout: number;
		multiplier: number;
	}[];
};

export type BonusSpinResult = {
	_win: boolean;
	_details: GroupedSymbol[];
	_amount: number;
	_payout: number;
	_wildPositions: { column: number; multiplier: number[] }[];
	_stopIndex: number[];
};

export type spinResult = {
	win: boolean;
	details: GroupedSymbol[];
	amount: number;
	payout: number;
	scatterCounts: number;
	wildPositions: { column: number; multiplier: number[] }[];
	stopIndex: number[];
	bonusRounds?: BonusSpinResult[]; 
}

export interface SpinResult {
	win: boolean;
	roundId: string;
	reelSetId: string;
	stopIndexes: number[];
	grid: SymbolId[][]; 
	lineWins: LineWin[];
	scatterCount: number;
	totalWin: Money;
	featureOutcomes: { featureId: string; awarded?: any }[];
	nextState?: EngineState;
	rngProof: any;
}
export interface FeatureDefinition {
	id: string;
	kind: "FREE_SPINS" | "RESPIN" | "MODIFIER" | "PICK" | "JACKPOT" | "CUSTOM";
	trigger: { type: "SCATTER_COUNT"; symbol: SymbolId; min: number };
	payload?: Record<string, any>;
}

export interface SpinRequest {
	roundId: string;
	bet: Money;
	spinType: spinType
	reelSetId?: string;
	qaSeed?: string;
}

export interface EngineState {
	inFeature?: boolean;
	featureStack: { featureId: string; remaining?: number; reelSetId?: string; guaranteeDuel?: boolean }[];
}

export type LineWin = {
	lineIndex: number;
	symbol: string;
	count: number;
	positions: [col: number, row: number][];
	payout: number;
};


export interface SpinResultServer {
	win: boolean;
	roundId: string;
	reelSetId: string;
	stopIndexes: number[];
	grid: SymbolId[][]; 
	lineWins: LineWin[];
	scatterCount: number;
	totalWin: Money;
}