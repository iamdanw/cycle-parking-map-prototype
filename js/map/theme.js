import { heatmapColorDark, heatmapColorLight } from './parking-style.js';

export function isDarkScheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function applyBasemapTheme(map) {
  if (!map || !map.isStyleLoaded()) return;
  var src = map.getSource('osm');
  if (!src || typeof src.setSourceProperty !== 'function') return;
  var dark = isDarkScheme();
  src.setSourceProperty(function () {
    src._options.tiles = dark
      ? ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png']
      : ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'];
    src._options.attribution = dark
      ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
  });
}

export function applyMapTheme(map) {
  applyBasemapTheme(map);
  if (map.getLayer && map.getLayer('parking-heat')) {
    map.setPaintProperty(
      'parking-heat',
      'heatmap-color',
      isDarkScheme() ? heatmapColorDark : heatmapColorLight
    );
  }
}
