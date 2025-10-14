import express, { Request, Response, NextFunction, Router} from 'express';
import cors from 'cors';
import { SYMBOLS, FiveByFiveModel } from './models/FiveByFiveModels';
import { LairOfRiches } from './engine';
import { SpinRequest } from './types/data.types';
import { spinType } from './types/types';

const app = express();
const PORT = 3001;
const engine = new LairOfRiches(FiveByFiveModel);
const router = express.Router();


app.use(cors());
app.use(express.json());
app.options('*', cors());

router.get('/ping', (req: Request, res: Response) => {
	res.json({ 
		status: 'OK', 
		message: 'Slot Game API is running',
		timestamp: new Date().toISOString()
	});
});

router.get('/api/symbols', (req: Request, res: Response) => {
	  res.json({
	symbols: SYMBOLS,
	reelCount: 5,
	timestamp: new Date().toISOString()
  });
});

function spinReq(req: SpinRequest)
{
	try {
		const round = engine.spin(req);
		return {
			success: true,
			data: {
				win: round.win,
				details: round.details,
				wildPositions: round.wildPositions,
				payout: round.payout,
				stopIndices: round.stopIndex,
				bonusRounds: round.bonusRounds,
				scatterCounts: round.scatterCounts,
				isDemo: true
			},
			timestamp: new Date().toISOString()
		}
	}
	catch(e){
		console.log(e);
		return {
			success: false,
			data: {},
			timestamp: new Date().toISOString()
		};
	}
}

router.post('/api/spin', async (req: Request, res: Response) => {
  try {
	const { amount, isDemo, SpinT } = req.body as {amount: number, isDemo: boolean, SpinT: spinType};
	if (!amount || typeof amount !== 'number' || amount <= 0 || !isDemo || SpinT == undefined) {
	  return res.status(400).json({
		error: 'Invalid amount. Must be a positive number.',
		code: 'INVALID_AMOUNT'
	  });
	}
	let result: {success: boolean, round: any};

	const request: SpinRequest = {
		bet: amount,
		spinType: SpinT,
		roundId: "12345",
		reelSetId: SpinT == spinType.BONUS_BOOST ? "default_boost" : undefined
	}

	const response = spinReq(request);
	res.json(response);
	
  } catch (error) {
	console.error('Spin error:', error);
	res.status(500).json({
	  error: 'Internal server error during spin',
	  code: 'SPIN_ERROR',
	  message: error instanceof Error ? error.message : 'Unknown error'
	});
  }
});


router.get('/api/game-info', (req: Request, res: Response) => {
	const modelReelSets = FiveByFiveModel.reelSets;
	const reelSetsArray = Object.keys(modelReelSets).map(name => {
		const rs = modelReelSets[name];
		return {
			name,
			reels: rs.reels.map((r, idx) => ({ index: String(idx), symbols: r.symbols }))
		};
	});
	const default_grid: string[][] = [
		["8", "4", "5", "4", "0"],
		["3", "1", "8", "1", "5"],
		["2", "10", "5", "3", "5"],
		["6", "7", "10", "5", "8"],
		["5", "0", "10", "2", "2"],
	];
	res.json({
		name: 'Lair of Riches Slot',
		version: '1.0.0',
		gridSize: '5x5',
		maxPayout: '10000x',
		features: [
		  'Wild Multipliers',
		  'Scatter Bonuses', 
		  'Provably Fair RNG',
		  'Multiple Paylines'
		],
		timestamp: new Date().toISOString(),
		reel_Set: { reelSets: reelSetsArray },
		default_grid
	});
});


router.get('/api/provider', (req: Request, res: Response) => {
  res.json({
	currency: '$',
	language: "eng",
	home_url: "http://localhost:5173/",
  });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
	error: 'Internal server error',
	code: 'UNHANDLED_ERROR'
  });
});

app.use(`/demo`, router);


if (!process.env.AWS_LAMBDA_FUNCTION_NAME && process.env.NODE_ENV !== 'test') {
	app.listen(PORT, () => {
		console.log(`(Local) Slot Game API Server running on port ${PORT}`);
		console.log(`Base path mounted at /demo`);
		console.log(`Ping:            GET  http://localhost:${PORT}/demo/ping`);
		console.log(`Spin:            POST http://localhost:${PORT}/demo/api/spin`);
		console.log(`Game info:       GET  http://localhost:${PORT}/demo/api/game-info`);
		console.log(`Symbols info:    GET  http://localhost:${PORT}/demo/api/symbols`);
	});
}

export default app;


