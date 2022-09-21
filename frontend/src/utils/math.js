export const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

export const fit = (value, sourceRangeMin, sourceRangeMax, targetRangeMin, targetRangeMax) => {
  var targetRange = targetRangeMax - targetRangeMin
  var sourceRange = sourceRangeMax - sourceRangeMin
  return (value - sourceRangeMin) * targetRange / sourceRange + targetRangeMin
}
