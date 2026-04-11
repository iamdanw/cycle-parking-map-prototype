/** Circles and capacity labels hidden until zoom is greater than this */
export const ZOOM_CIRCLE_SHOW = 13;

/** Opacity for circle layer: 0 at zoom <= ZOOM_CIRCLE_SHOW, ramps to 1 by ZOOM_CIRCLE_SHOW + 1 */
export const circleOpacityExpr = [
  'interpolate',
  ['linear'],
  ['zoom'],
  ZOOM_CIRCLE_SHOW,
  0,
  ZOOM_CIRCLE_SHOW + 1,
  1
];

/** Heatmap stays visible at all zooms; eases down slightly when zoomed in so points and labels stay readable */
export const heatmapOpacityExpr = [
  'interpolate',
  ['linear'],
  ['zoom'],
  8,
  0.88,
  11,
  0.78,
  14,
  0.58,
  17,
  0.45,
  19,
  0.4
];

/** Weight ~ capacity, normalized (typical CPT is small; cap contribution) */
export const heatmapWeightExpr = [
  'min',
  [
    'max',
    ['/', ['coalesce', ['to-number', ['get', 'PRK_CPT']], 1], 8],
    0.15
  ],
  4
];

export const heatmapColorLight = [
  'interpolate',
  ['linear'],
  ['heatmap-density'],
  0,
  'rgba(33, 102, 172, 0)',
  0.2,
  'rgb(103, 169, 207)',
  0.4,
  'rgb(209, 229, 240)',
  0.6,
  'rgb(253, 219, 199)',
  0.8,
  'rgb(239, 138, 98)',
  1,
  'rgb(178, 24, 43)'
];

export const heatmapColorDark = [
  'interpolate',
  ['linear'],
  ['heatmap-density'],
  0,
  'rgba(13, 71, 161, 0)',
  0.2,
  'rgb(66, 165, 245)',
  0.45,
  'rgb(129, 199, 132)',
  0.7,
  'rgb(255, 213, 79)',
  1,
  'rgb(255, 112, 67)'
];
