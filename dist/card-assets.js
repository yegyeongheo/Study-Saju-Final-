// Register the final, user-supplied artwork here. No images are generated at runtime.
// Flat filenames work in both the Site worker and the app's static directory.
// Example entry after uploading: 'wood-rat-female': 'card-day-wood-rat-female.webp'
export const DAY_ANIMAL_IMAGES = Object.freeze({});

// Optional report typeId + learner gender, e.g. '<typeId>-female': '<filename>.webp'.
// Type IDs must come from the agreed interpretation layer, not a new classification here.
export const STUDY_TYPE_IMAGES = Object.freeze({
  'explorer-female':'card-study-explorer-female.webp',
  'analyst-female':'card-study-analyst-female.webp',
  'executor-female':'card-study-executor-female.webp',
  'immerser-female':'card-study-immerser-female.webp',
  'expressor-female':'card-study-expressor-female.webp',
  'strategist-female':'card-study-strategist-female.webp',
  'balancer-female':'card-study-balancer-female.webp',
  'resonator-female':'card-study-resonator-female.webp',
  'explorer-male':'card-study-explorer-male.webp',
  'analyst-male':'card-study-analyst-male.webp',
  'executor-male':'card-study-executor-male.webp',
  'immerser-male':'card-study-immerser-male.webp',
  'expressor-male':'card-study-expressor-male.webp',
  'strategist-male':'card-study-strategist-male.webp',
  'balancer-male':'card-study-balancer-male.webp',
  'resonator-male':'card-study-resonator-male.webp',
});
