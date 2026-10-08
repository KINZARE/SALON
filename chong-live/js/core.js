export const animationNames = ['Idle', 'Walking', 'Dance', 'Jump', 'Wave'];

export function wrapIndex(index, length) {
  if (!Number.isFinite(index) || !Number.isFinite(length) || length <= 0) return 0;
  return ((Math.trunc(index) % length) + length) % length;
}

export function getAnimationName(index) {
  return animationNames[wrapIndex(index, animationNames.length)];
}

export function shouldAnimate(reducedMotion, userInitiated = false) {
  return !reducedMotion || userInitiated;
}

export function bobbingY(baseY, phase, amplitude = 0.035) {
  return baseY + Math.sin(phase) * amplitude;
}
