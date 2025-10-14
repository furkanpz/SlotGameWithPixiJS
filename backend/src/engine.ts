
import { MathEngine } from "./mathEngine";
import { FiveByFiveModel } from "./models/FiveByFiveModels";
import { ReelStrip, ReelSet, SpinRequest, BonusSpinResult, spinResult } from "./types/data.types";
import { Rng, SeededRng, SystemRng } from "./rng/rgn";
import { pickDuelMultiplier, pickFakeMultiplier, pickFakeMultiplierB, pickDuelMultiplierB } from "./utils/utils";
import { spinType, SymbolId } from "./types/types";

export class LairOfRiches {
	private math = new MathEngine(FiveByFiveModel);
	
	constructor(private cfg = FiveByFiveModel) {}

	private chooseStopIndex(rng: Rng, strip: ReelStrip): number {
		const n = strip.symbols.length;
		return rng.nextInt(n);
	}

	private buildGridFromStops(rs: ReelSet, stops: number[]): SymbolId[][] {
		const grid: SymbolId[][] = [];
		const rows = rs.rowsVisible;
		const reelCount = rs.reels.length;
		for (let col = 0; col < reelCount; col++) {
			const reel: SymbolId[] = rs.reels[col].symbols;
			const reelLength = reel.length;
			const stopIndex = stops[col];
			for (let row = 0; row < rows; row++) {
				const index = (stopIndex + row) % reelLength;
				if (!grid[row]) grid[row] = [];
				grid[row][col] = reel[index];
			}
		}
		return grid;
	}
	private findSymbolIndicesInStrip(strip: ReelStrip, sym: SymbolId): number[] {
		const res: number[] = [];
		for (let i = 0; i < strip.symbols.length; i++) if (strip.symbols[i] === sym) res.push(i);
		return res;
	}
	private scatterCounter(grid: SymbolId[][]): number
	{
		const scatSym = this.cfg.paytable.find(p => p.isScatter)?.symbol ?? "1";
		let scatCount = 0;
		for (const col of grid) for (const s of col) if (s === scatSym) scatCount++;
		return (scatCount);
	}

	private stopForOccurrenceAtRow(occIndex: number, row: number, stripLen: number): number {
		let top = occIndex - row;
		top %= stripLen;
		if (top < 0) top += stripLen;
		return top;
	}
	private expandingWild(grid: SymbolId[][]): number[] {
		
		const expandingId = this.cfg.expandingId ?? "8";
		const expandingCols: number[] = [];
		if (grid.length === 0) return expandingCols;
		const cols = grid[0].length;
		for (let col = 0; col < cols; col++) {
			for (let row = 0; row < grid.length; row++) {
				if (grid[row][col] === expandingId) { expandingCols.push(col); break; }
			}
		}
		return expandingCols;
	}
	private maxWingLimiter(req: SpinRequest, total: number)
	{
		let totalWin = total;
		if (this.cfg.maxWinCapMultiplier) {
			const limit = this.cfg.maxWinCapMultiplier * req.bet;
			if (totalWin > limit) totalWin = limit;
		}
		return (totalWin);
	}

	private checkWildForNormal(grid: string[][], rng: Rng)  {
		let wildCol: number[] = []; 
		let wildMultiplier: Record<number, number[]> = {};
		for (let y = 0; y < 5; y++)
		{
			for (let x = 0; x < 5; x++)
			{
				if (grid[y][x] == '8')
					wildCol.push(x);
			}
		}
		for (let x = 0; x < wildCol.length; x++)
		{
			const getMultiplier = pickDuelMultiplier(rng);
			const fakeMultiplier = pickFakeMultiplier(rng, getMultiplier);
			wildMultiplier[wildCol[x]] = [getMultiplier, fakeMultiplier];
		}
		return (wildMultiplier);
	}

	private checkWildForBonus(grid: string[][], rng: Rng)  {
		let wildCol: number[] = []; 
		let wildMultiplier: Record<number, number[]> = {};
		for (let y = 0; y < 5; y++)
		{
			for (let x = 0; x < 5; x++)
			{
				if (grid[y][x] == '8')
					wildCol.push(x);
			}
		}
		for (let x = 0; x < wildCol.length; x++)
		{
			const getMultiplier = pickDuelMultiplierB(rng);
			const fakeMultiplier = pickFakeMultiplierB(rng, getMultiplier);
			wildMultiplier[wildCol[x]] = [getMultiplier, fakeMultiplier];
		}
		return (wildMultiplier);
	}
	
