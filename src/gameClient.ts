import { Application } from "pixi.js";
import type { SymbolType } from "./types"; 
import { GameRenderer } from "./gameRenderer";
import { AssetLoader } from "./assetsLoader";
import { errorBox } from "./game.utils";
import { gameInfo } from "./GameUI";
import { GameConstants } from "./GameConstants";
type Callback = () => void;

export enum spinType {
	NORMAL,
	BONUS_BOOST,
	BONUS,
	BONUS_2
}

export class GameClient {
	private _symbols: SymbolType[] = [];
	private _reelCount: number = 5;
	private _timestamp: string = '';
	private _reelSet: Record<string, any> = {};
	private _stopIndex: number[] = [];
	private _defaultGrid: number[][] = [];
	private _selectionAmountIndex = GameConstants.SELECTION_AMOUNT_INDEX;
	private _app: Application;
	public gameRenderer: GameRenderer | null = null;
	public assetsLoader: AssetLoader | null = null;
	public gameInfo: gameInfo | null = null;

	private _isDemo: boolean = true;
	private _balance: number = 0;
	private _currentSpinType: spinType = spinType.NORMAL;
	private minAmountTominCurrency = GameConstants.MIN_AMOUNT_TO_MIN_CURRENCY;;
	private minCurrency = GameConstants.MIN_CURRENCY;
	private _CurrentAmount = GameConstants.getAmountFromIndex(this._selectionAmountIndex);
	private _CurrentRealAmount = (this._CurrentAmount / this.minAmountTominCurrency) * this.minCurrency;
	private waitingPayout: number = 0;
	private balanceChangeCallback?: Callback;
	private _turboLevel: number = 0;
	private _isAutoSpinRunning: boolean = false;
	private _isProcessingSpin: boolean = false;
	
	private ok: boolean = true;
	private serverok: boolean = false;
	private serverProcessing = false;

	constructor(app: Application) {
		this._app = app;
		if (this._isDemo)
		{
			this._balance = GameConstants.DEMO_BALANCE;
		}
	}

	public async autoSpinLoop() {
		while (this.gameRenderer?.gameInfo.isAutoSpinActive) {
			
			if (this.gameRenderer?.isBigWinPlaying) {
				await new Promise(resolve => setTimeout(resolve, 100));
				continue;
			}

			if (!this.gameRenderer.isSpinning && !this.isProcessingSpin) {
				const delay = this.isTurboMode 
					? GameConstants.AUTO_SPIN.DELAY_BETWEEN_SPINS_TURBO 
					: GameConstants.AUTO_SPIN.DELAY_BETWEEN_SPINS_NORMAL;
				await new Promise(resolve => setTimeout(resolve, delay));
				if (this.gameRenderer.gameInfo?.isAutoSpinActive) {
					await this.gameRenderer.InitSpin(this.isProcessingSpin, this.currentSpinType);
				}
			} else {
				await new Promise(resolve => setTimeout(resolve, 100));
			}
		}
	}

	private async fetchSymbols(): Promise<SymbolType[]> {
		try {
			const response = await fetch(GameConstants.API_URLS.SYMBOLS);
			if (!response.ok) return [];
			const data = await response.json();
			return data.symbols;
		} catch {
			return [];
		}
	}

	private async fetchGameInfo(): Promise<any> {
		try {
			const response = await fetch(`${GameConstants.API_URLS.BASE}/game-info`);
			if (!response.ok) {
				this.ok = false;
				return null;
			}
			const data = await response.json();
			if (!data || !data.reel_Set || !data.default_grid) {
				this.ok = false;
				return null;
			}
			this._reelSet = data.reel_Set;
			this._defaultGrid = data.default_grid;
			return data;
		} catch (error) {
			this.ok = false;
			return null;
		}
	}
	private async fetcProviderInfo(): Promise<any> {
		try {
			const response = await fetch(`${GameConstants.API_URLS.BASE}/provider`);
			if (!response.ok) {
				this.ok = false;
				return null;
			}
			const data = await response.json();
			if (data.currency)
				GameConstants.setCurrency(data.currency);
			if (data.home_url)
				GameConstants.setHome(data.home_url);
			return data;
		} catch (error) {
			this.ok = false;
			return null;
		}
	}

	public async initialize(): Promise<void> {
		await this.checkServer();
		if (!this.serverok)
		{	
			this.ok = false;
			return;
		}
		const gameInfo = await this.fetchGameInfo();
		if (!this.ok)
			return;
		const symbols = await this.fetchSymbols();

		if (!gameInfo || !symbols || symbols.length === 0) {
			this.ok = false;
			return;
		}
		const provider = await this.fetcProviderInfo();
		if (!provider)
		{
			this.ok = false;
			return;
		}
		this._symbols = symbols;
		this._reelCount = 5;
		this._timestamp = new Date().toISOString();
	}
	private BalanceChecker(SpinT: spinType, amount: number): boolean{
	if (!(this.balance >= amount)
		|| (SpinT == spinType.BONUS && !(this.balance >= amount * 100))
		|| (SpinT == spinType.BONUS_2 && !(this.balance >= amount * 200))
		|| (SpinT == spinType.BONUS_BOOST && !(this.balance >= amount * 2.5)))
		{	
			errorBox(this.app!, "Your balance is too low. Please add funds to play.", 1);
			return false;
		}
		return true;
	}

