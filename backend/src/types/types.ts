export type Money = number;
export type SymbolDef = { id: string; name: string, type: string, isWild: string, isScatter: string, isSpecial?: string, payouts: {}};
export type SymbolId = string;
export type PaytableEntry = { symbol: SymbolId; countsToPayout: Record<number, Money>; isScatter?: boolean; substitutes?: boolean };
export enum spinType {
	NORMAL,
	BONUS_BOOST,
	BONUS,
	BONUS_2
}
