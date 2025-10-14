import { SymbolId, Money } from "./types/types";
import { MathModelConfig, LineWin, GroupedSymbol } from "./types/data.types";

export class MathEngine {
  	constructor(private cfg: MathModelConfig) {}

	private rows() { return this.cfg.reelSets[this.cfg.baseReelSetId].rowsVisible; }

	isWild(sym: SymbolId) {
		const p = this.cfg.paytable.find(x => x.symbol === sym);
		return !!(p && p.substitutes);
	}

	isScatter(sym: SymbolId) {
		const p = this.cfg.paytable.find(x => x.symbol === sym);
		return !!(p && p.isScatter);
	}
 	gridTurnToWild(grid: SymbolId[][])
	{
		const wild_column: number[] = [];
		const expandingId = this.cfg.expandingId ?? "8";
		const wildId = this.cfg.wildId ?? "0";
		for (let y = 0; y < grid.length; y++)
		{
			grid[y].forEach((s, i) => {
				if (s == expandingId)
					wild_column.push(i);
			})
		}
		for (const x of wild_column)
		{
			for (let i = 0; i < 5; i++)
				grid[i][x] = wildId;
		}
	}
	evaluateLines(grid: SymbolId[][], duelColumnMultipliers: Record<number, number[]>, bet: Money): 
		{groupedWin: GroupedSymbol[], payout: number,  wild: { column: number; multiplier: number[] }[]}
	{
		const PayOutAmount = bet == 10 ? 1 : bet / 10;
    	const rows = this.rows();
		const groupedWin: Record<string, GroupedSymbol> = {};
		
		this.gridTurnToWild(grid);
	    const payBySym = new Map(this.cfg.paytable.map(p => [p.symbol, p] as const));
	    const tempWild: { column: number; multiplier: number[] }[] = [];

		for (let li = 0; li < this.cfg.paylines.length; li++) {
      		const positions = this.cfg.paylines[li]; 

			const chain: { row: number; col: number; sym: SymbolId }[] = positions.map(pos => {
				const col = Math.floor(pos / rows), row = pos % rows;
				return { row, col, sym: grid[row][col] };
			});
			let target: SymbolId | null = null;
			for (const c of chain) {
				if (!this.isWild(c.sym) && !this.isScatter(c.sym)) { target = c.sym; break; }
			}
			if (!target)
			{
				const wildSym = this.cfg.wildId ?? "0";
				if (wildSym) {
					const entry = payBySym.get(wildSym);
					if (!entry) continue;
					let countW = 0;
          			const posList: [number, number][] = [];
					for (let i = 0; i < chain.length; i++) {
						if (this.isWild(chain[i].sym)) { countW++; posList.push([chain[i].row, chain[i].col]); }
						else break;
					}
					if (countW == 5)
					{
			            const base = entry.countsToPayout[countW] ?? 0;
			            let duelSum = 0;
						for (const [, col] of posList){ 
							if (!duelColumnMultipliers[col])
								continue;
							const duel = duelColumnMultipliers[col];
							duelSum += duel[0];
							const wild: { column: number; multiplier: number[] } = {
								column: col, multiplier: duelColumnMultipliers[col]
							}
							if (!tempWild.some(w => w.column === wild.column)) {
								tempWild.push(wild);
							}
						};
						const factor = duelSum > 0 ? duelSum : 1;
						const payout = (PayOutAmount * base) * factor;
            			if (!groupedWin[wildSym]) {
							groupedWin[wildSym] = {
								symbol: wildSym,
								totalPayout: 0,
								matches: []
							};
						}
						groupedWin[wildSym].totalPayout += payout;
						groupedWin[wildSym].matches.push({
							lineIndex: li + 1,
							count: countW,
							positions: posList,
							payout: payout,
							multiplier: factor
						});
					}
				}
				continue;
			}
			const entry = payBySym.get(target);
			if (!entry || entry.isScatter) continue;
	
			const posList: [number, number][] = [];
			let count = 0;
			for (let i = 0; i < chain.length; i++) {
				const c = chain[i];
				if (c.sym === target || this.isWild(c.sym)) { posList.push([c.row, c.col]); count++; }
				else break;
			}
			if (count < 3) continue;
			const base = entry.countsToPayout[count] ?? 0;
			if (base <= 0) continue;
			let duelSum = 0;
			for (const [, col] of posList) {
				if (!duelColumnMultipliers[col])
					continue;
				const duel = duelColumnMultipliers[col];
				duelSum += duel[0];
				const wild: { column: number; multiplier: number[] } = {
					column: col, multiplier: duelColumnMultipliers[col]
				}
				if (!tempWild.some(w => w.column === wild.column)) {
					tempWild.push(wild);
				}
			}
			const factor = duelSum > 0 ? duelSum : 1;
			const payout =  (PayOutAmount * base) * factor;
   			if (!groupedWin[target]) {
				groupedWin[target] = {
					symbol: target,
					totalPayout: 0,
					matches: []
				};
			}
			groupedWin[target].totalPayout += payout;
			groupedWin[target].matches.push({
				lineIndex: li + 1,
				count: count,
				positions: posList,
				payout: payout,
				multiplier: factor
			});
		}
		return {
			groupedWin: Object.values(groupedWin),
			payout: Object.values(groupedWin).reduce((sum, s) => sum + s.totalPayout, 0),
			wild: tempWild
		};
	}
}
