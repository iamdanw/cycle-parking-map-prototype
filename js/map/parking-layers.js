import { assignPrimaryPrkToGeoJSON, circleColorMatchExpression } from '../prk/category.js';
import {
  ZOOM_CIRCLE_SHOW,
  circleOpacityExpr,
  heatmapOpacityExpr,
  heatmapWeightExpr,
  heatmapColorLight
} from './parking-style.js';
import { applyMapTheme } from './theme.js';
import { initPrkFilterSidebar } from '../ui/filter-sidebar.js';
import { popupHtml, setupParkingPopupPhotos } from '../ui/parking-popup.js';
import { boundsFromGeoJSON } from '../geo/index.js';

var CLICK_QUERY_RADIUS_PX = 20;

export function addParkingDataAndInteractions(map, geojson, maplibregl) {
  assignPrimaryPrkToGeoJSON(geojson);
  var bounds = boundsFromGeoJSON(geojson);

  map.addSource('parking', {
    type: 'geojson',
    data: geojson
  });

  map.addLayer({
    id: 'parking-heat',
    type: 'heatmap',
    source: 'parking',
    paint: {
      'heatmap-weight': heatmapWeightExpr,
      'heatmap-intensity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        8,
        0.8,
        12,
        1.2,
        15,
        1.5
      ],
      'heatmap-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        8,
        12,
        12,
        18,
        15,
        28
      ],
      'heatmap-color': heatmapColorLight,
      'heatmap-opacity': heatmapOpacityExpr
    }
  });

  map.addLayer({
    id: 'user-geolocate-50m-outline',
    type: 'line',
    source: 'user-geolocate-50m',
    paint: {
      'line-color': '#0d47a1',
      'line-width': 2,
      'line-opacity': 0.65
    }
  });

  map.addLayer({
    id: 'parking-point',
    type: 'circle',
    source: 'parking',
    paint: {
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        ZOOM_CIRCLE_SHOW,
        5.5,
        14,
        7.5,
        16,
        9.5,
        18,
        11.5
      ],
      'circle-color': circleColorMatchExpression(),
      'circle-stroke-width': 1,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-opacity': circleOpacityExpr,
      'circle-opacity': circleOpacityExpr
    }
  });

  initPrkFilterSidebar(map);

  map.fitBounds(bounds, { padding: 48, maxZoom: 14 });

  function onMapParkingClick(e) {
    if (map.getZoom() <= ZOOM_CIRCLE_SHOW) return;
    var hits = map.queryRenderedFeatures(e.point, {
      layers: ['parking-point'],
      radius: CLICK_QUERY_RADIUS_PX
    });
    var f = hits[0];
    if (!f || !f.properties) return;
    var coords = f.geometry && f.geometry.type === 'Point' && f.geometry.coordinates
      ? f.geometry.coordinates
      : [e.lngLat.lng, e.lngLat.lat];
    var popup = new maplibregl.Popup({ maxWidth: '360px' })
      .setLngLat(e.lngLat)
      .setHTML(popupHtml(f.properties, coords))
      .addTo(map);
    var popupNode = popup.getElement();
    if (popupNode) setupParkingPopupPhotos(popupNode, f.properties);
  }

  map.on('click', onMapParkingClick);

  map.on('mouseenter', 'parking-point', function () {
    if (map.getZoom() > ZOOM_CIRCLE_SHOW) map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', 'parking-point', function () {
    map.getCanvas().style.cursor = '';
  });
  map.on('zoom', function () {
    if (map.getZoom() <= ZOOM_CIRCLE_SHOW) {
      map.getCanvas().style.cursor = '';
    }
  });

  applyMapTheme(map);
}