	private ifNeedGuaranteeWild(
		grid: SymbolId[][], rng: Rng, rs: ReelSet,
		stops: number[],
	) {
		const expandingId = this.cfg.expandingId ?? "8";
		const expandingColsInitially: number[] = this.expandingWild(grid);
		if (expandingColsInitially.length === 0) {
			const pickCol = rng.nextInt(rs.reels.length);
			const strip = rs.reels[pickCol];
			const occurrences = this.findSymbolIndicesInStrip(strip, expandingId);
			if (occurrences.length > 0) {
				const occIndex = occurrences[rng.nextInt(occurrences.length)];
				const desiredRow = rng.nextInt(rs.rowsVisible);
				stops[pickCol] = this.stopForOccurrenceAtRow(occIndex, desiredRow, strip.symbols.length);
				grid = this.buildGridFromStops(rs, stops);
			} else {
				let found = false;
				for (let col = 0; col < rs.reels.length && !found; col++) {
					const occ = this.findSymbolIndicesInStrip(rs.reels[col], expandingId);
					if (occ.length > 0) {
						const chosenOcc = occ[rng.nextInt(occ.length)];
						const desiredRow = rng.nextInt(rs.rowsVisible);
						stops[col] = this.stopForOccurrenceAtRow(chosenOcc, desiredRow, rs.reels[col].symbols.length);
						grid = this.buildGridFromStops(rs, stops);
						found = true;
					}
				}
			}
		}
		return (grid);
	}

