export const PRK_LABELS = {
  PRK_CARR: 'On carriageway',
  PRK_COVER: 'Covered',
  PRK_SECURE: 'Secure',
  PRK_LOCKER: 'Locker',
  PRK_SHEFF: 'Sheffield stand',
  PRK_MSTAND: 'M-stand',
  PRK_PSTAND: 'P-stand',
  PRK_HOOP: 'Hoop',
  PRK_POST: 'Post',
  PRK_BUTERF: 'Butterfly',
  PRK_WHEEL: 'Wheel rack',
  PRK_HANGAR: 'Hangar',
  PRK_TIER: 'Tiered',
  PRK_OTHER: 'Other'
};

/** Facility keys used for circle colour (same order as PRK_LABELS, excluding PRK_CARR) */
export const PRK_CATEGORY_ORDER = Object.keys(PRK_LABELS).filter(function (k) {
  return k !== 'PRK_CARR';
});

export const PRK_CATEGORY_COLORS = {
  PRK_COVER: '#1565c0',
  PRK_SECURE: '#2e7d32',
  PRK_LOCKER: '#f9a825',
  PRK_SHEFF: '#6a1b9a',
  PRK_MSTAND: '#ef6c00',
  PRK_PSTAND: '#00838f',
  PRK_HOOP: '#ad1457',
  PRK_POST: '#558b2f',
  PRK_BUTERF: '#00897b',
  PRK_WHEEL: '#4527a0',
  PRK_HANGAR: '#c62828',
  PRK_TIER: '#5d4037',
  PRK_OTHER: '#616161',
  NONE: '#90a4ae'
};
