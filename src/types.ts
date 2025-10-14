
export type SymbolType = {
	id: string;
	name: string;
	type: 'wild' | 'scatter' | 'low' | 'mid' | 'high' | 'special_bonus';
	isWild: string;
	isScatter: string;
	payouts: Record<string, string>;
	isSpecial?: string;
};

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
