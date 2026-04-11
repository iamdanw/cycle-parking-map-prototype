import { PRK_LABELS } from '../prk/constants.js';

function activeFacilityLabels(props) {
  var out = [];
  for (var k in PRK_LABELS) {
    if (Object.prototype.hasOwnProperty.call(PRK_LABELS, k) && props[k] === 'TRUE') {
      out.push(PRK_LABELS[k]);
    }
  }
  return out.length ? out.join(', ') : '—';
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function clonePropsForJson(props) {
  var o = {};
  for (var k in props) {
    if (!Object.prototype.hasOwnProperty.call(props, k)) continue;
    if (k === 'PRIMARY_PRK') continue;
    o[k] = props[k];
  }
  return o;
}

function pointFeatureGeoJson(props, coordinates) {
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [coordinates[0], coordinates[1]]
    },
    properties: clonePropsForJson(props)
  };
}

export function popupHtml(props, coordinates) {
  var id = escapeHtml(props.FEATURE_ID);
  var borough = escapeHtml(props.BOROUGH);
  var cpt = escapeHtml(props.PRK_CPT);
  var sv = escapeHtml(props.SVDATE);
  var types = escapeHtml(activeFacilityLabels(props));
  var p1 = props.PHOTO1_URL;
  var p2 = props.PHOTO2_URL;
  var photos = '';
  if (p1 || p2) {
    photos = '<div class="photos">';
    if (p1) {
      photos +=
        '<details class="popup-photo">' +
        '<summary>Photo 1</summary>' +
        '<img src="' + escapeHtml(p1) + '" alt="Cycle parking photo 1" />' +
        '</details>';
    }
    if (p2) {
      photos +=
        '<details class="popup-photo">' +
        '<summary>Photo 2</summary>' +
        '<img src="' + escapeHtml(p2) + '" alt="Cycle parking photo 2" />' +
        '</details>';
    }
    photos += '</div>';
  }
  var jsonSection = '';
  if (coordinates && coordinates.length >= 2) {
    var feat = pointFeatureGeoJson(props, coordinates);
    jsonSection =
      '<details class="popup-json">' +
      '<summary>GeoJSON for this point</summary>' +
      '<pre>' + escapeHtml(JSON.stringify(feat, null, 2)) + '</pre>' +
      '</details>';
  }
  return (
    '<h3>' + id + '</h3>' +
    '<dl>' +
    '<dt>Borough</dt><dd>' + borough + '</dd>' +
    '<dt>Capacity</dt><dd>' + cpt + '</dd>' +
    '<dt>Survey date</dt><dd>' + sv + '</dd>' +
    '<dt>Types</dt><dd>' + types + '</dd>' +
    '</dl>' +
    photos +
    jsonSection
  );
}

/** Preload photo URLs; wire <details> so only one photo section is open at a time */
export function setupParkingPopupPhotos(popupEl, props) {
  var p1 = props.PHOTO1_URL;
  var p2 = props.PHOTO2_URL;
  if (p1) {
    var pre1 = new Image();
    pre1.src = p1;
  }
  if (p2) {
    var pre2 = new Image();
    pre2.src = p2;
  }
  var panels = popupEl.querySelectorAll('details.popup-photo');
  if (!panels.length) return;
  var list = Array.prototype.slice.call(panels);
  list.forEach(function (panel) {
    panel.addEventListener('toggle', function () {
      if (!panel.open) return;
      list.forEach(function (other) {
        if (other !== panel) other.open = false;
      });
    });
  });
}
