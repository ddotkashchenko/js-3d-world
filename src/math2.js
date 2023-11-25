export const Math2 = (function() {
  return {
      clamp: (x, a, b) => Math.min(Math.max(x, a), b),
      lerp: (x, a, b) => x * (b - a) + a
  };
})();