	public guaranteeNWildColumns(
		grid: SymbolId[][],
		needCount: number,
		rng: Rng,
		rs: ReelSet,
		stops: number[],
	) {
		if (needCount <= 0) return { grid, guaranteedColumns: [] };
		const expandingId = this.cfg.expandingId ?? "8";
		const currentCols = new Set<number>();
		for (let col = 0; col < rs.reels.length; col++) {
			for (let row = 0; row < rs.rowsVisible; row++) {
				if (grid[row][col] === expandingId) { currentCols.add(col); break; }
			}
		}
		if (currentCols.size >= needCount) {
			return grid ;
		}
		const allCols = Array.from({ length: rs.reels.length }, (_, i) => i);
		const remaining = allCols.filter(c => !currentCols.has(c));
		for (let i = remaining.length - 1; i > 0; i--) {
			const j = rng.nextInt(i + 1);
			[remaining[i], remaining[j]] = [remaining[j], remaining[i]];
		}
		for (const col of remaining) {
			if (currentCols.size >= needCount) break;
			const strip = rs.reels[col];
			const occ = this.findSymbolIndicesInStrip(strip, expandingId);
			if (occ.length === 0) continue;
			const chosenOcc = occ[rng.nextInt(occ.length)];
			const desiredRow = rng.nextInt(rs.rowsVisible);
			stops[col] = this.stopForOccurrenceAtRow(chosenOcc, desiredRow, strip.symbols.length);
			grid = this.buildGridFromStops(rs, stops);
			currentCols.add(col);
		}
		return grid;
	}
	private buyBonus(
		rng: Rng,
		rs: ReelSet,
		spinT: spinType,
		stops: number[]
	) {
		const scatterId = this.cfg.scatterId ?? "1";
		const requiredScatter =
			spinT === spinType.BONUS ? 3 :
			spinT === spinType.BONUS_2 ? 4 : 0;
		if (requiredScatter === 0) {
			for (let col = 0; col < rs.reels.length; col++) {
				stops[col] = this.chooseStopIndex(rng, rs.reels[col]);
			}
			return this.buildGridFromStops(rs, stops);
		}

		const reelCount = rs.reels.length;
		const cols = Array.from({ length: reelCount }, (_, i) => i);
		for (let i = cols.length - 1; i > 0; i--) {
			const j = rng.nextInt(i + 1);
			[cols[i], cols[j]] = [cols[j], cols[i]];
		}
		const scatterCols = cols.slice(0, requiredScatter);

		const windowScatterCount = (symbols: SymbolId[], top: number): number => {
			let c = 0;
			const len = symbols.length;
			for (let r = 0; r < rs.rowsVisible; r++) {
				if (symbols[(top + r) % len] === scatterId) c++;
			}
			return c;
		};

		for (const col of scatterCols) {
			const strip = rs.reels[col];
			const symbols = strip.symbols;
			const scatterPositions = this.findSymbolIndicesInStrip(strip, scatterId);
			if (scatterPositions.length === 0) {
				stops[col] = this.chooseStopIndex(rng, strip);
				continue;
			}
			const candidateStops: number[] = [];
			for (const occ of scatterPositions) {
				for (let desiredRow = 0; desiredRow < rs.rowsVisible; desiredRow++) {
					const top = this.stopForOccurrenceAtRow(occ, desiredRow, symbols.length);
					if (windowScatterCount(symbols, top) === 1) candidateStops.push(top);
				}
			}
			if (candidateStops.length > 0) {
				stops[col] = candidateStops[rng.nextInt(candidateStops.length)];
			} else {
				const occ = scatterPositions[rng.nextInt(scatterPositions.length)];
				const desiredRow = rng.nextInt(rs.rowsVisible);
				stops[col] = this.stopForOccurrenceAtRow(occ, desiredRow, symbols.length);
			}
		}

		for (let col = 0; col < reelCount; col++) {
			if (scatterCols.includes(col)) continue;
			const strip = rs.reels[col];
			const symbols = strip.symbols;
			const zeroStops: number[] = [];
			for (let top = 0; top < symbols.length; top++) {
				if (windowScatterCount(symbols, top) === 0) zeroStops.push(top);
			}
			if (zeroStops.length > 0) {
				stops[col] = zeroStops[rng.nextInt(zeroStops.length)];
			} else {
				let bestTop = 0; let bestCount = Number.MAX_SAFE_INTEGER;
				for (let top = 0; top < symbols.length; top++) {
					const c = windowScatterCount(symbols, top);
					if (c < bestCount) { bestCount = c; bestTop = top; if (c === 0) break; }
				}
				stops[col] = bestTop;
			}
		}

		let grid = this.buildGridFromStops(rs, stops);
		const actualScatter = this.scatterCounter(grid);
		if (actualScatter !== requiredScatter) {
			
		}
		return grid;
	}
	private bonusSpin(req: SpinRequest): BonusSpinResult
	{
		const rng: Rng = req.qaSeed ? new SeededRng(req.qaSeed) : new SystemRng();
	    let reelSetId = req.reelSetId || this.cfg.baseReelSetId;
		const rs = this.cfg.reelSets[reelSetId];
    	let stops = rs.reels.map(strip => this.chooseStopIndex(rng, strip));
		let grid = this.buildGridFromStops(rs, stops);
		if (req.spinType == spinType.BONUS_2)
			grid = this.ifNeedGuaranteeWild(grid, rng, rs, stops);
		const expandingWolf = this.checkWildForBonus(grid, rng);
		const {groupedWin, payout, wild} = this.math.evaluateLines(grid, expandingWolf, req.bet);
		return {
			_win: payout > 0,
			_details: groupedWin,
			_amount: req.bet,
			_payout: payout,
			_stopIndex: stops,
			_wildPositions: wild
		}
	}
	spin(req: SpinRequest): spinResult {
		if (req.bet < this.cfg.minBet || req.bet > this.cfg.maxBet) throw new Error("Bet out of range"); 
		const rng: Rng = req.qaSeed ? new SeededRng(req.qaSeed) : new SystemRng();
	    let reelSetId = req.reelSetId || this.cfg.baseReelSetId;

		const rs = this.cfg.reelSets[reelSetId];
    	let stops = rs.reels.map(strip => this.chooseStopIndex(rng, strip));
		let grid = undefined;
		if (req.spinType == spinType.BONUS || req.spinType == spinType.BONUS_2)
			grid = this.buyBonus(rng, rs, req.spinType, stops);
		else
			grid = this.buildGridFromStops(rs, stops);
		
		
		
		
		
		
		const expandingWolf = this.checkWildForNormal(grid, rng);
		const {groupedWin, payout, wild} = this.math.evaluateLines(grid, expandingWolf, req.bet);

		const scatterCount = this.scatterCounter(grid);
		const bonusRounds: BonusSpinResult[] = [];
		let totalPayout = payout;
		if (scatterCount >= 3)
		{
			const fsDef = (scatterCount >= 4) ? this.cfg.features.find(f => f.trigger.min === 4) : this.cfg.features.find(f => f.trigger.min === 3);
			const spins = fsDef?.payload?.spins ?? 10;
			const guarantee = scatterCount >= 4;
			const bonusreq: SpinRequest = {
				bet: req.bet,
				spinType: guarantee ? spinType.BONUS_2 : spinType.BONUS,
				roundId: req.roundId,
				reelSetId: "bonus",
			};
			for (let spin = 0; spin < spins; spin++) {
				const bRound = this.bonusSpin(bonusreq);
				totalPayout += bRound._payout;
				bonusRounds.push(bRound);
				if (this.cfg.maxWinCapMultiplier)
				{
					const limit = this.cfg.maxWinCapMultiplier * req.bet;
					if (totalPayout > limit) break;
				}
			}
		}
		totalPayout = this.maxWingLimiter(req, totalPayout);
		const round: spinResult = {
			win: payout > 0,
			details: groupedWin,
			amount: req.bet,
			payout: totalPayout,
			scatterCounts: scatterCount,
			wildPositions: wild,
			stopIndex: stops,
			bonusRounds: bonusRounds
		}
		return round;
	}
}
