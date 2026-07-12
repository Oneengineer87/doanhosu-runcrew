export const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);

export function heroMotion(progress, reduceMotion = false) {
  if (reduceMotion) return { imageScale: 1, lightOffsetY: 0, lightOpacity: 0.68 };
  const safe = clamp(progress);
  return {
    imageScale: 1 + safe * 0.03,
    lightOffsetY: safe * 18,
    lightOpacity: 0.52 + safe * 0.28,
  };
}

export function routeDraw(progress, reduceMotion = false) {
  if (reduceMotion) return { pathProgress: 1, labelVisible: true };
  const pathProgress = clamp(progress);
  return { pathProgress, labelVisible: pathProgress >= 0.55 };
}
