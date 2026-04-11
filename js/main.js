import { applyBasemapTheme, applyMapTheme } from './map/theme.js';
import { initSidebarLayout } from './ui/sidebar-layout.js';
import { PlaceSearchControl } from './controls/place-search.js';
import { setupGeolocateSourceAndHandler } from './map/geolocate-disc.js';
import { addParkingDataAndInteractions } from './map/parking-layers.js';

var maplibregl = window.maplibregl;
if (!maplibregl) {
  throw new Error('maplibregl is not defined; load MapLibre before the app module.');
}

var map = new maplibregl.Map({
  container: 'map',
  attributionControl: true,
  style: {
    version: 8,
    sources: {
      osm: {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }
    },
    layers: [
      {
        id: 'osm',
        type: 'raster',
        source: 'osm',
        minzoom: 0,
        maxzoom: 19
      }
    ]
  },
  center: [-0.12, 51.5],
  zoom: 10
});

initSidebarLayout(map);

map.addControl(new PlaceSearchControl(), 'top-left');
map.addControl(new maplibregl.NavigationControl(), 'top-right');
var geolocateControl = new maplibregl.GeolocateControl({
  positionOptions: { enableHighAccuracy: true },
  fitBoundsOptions: { maxZoom: 14 },
  trackUserLocation: false
});
map.addControl(geolocateControl, 'top-right');

map.on('load', function () {
  applyBasemapTheme(map);
  var colorSchemeMq = window.matchMedia('(prefers-color-scheme: dark)');
  colorSchemeMq.addEventListener('change', function () {
    applyMapTheme(map);
  });

  setupGeolocateSourceAndHandler(map, geolocateControl, maplibregl);

  fetch('data/cycle_parking.json')
    .then(function (r) {
      if (!r.ok) throw new Error('Failed to load data: ' + r.status);
      return r.json();
    })
    .then(function (geojson) {
      addParkingDataAndInteractions(map, geojson, maplibregl);
    })
    .catch(function (err) {
      console.error(err);
      var el = document.createElement('div');
      el.className = 'load-error-overlay';
      el.innerHTML = '<p>Could not load <code>data/cycle_parking.json</code>. Serve this folder over HTTP (e.g. <code>python3 -m http.server</code>) and open the site from <code>http://localhost:…</code>.</p>';
      document.body.appendChild(el);
    });
});
