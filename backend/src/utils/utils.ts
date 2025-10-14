import { DUEL_MULTIPLIERS, DUEL_WEIGHTS, DUEL_WEIGHT_SUM,
  DUEL_MULTIPLIERS_BONUS, DUEL_WEIGHTS_BONUS, DUEL_WEIGHT_SUM_BONUS
 } from "../models/symbolsConst";
import { Rng } from "../rng/rgn";

export function pickDuelMultiplier(rng: Rng): number {
  const roll = rng.nextInt(DUEL_WEIGHT_SUM);
  let cursor = roll;
  for (let i = 0; i < DUEL_MULTIPLIERS.length; i++) {
    if (cursor < DUEL_WEIGHTS[i]) return DUEL_MULTIPLIERS[i];
    cursor -= DUEL_WEIGHTS[i];
  }
  return DUEL_MULTIPLIERS[DUEL_MULTIPLIERS.length-1];
}

export function pickFakeMultiplier(rng: Rng, winner: number): number {
  const filteredMultipliers: number[] = [];
  const filteredWeights: number[] = [];
  
  for (let i = 0; i < DUEL_MULTIPLIERS.length; i++) {
    if (DUEL_MULTIPLIERS[i] !== winner) {
      filteredMultipliers.push(DUEL_MULTIPLIERS[i]);
      filteredWeights.push(DUEL_WEIGHTS[i]);
    }
  }
  const totalWeight = filteredWeights.reduce((a, b) => a + b, 0);
  let cursor = rng.nextInt(totalWeight);
  for (let i = 0; i < filteredMultipliers.length; i++) {
    if (cursor < filteredWeights[i]) return filteredMultipliers[i];
    cursor -= filteredWeights[i];
  }
  return filteredMultipliers[filteredMultipliers.length - 1];
}

export function pickDuelMultiplierB(rng: Rng): number {
  const roll = rng.nextInt(DUEL_WEIGHT_SUM_BONUS);
  let cursor = roll;
  for (let i = 0; i < DUEL_MULTIPLIERS_BONUS.length; i++) {
    if (cursor < DUEL_WEIGHTS_BONUS[i]) return DUEL_MULTIPLIERS_BONUS[i];
    cursor -= DUEL_WEIGHTS_BONUS[i];
  }
  return DUEL_MULTIPLIERS_BONUS[DUEL_MULTIPLIERS_BONUS.length-1];
}

export function pickFakeMultiplierB(rng: Rng, winner: number): number {
  const filteredMultipliers: number[] = [];
  const filteredWeights: number[] = [];
  
  for (let i = 0; i < DUEL_MULTIPLIERS_BONUS.length; i++) {
    if (DUEL_MULTIPLIERS_BONUS[i] !== winner) {
      filteredMultipliers.push(DUEL_MULTIPLIERS_BONUS[i]);
      filteredWeights.push(DUEL_WEIGHTS_BONUS[i]);
    }
  }
  const totalWeight = filteredWeights.reduce((a, b) => a + b, 0);
  let cursor = rng.nextInt(totalWeight);
  for (let i = 0; i < filteredMultipliers.length; i++) {
    if (cursor < filteredWeights[i]) return filteredMultipliers[i];
    cursor -= filteredWeights[i];
  }
  return filteredMultipliers[filteredMultipliers.length - 1];
}
