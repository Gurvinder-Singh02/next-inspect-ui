const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;
const SALT = "rb26";

const hashTestId = (testId: string): string => {
  const salted = `${SALT}:${testId}`;
  let hash = FNV_OFFSET_BASIS;
  for (let charIndex = 0; charIndex < salted.length; charIndex++) {
    hash ^= salted.charCodeAt(charIndex);
    hash = Math.imul(hash, FNV_PRIME) >>> 0;
  }
  return `b-${hash.toString(36)}`;
};

export { hashTestId };
