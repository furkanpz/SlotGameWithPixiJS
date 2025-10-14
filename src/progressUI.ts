import type { Sprite } from "pixi.js";

export function updateLoadingProgress(
  progress: number,
  progressFill: Sprite,
  maxWidth: number,
) {
  if (!progressFill) return;
  const clamped = Math.max(0, Math.min(100, progress));
  const targetWidth = (maxWidth * clamped) / 100;
  const current = Math.round(progressFill.width);
  const next = Math.round(targetWidth);
  if (current !== next) {
    progressFill.width = targetWidth;
  }
}