	public async checkServer()
	{
		if (this.serverProcessing)
			return;
		this.serverProcessing = true;
		const controller = new AbortController();
  		const timeoutId = setTimeout(() => controller.abort(), 5000); 
		try {
			await fetch(GameConstants.API_URLS.SERVERCHECK, {
				signal: controller.signal
			});
			this.serverok = true;
			this.serverProcessing = false;
		} catch (error: any) {
			if (error.name === "AbortError") {
			} else {
			}
			this.serverok = false;
			this.serverProcessing = false;
		} finally {
			clearTimeout(timeoutId);
		}
	}

	public async spin(amount: number, clientSeed: string, SpinT: spinType): Promise<any> {
		
		if (!amount || typeof amount !== 'number' || amount <= 0) {
			throw new Error('Invalid amount. Must be a positive number.');
		}
		if (this.gameInfo)
			this.gameInfo.removeWin();
		try {
			if (!this.BalanceChecker(SpinT, amount))
				return null;
			const response = await fetch(GameConstants.API_URLS.SPIN, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ amount, clientSeed, isDemo: this.isDemo, SpinT: SpinT })
			});
			if (!response.ok) {
				this.ok = false;
				return null;
			}
			const result = await response.json();
			if (!result.success) {
				this.ok = false;
				return null;
			}
			if (this.isDemo)
			{
				if (SpinT == spinType.BONUS)
					this.balance -= amount * 100;
				else if (SpinT == spinType.BONUS_2)
					this.balance -= amount * 200;
				else if (SpinT == spinType.BONUS_BOOST)
					this.balance -= amount * 2.5;
				else
					this.balance -= amount;
			}
			if (result.data.payout && result.data.payout > 0)
				this.waitingPayout = result.data.payout;
			return result;
		} catch (error) {
			this.ok = false;
			console.error("Spin failed:", error);
			return null;
		}
	}

	public get symbols(): SymbolType[] {
		return this._symbols;
	}

	public get reelCount(): number {
		return this._reelCount;
	}

	public get timestamp(): string {
		return this._timestamp;
	}

	public get stopIndex(): number[] {
		return this._stopIndex;
	}

	public get defaultGrid(): number[][] {
		return this._defaultGrid;
	}

	public get reelSet(): Record<string, any> {
		return this._reelSet;
	}
	
	public set app(value: Application) {
		this._app = value;
	}

	public get isProcessingSpin(): boolean {
		return this._isProcessingSpin;
	}
	
	public set isProcessingSpin(value: boolean) {
		this._isProcessingSpin = value;
	}

	public get app(): Application {
		return this._app;
	}
	public set onBalanceChange(cb: Callback) {
		this.balanceChangeCallback = cb;
	}
	private updateRealBet(): void
	{
		this._CurrentRealAmount = (this._CurrentAmount / this.minAmountTominCurrency) * this.minCurrency;
	}
	public UpBet() {
		if (GameConstants.SELECT_AMOUNT_LENGTH - 1 == this._selectionAmountIndex)
			return;
		this._selectionAmountIndex += 1;
		this._CurrentAmount = GameConstants.getAmountFromIndex(this._selectionAmountIndex);
		this.updateRealBet();
	}

	public DownBet() {
		if (this._selectionAmountIndex == 0)
			return;
		this._selectionAmountIndex -= 1;
		this._CurrentAmount = GameConstants.getAmountFromIndex(this._selectionAmountIndex);
		this.updateRealBet();
	}
	private set balance(value: number) {
		this._balance = value;
		
		if (this.balanceChangeCallback) 
			this.balanceChangeCallback();
	}
	public get reelbalance(): number {
		return (this._balance / this.minAmountTominCurrency) * this.minCurrency;
	}

	public get balance(): number {
		return this._balance;
	}

	public addBalance(amount: number) {
		this.balance += amount;
	}

	public get isDemo(): boolean {
		return (this._isDemo);
	}

	public gameDone(): void
	{
		if (this.waitingPayout > 0)
		{	
			this.balance += this.waitingPayout;
			this.waitingPayout = 0;
		}
	}

	public set InfoGame(info: gameInfo){
		this.gameInfo = info;
	}

	public get minCreditCurrency()
	{
		return this.minCurrency;
	}

	public get minAmountCredit()
	{
		return this.minAmountTominCurrency;
	}

	public get realAmount(): number {
		return this._CurrentRealAmount;
	}
	public get isTurboMode(): boolean {
		return this._turboLevel > 0;
	}

	public get turboLevel(): number {
		return this._turboLevel;
	}

	public get CurrentAmount(): number {
		return this._CurrentAmount;
	}

	public setTurboMode(enabled: boolean): void {
		this._turboLevel = enabled ? 2 : 0;
		if (this.gameRenderer) {
			this.gameRenderer.setTurboLevel(this._turboLevel);
		}
	}

	public setTurboLevel(level: number): void {
		this._turboLevel = Math.max(0, Math.min(2, level));
		if (this.gameRenderer) {
			this.gameRenderer.setTurboLevel(this._turboLevel);
		}
	}

	public cycleTurboLevel(): void {
		this._turboLevel = (this._turboLevel + 1) % 3; 
		if (this.gameRenderer) {
			this.gameRenderer.setTurboLevel(this._turboLevel);
		}
	}

	public get isAutoSpinRunning(): boolean {
		return this._isAutoSpinRunning;
	}

	public setAutoSpinRunning(running: boolean): void {
		this._isAutoSpinRunning = running;
	}
	public set currentSpinType(value: spinType) {
		this._currentSpinType = value;
	}

	public get currentSpinType(): spinType {
		return this._currentSpinType;
	}

	public get clientOk(): boolean {
		return (this.ok);
	}
	public set clientOk(value: boolean) {
		this.ok = value;
	}

	public get serverOk(): boolean {
		return (this.serverok);
	}
	public get serverProc(): boolean {
		return (this.serverProcessing);
	}
}
