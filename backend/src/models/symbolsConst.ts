export const DUEL_MULTIPLIERS = [2, 3, 4, 5, 6, 7, 8, 10, 15, 20, 25, 50, 100, 200];
export const DUEL_WEIGHTS_F = [1250, 575, 300, 150, 100, 55, 23, 17, 12, 7, 5,  3, 2, 1];
export const WEIGHT_SCALE = 2500;
export const DUEL_WEIGHTS = DUEL_WEIGHTS_F.map(w => Math.round(w * WEIGHT_SCALE));
export const DUEL_WEIGHT_SUM = DUEL_WEIGHTS.reduce((a,b)=>a+b,0);

export const DUEL_MULTIPLIERS_BONUS = [2, 3, 4, 5, 6, 7, 8, 10, 15, 20, 25, 50, 100, 200];
export const DUEL_WEIGHTS_F_BONUS = [1240, 571, 298, 149, 99, 55, 25, 23, 16, 9, 7,  4, 3, 1];
export const WEIGHT_SCALE_BONUS = 2500;
export const DUEL_WEIGHTS_BONUS = DUEL_WEIGHTS_F_BONUS.map(w => Math.round(w * WEIGHT_SCALE_BONUS));
export const DUEL_WEIGHT_SUM_BONUS = DUEL_WEIGHTS_BONUS.reduce((a,b)=>a+b,0);