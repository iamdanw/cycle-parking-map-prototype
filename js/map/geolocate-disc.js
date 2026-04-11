import { geodesicCircleFeature, offsetNorthByMetres } from '../geo/index.js';

export const GEOLOCATE_DISC_METRES = 400;

var geolocateLabelMarker = null;

export function setupGeolocateSourceAndHandler(map, geolocateControl, maplibregl) {
  map.addSource('user-geolocate-50m', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] }
  });

  geolocateControl.on('geolocate', function (ev) {
    var coords = ev && ev.coords ? ev.coords : ev && ev.data && ev.data.coords ? ev.data.coords : null;
    if (!coords || typeof coords.longitude !== 'number' || typeof coords.latitude !== 'number') return;
    var lng = coords.longitude;
    var lat = coords.latitude;
    var src = map.getSource('user-geolocate-50m');
    if (!src || typeof src.setData !== 'function') return;
    src.setData({
      type: 'FeatureCollection',
      features: [geodesicCircleFeature(lng, lat, GEOLOCATE_DISC_METRES, 64)]
    });
    if (geolocateLabelMarker) {
      geolocateLabelMarker.remove();
      geolocateLabelMarker = null;
    }
    var labelEl = document.createElement('div');
    labelEl.className = 'geolocate-disc-label';
    labelEl.textContent = '🚲 1 min / 🚶 5 min';
    labelEl.setAttribute('aria-hidden', 'true');
    var labelLngLat = offsetNorthByMetres(lng, lat, GEOLOCATE_DISC_METRES);
    geolocateLabelMarker = new maplibregl.Marker({ element: labelEl, anchor: 'center' })
      .setLngLat(labelLngLat)
      .addTo(map);
  });
}
