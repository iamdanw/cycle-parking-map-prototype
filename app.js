(function () {
  var PRK_LABELS = {
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
  var PRK_CATEGORY_ORDER = Object.keys(PRK_LABELS).filter(function (k) {
    return k !== 'PRK_CARR';
  });

  var PRK_CATEGORY_COLORS = {
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

  /**
   * Path markup for filter-dot icons (viewBox 0 0 24 24). Parent <svg> sets stroke from CSS.
   * Keys mirror PRK_LABELS; stroke inherits as currentColor on .prk-filter-dot.
   */
  var PRK_FILTER_DOT_INNER = {
    PRK_CARR:
      '<path d="M7.5 19 11 6.5M16.5 19 13 6.5"/><path d="M12 19V6.5" stroke-dasharray="2 2.5"/>',
    PRK_COVER: '<path d="M4 9 12 4l8 5"/><path d="M8 18v-6M16 18v-6"/>',
    PRK_SECURE:
      '<rect x="8" y="11" width="8" height="9" rx="1"/><path d="M10 11V9a2 2 0 0 1 4 0v2"/>',
    PRK_LOCKER: '<rect x="7.5" y="5" width="9" height="14" rx="1"/><path d="M15 11v3"/>',
    PRK_SHEFF:
      '<path d="M7 18V10q2-2 4 0v8M13 18V10q2-2 4 0v8M6 18h12"/>',
    PRK_MSTAND: '<path d="M5 18 9 7l3 6 3-6 4 11"/>',
    PRK_PSTAND: '<path d="M9 18V6h4a4 4 0 0 1 4 4 4 4 0 0 1-4 4H9v4"/>',
    PRK_HOOP: '<path d="M6 18V12q6-6 12 0v6"/>',
    PRK_POST: '<path d="M12 6v12M9 18h6"/>',
    PRK_BUTERF:
      '<path d="M12 5 8 10 5 9M12 5l4 5 3-1M12 19l-4-5-3 1M12 19l4-5 3 1"/>',
    PRK_WHEEL:
      '<circle cx="9.5" cy="12" r="3.25"/><path d="M15 7.5v9M17.5 7.5v9M20 7.5v9M5 18h14"/>',
    PRK_HANGAR: '<path d="M4 18V13l8-7 8 7v5"/>',
    PRK_TIER: '<path d="M4 7h16M4 12h16M6 7v5M18 7v5"/>',
    PRK_OTHER: '<circle cx="9" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>'
  };

  function appendPrkFilterDotIcon(dot, key) {
    var inner = PRK_FILTER_DOT_INNER[key] || PRK_FILTER_DOT_INNER.PRK_OTHER;
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', 'prk-filter-dot-svg');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.85');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    var wrapper = document.createElementNS(ns, 'g');
    wrapper.innerHTML = inner;
    while (wrapper.firstChild) {
      svg.appendChild(wrapper.firstChild);
    }
    dot.appendChild(svg);
  }

  function primaryPrkCategory(props) {
    for (var i = 0; i < PRK_CATEGORY_ORDER.length; i++) {
      var k = PRK_CATEGORY_ORDER[i];
      if (props[k] === 'TRUE') return k;
    }
    return 'NONE';
  }

  function assignPrimaryPrkToGeoJSON(geojson) {
    var feats = geojson.features || [];
    for (var i = 0; i < feats.length; i++) {
      var f = feats[i];
      if (!f.properties) f.properties = {};
      f.properties.PRIMARY_PRK = primaryPrkCategory(f.properties);
    }
  }

  function circleColorMatchExpression() {
    var expr = ['match', ['get', 'PRIMARY_PRK']];
    for (var j = 0; j < PRK_CATEGORY_ORDER.length; j++) {
      var key = PRK_CATEGORY_ORDER[j];
      expr.push(key, PRK_CATEGORY_COLORS[key]);
    }
    expr.push(PRK_CATEGORY_COLORS.NONE);
    return expr;
  }

  /** Circles and capacity labels hidden until zoom is greater than this */
  var ZOOM_CIRCLE_SHOW = 13;

  /** Opacity for circle layer: 0 at zoom <= ZOOM_CIRCLE_SHOW, ramps to 1 by ZOOM_CIRCLE_SHOW + 1 */
  var circleOpacityExpr = [
    'interpolate',
    ['linear'],
    ['zoom'],
    ZOOM_CIRCLE_SHOW,
    0,
    ZOOM_CIRCLE_SHOW + 1,
    1
  ];

  /**
   * Scales 128px raster PRK icons to sit inside parking-point circle-radius
   * (same zoom stops as circle-radius).
   */
  var prkMapIconSizeExpr = [
    'interpolate',
    ['linear'],
    ['zoom'],
    ZOOM_CIRCLE_SHOW,
    0.056,
    14,
    0.076,
    16,
    0.096,
    18,
    0.117
  ];

  function prkMapIconImageId(prkKey) {
    return 'prk-dot-' + prkKey;
  }

  function prkMapIconSvgInner(primaryKey) {
    if (primaryKey === 'NONE') return PRK_FILTER_DOT_INNER.PRK_OTHER;
    return PRK_FILTER_DOT_INNER[primaryKey] || PRK_FILTER_DOT_INNER.PRK_OTHER;
  }

  function prkMapIconSvgDataUrl(primaryKey) {
    var inner = prkMapIconSvgInner(primaryKey);
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="128" height="128" fill="none" stroke="rgba(255,255,255,0.95)" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round">' +
      inner +
      '</svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function prkPrimaryIconImageExpr() {
    var expr = ['match', ['get', 'PRIMARY_PRK']];
    for (var pi = 0; pi < PRK_CATEGORY_ORDER.length; pi++) {
      var pk = PRK_CATEGORY_ORDER[pi];
      expr.push(pk, prkMapIconImageId(pk));
    }
    expr.push('NONE', prkMapIconImageId('NONE'));
    expr.push(prkMapIconImageId('NONE'));
    return expr;
  }

  function loadPrkMapDotImages(map, keys, onDone) {
    var idx = 0;
    function step() {
      if (idx >= keys.length) {
        onDone();
        return;
      }
      var key = keys[idx];
      idx++;
      var id = prkMapIconImageId(key);
      var img = new Image();
      img.onload = function () {
        try {
          map.addImage(id, img);
        } catch (err) {
          console.warn('Map PRK icon addImage', id, err);
        }
        step();
      };
      img.onerror = function () {
        console.warn('Map PRK icon failed:', key);
        step();
      };
      img.src = prkMapIconSvgDataUrl(key);
    }
    step();
  }

  /** Heatmap stays visible at all zooms; eases down slightly when zoomed in so points and labels stay readable */
  var heatmapOpacityExpr = [
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
  var heatmapWeightExpr = [
    'min',
    [
      'max',
      ['/', ['coalesce', ['to-number', ['get', 'PRK_CPT']], 1], 8],
      0.15
    ],
    4
  ];

  var heatmapColorLight = [
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

  var heatmapColorDark = [
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

  function isDarkScheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function applyBasemapTheme(map) {
    if (!map || !map.isStyleLoaded()) return;
    var src = map.getSource('osm');
    if (!src || typeof src.setSourceProperty !== 'function') return;
    var dark = isDarkScheme();
    src.setSourceProperty(function () {
      src._options.tiles = dark
        ? ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png']
        : ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'];
      src._options.attribution = dark
        ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | <a href="https://photon.komoot.io" target="_blank" rel="noopener noreferrer">Photon</a> | &copy; <a href="https://carto.com/attributions">CARTO</a>'
        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | <a href="https://photon.komoot.io" target="_blank" rel="noopener noreferrer">Photon</a>';
    });
  }

  function applyMapTheme(map) {
    applyBasemapTheme(map);
    if (map.getLayer && map.getLayer('parking-heat')) {
      map.setPaintProperty(
        'parking-heat',
        'heatmap-color',
        isDarkScheme() ? heatmapColorDark : heatmapColorLight
      );
    }
  }

  /** Default view leaves PRK_HANGAR and PRK_CARR unchecked so hangar-only or carriageway-only sites stay hidden until enabled. */
  function buildPrkFilterExpression(enabledKeys) {
    var allKeys = Object.keys(PRK_LABELS);
    if (enabledKeys.length === allKeys.length) {
      var set = {};
      for (var i = 0; i < enabledKeys.length; i++) set[enabledKeys[i]] = true;
      var complete = true;
      for (var j = 0; j < allKeys.length; j++) {
        if (!set[allKeys[j]]) {
          complete = false;
          break;
        }
      }
      if (complete) return null;
    }
    if (enabledKeys.length === 0) return ['literal', false];
    var parts = ['any'];
    for (var k = 0; k < enabledKeys.length; k++) {
      parts.push(['==', ['get', enabledKeys[k]], 'TRUE']);
    }
    return parts;
  }

  function applyPrkFilters(map) {
    var aside = document.getElementById('filter-sidebar');
    if (!aside || !map.getLayer('parking-point')) return;
    var inputs = aside.querySelectorAll('input[type="checkbox"][data-prk]');
    var enabled = [];
    for (var i = 0; i < inputs.length; i++) {
      if (inputs[i].checked) enabled.push(inputs[i].getAttribute('data-prk'));
    }
    var expr = buildPrkFilterExpression(enabled);
    map.setFilter('parking-point', expr);
    map.setFilter('parking-heat', expr);
    if (map.getLayer('parking-point-icon')) map.setFilter('parking-point-icon', expr);
  }

  function initPrkFilterSidebar(map) {
    var aside = document.getElementById('filter-sidebar');
    if (!aside || aside.querySelector('fieldset')) return;
    var fieldset = document.createElement('fieldset');
    var legend = document.createElement('legend');
    legend.textContent = 'Facility types';
    fieldset.appendChild(legend);
    var keys = Object.keys(PRK_LABELS);
    for (var idx = 0; idx < keys.length; idx++) {
      var key = keys[idx];
      var labelEl = document.createElement('label');
      labelEl.className = 'prk-filter-row';
      var input = document.createElement('input');
      input.type = 'checkbox';
      input.setAttribute('data-prk', key);
      input.checked = key !== 'PRK_HANGAR' && key !== 'PRK_CARR';
      var dot = document.createElement('span');
      dot.className = 'prk-filter-dot';
      dot.style.background =
        PRK_CATEGORY_COLORS[key] != null ? PRK_CATEGORY_COLORS[key] : PRK_CATEGORY_COLORS.NONE;
      appendPrkFilterDotIcon(dot, key);
      labelEl.appendChild(input);
      labelEl.appendChild(dot);
      labelEl.appendChild(document.createTextNode(PRK_LABELS[key]));
      fieldset.appendChild(labelEl);
    }
    var body = document.createElement('div');
    body.className = 'filter-sidebar-body';
    var header = document.createElement('div');
    header.className = 'sidebar-header';
    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.id = 'sidebar-close-btn';
    closeBtn.className = 'sidebar-close-btn';
    closeBtn.setAttribute('aria-controls', 'filter-sidebar');
    closeBtn.setAttribute('aria-label', 'Hide facility filters');
    closeBtn.textContent = '\u00ab Hide';
    var appRoot = document.getElementById('app');
    var startCollapsed = appRoot && appRoot.classList.contains('sidebar-collapsed');
    closeBtn.setAttribute('aria-expanded', startCollapsed ? 'false' : 'true');
    closeBtn.addEventListener('click', function () {
      applySidebarCollapsed(true);
    });
    header.appendChild(closeBtn);
    body.appendChild(header);
    body.appendChild(fieldset);
    aside.appendChild(body);

    var footer = document.createElement('p');
    footer.className = 'filter-sidebar-footer';
    var tflLink = document.createElement('a');
    tflLink.href = 'https://cycling.data.tfl.gov.uk/#!CyclingInfrastructure%2F';
    tflLink.textContent = 'Powered by TfL Open Data';
    footer.appendChild(tflLink);
    aside.appendChild(footer);

    fieldset.addEventListener('change', function () {
      applyPrkFilters(map);
    });
    applyPrkFilters(map);
  }

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

  function popupHtml(props, coordinates) {
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
  function setupParkingPopupPhotos(popupEl, props) {
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

  function boundsFromGeoJSON(geojson) {
    var minX = Infinity;
    var minY = Infinity;
    var maxX = -Infinity;
    var maxY = -Infinity;
    var features = geojson.features || [];
    for (var i = 0; i < features.length; i++) {
      var g = features[i].geometry;
      if (!g || g.type !== 'Point') continue;
      var c = g.coordinates;
      var x = c[0];
      var y = c[1];
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
    if (minX === Infinity) {
      return [[-0.51, 51.28], [0.33, 51.69]];
    }
    return [[minX, minY], [maxX, maxY]];
  }

  /** GeoJSON Polygon approximating a geodesic circle (metres), closed ring */
  function geodesicCircleFeature(lng, lat, radiusMeters, numSegments) {
    var R = 6371008.8;
    var segments = numSegments || 64;
    var deg2rad = Math.PI / 180;
    var latRad = lat * deg2rad;
    var lngRad = lng * deg2rad;
    var angularDist = radiusMeters / R;
    var ring = [];
    for (var i = 0; i <= segments; i++) {
      var bearing = (i / segments) * 2 * Math.PI;
      var lat2 = Math.asin(
        Math.sin(latRad) * Math.cos(angularDist) +
        Math.cos(latRad) * Math.sin(angularDist) * Math.cos(bearing)
      );
      var lng2 =
        lngRad +
        Math.atan2(
          Math.sin(bearing) * Math.sin(angularDist) * Math.cos(latRad),
          Math.cos(angularDist) - Math.sin(latRad) * Math.sin(lat2)
        );
      ring.push([lng2 / deg2rad, lat2 / deg2rad]);
    }
    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [ring]
      }
    };
  }

  /** [lng, lat] of a point `distanceMeters` north along the surface from (lng, lat) */
  function offsetNorthByMetres(lng, lat, distanceMeters) {
    var R = 6371008.8;
    var deg2rad = Math.PI / 180;
    var latRad = lat * deg2rad;
    var lngRad = lng * deg2rad;
    var d = distanceMeters / R;
    var bearing = 0;
    var lat2 = Math.asin(
      Math.sin(latRad) * Math.cos(d) + Math.cos(latRad) * Math.sin(d) * Math.cos(bearing)
    );
    var lng2 =
      lngRad +
      Math.atan2(
        Math.sin(bearing) * Math.sin(d) * Math.cos(latRad),
        Math.cos(d) - Math.sin(latRad) * Math.sin(lat2)
      );
    return [lng2 / deg2rad, lat2 / deg2rad];
  }

  var GEOLOCATE_DISC_METRES = 400;

  var geolocateLabelMarker = null;

  var map = new maplibregl.Map({
    container: 'map',
    attributionControl: false,
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

  var appEl = document.getElementById('app');
  var sidebarWideMq = window.matchMedia('(min-width: 768px)');

  function applySidebarCollapsed(collapsed) {
    if (!appEl) return;
    appEl.classList.toggle('sidebar-collapsed', collapsed);
    var aside = document.getElementById('filter-sidebar');
    if (aside) {
      aside.setAttribute('aria-hidden', collapsed ? 'true' : 'false');
      if (collapsed) aside.setAttribute('inert', '');
      else aside.removeAttribute('inert');
    }
    var filterToggle = document.getElementById('sidebar-filter-toggle');
    if (filterToggle) {
      filterToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      filterToggle.setAttribute(
        'aria-label',
        collapsed ? 'Show facility filters' : 'Hide facility filters'
      );
    }
    var closeBtn = document.getElementById('sidebar-close-btn');
    if (closeBtn) {
      closeBtn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    }
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        map.resize();
      });
    });
  }

  applySidebarCollapsed(!sidebarWideMq.matches);

  function formatPhotonLabel(props) {
    if (!props) return 'Location';
    var seen = {};
    var out = [];
    function push(s) {
      if (!s) return;
      var t = String(s).trim();
      if (!t || seen[t]) return;
      seen[t] = true;
      out.push(t);
    }
    push(props.name);
    push(props.street);
    push(props.district);
    push(props.city);
    push(props.state);
    push(props.postcode);
    push(props.country);
    return out.length ? out.join(', ') : 'Location';
  }

  /** Photon bbox=minLon,minLat,maxLon,maxLat — approx. Greater London (axis-aligned). */
  var PHOTON_GREATER_LONDON_BBOX = '-0.51,51.28,0.33,51.69';

  function SidebarFilterControl() {}

  SidebarFilterControl.prototype.onAdd = function (map) {
    var self = this;
    this._map = map;
    this._container = document.createElement('div');
    this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group';

    var btn = document.createElement('button');
    this._toggleBtn = btn;
    btn.type = 'button';
    btn.id = 'sidebar-filter-toggle';
    btn.className = 'maplibregl-ctrl-icon prk-sidebar-filter-toggle';
    btn.setAttribute('aria-controls', 'filter-sidebar');
    btn.title = 'Filter facility types';
    btn.innerHTML =
      '<span class="prk-sidebar-filter-toggle-icon" aria-hidden="true">' +
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>' +
      '</svg></span>';

    btn.addEventListener('click', function () {
      if (!appEl) return;
      applySidebarCollapsed(!appEl.classList.contains('sidebar-collapsed'));
    });

    this._container.appendChild(btn);
    return this._container;
  };

  SidebarFilterControl.prototype.getDefaultPosition = function () {
    return 'bottom-right';
  };

  SidebarFilterControl.prototype.onRemove = function () {
    if (this._container && this._container.parentNode) {
      this._container.parentNode.removeChild(this._container);
    }
    this._container = null;
    this._map = null;
    this._toggleBtn = null;
  };

  function PlaceSearchControl() {}

  PlaceSearchControl.prototype.onAdd = function (map) {
    var self = this;
    this._map = map;
    this._container = document.createElement('div');
    this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group';

    var btn = document.createElement('button');
    this._toggleBtn = btn;
    btn.type = 'button';
    btn.className = 'maplibregl-ctrl-icon prk-search-toggle';
    btn.setAttribute('aria-label', 'Search place or address');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'prk-search-panel');
    btn.title = 'Search for location';
    btn.innerHTML =
      '<span class="prk-search-toggle-icon" aria-hidden="true">' +
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
      '<circle cx="11" cy="11" r="7"/>' +
      '<path d="M20 20l-4-4"/>' +
      '</svg></span>';

    btn.addEventListener('click', function () {
      if (self._panel) self._closePanel();
      else self._openPanel();
    });

    this._container.appendChild(btn);
    return this._container;
  };

  PlaceSearchControl.prototype.getDefaultPosition = function () {
    return 'top-left';
  };

  PlaceSearchControl.prototype._openPanel = function () {
    if (this._panel) return;
    var self = this;
    var root = document.getElementById('app') || document.body;
    this._panel = document.createElement('div');
    this._panel.id = 'prk-search-panel';
    this._panel.className = 'prk-search-panel';
    this._panel.setAttribute('data-open', '1');

    var inner = document.createElement('div');
    inner.className = 'prk-search-panel-inner';

    var input = document.createElement('input');
    input.type = 'search';
    input.className = 'prk-search-input';
    input.placeholder = 'Search place or address';
    input.setAttribute('aria-label', 'Search place or address');
    input.setAttribute('autocomplete', 'off');

    var results = document.createElement('div');
    results.className = 'prk-search-results';
    results.setAttribute('role', 'listbox');
    results.setAttribute('aria-label', 'Search results');

    inner.appendChild(input);
    inner.appendChild(results);
    this._panel.appendChild(inner);
    root.appendChild(this._panel);

    this._toggleBtn.setAttribute('aria-expanded', 'true');
    this._input = input;
    this._results = results;

    this._escapeHandler = function (e) {
      if (e.key === 'Escape') self._closePanel();
    };
    document.addEventListener('keydown', this._escapeHandler);

    input.addEventListener('input', function () {
      if (self._debounceTimer) clearTimeout(self._debounceTimer);
      self._debounceTimer = setTimeout(function () {
        self._debounceTimer = null;
        var q = self._input ? self._input.value.trim() : '';
        if (!self._results) return;
        if (q.length < 2) {
          self._results.innerHTML = '';
          return;
        }
        self._fetchResults(q);
      }, 300);
    });

    setTimeout(function () {
      input.focus();
    }, 0);
  };

  PlaceSearchControl.prototype._closePanel = function () {
    if (!this._panel) return;
    if (this._escapeHandler) {
      document.removeEventListener('keydown', this._escapeHandler);
      this._escapeHandler = null;
    }
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
    }
    if (this._abort) {
      this._abort.abort();
      this._abort = null;
    }
    if (this._panel.parentNode) this._panel.parentNode.removeChild(this._panel);
    this._panel = null;
    this._input = null;
    this._results = null;
    if (this._toggleBtn) this._toggleBtn.setAttribute('aria-expanded', 'false');
  };

  PlaceSearchControl.prototype._fetchResults = function (q) {
    var self = this;
    if (!this._results) return;
    if (this._abort) this._abort.abort();
    this._abort = new AbortController();
    var url =
      'https://photon.komoot.io/api/?q=' +
      encodeURIComponent(q) +
      '&limit=8&bbox=' +
      PHOTON_GREATER_LONDON_BBOX;
    fetch(url, { signal: this._abort.signal })
      .then(function (r) {
        if (!r.ok) throw new Error('search ' + r.status);
        return r.json();
      })
      .then(function (data) {
        if (!self._results) return;
        self._renderResults(data.features || []);
      })
      .catch(function (err) {
        if (err.name === 'AbortError' || !self._results) return;
        self._results.innerHTML = '';
        var p = document.createElement('p');
        p.className = 'prk-search-empty';
        p.textContent = 'Search failed. Try again.';
        self._results.appendChild(p);
      });
  };

  PlaceSearchControl.prototype._renderResults = function (features) {
    var self = this;
    this._results.innerHTML = '';
    if (!features.length) {
      var empty = document.createElement('p');
      empty.className = 'prk-search-empty';
      empty.textContent = 'No results';
      this._results.appendChild(empty);
      return;
    }
    for (var i = 0; i < features.length; i++) {
      (function (feat) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'prk-search-result-btn';
        b.setAttribute('role', 'option');
        b.textContent = formatPhotonLabel(feat.properties);
        b.addEventListener('click', function () {
          self._navigateToFeature(feat);
          self._closePanel();
        });
        self._results.appendChild(b);
      })(features[i]);
    }
  };

  PlaceSearchControl.prototype._navigateToFeature = function (feature) {
    var m = this._map;
    if (!m || !feature.geometry || feature.geometry.type !== 'Point') return;
    var c = feature.geometry.coordinates;
    var ext = feature.properties && feature.properties.extent;
    if (ext && ext.length >= 4) {
      /* Photon extent: minLon, maxLat, maxLon, minLat (envelope, not GeoJSON bbox order) */
      m.fitBounds(
        [
          [ext[0], ext[3]],
          [ext[2], ext[1]]
        ],
        { padding: 48, maxZoom: 17, duration: 1200 }
      );
    } else {
      m.flyTo({ center: c, zoom: 15, duration: 1200 });
    }
  };

  PlaceSearchControl.prototype.onRemove = function () {
    this._closePanel();
    if (this._container && this._container.parentNode) {
      this._container.parentNode.removeChild(this._container);
    }
    this._container = null;
    this._map = null;
    this._toggleBtn = null;
  };

  var geolocateControl = new maplibregl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    fitBoundsOptions: { maxZoom: 14 },
    trackUserLocation: false
  });
  map.addControl(geolocateControl, 'bottom-right');
  map.addControl(new PlaceSearchControl(), 'bottom-right');
  map.addControl(new SidebarFilterControl(), 'bottom-right');
  if (appEl) applySidebarCollapsed(appEl.classList.contains('sidebar-collapsed'));
  map.addControl(new maplibregl.NavigationControl(), 'top-right');
  map.addControl(new maplibregl.AttributionControl(), 'top-left');

  map.on('load', function () {
    applyBasemapTheme(map);
    var colorSchemeMq = window.matchMedia('(prefers-color-scheme: dark)');
    colorSchemeMq.addEventListener('change', function () {
      applyMapTheme(map);
    });

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

    fetch('data/cycle_parking.json')
      .then(function (r) {
        if (!r.ok) throw new Error('Failed to load data: ' + r.status);
        return r.json();
      })
      .then(function (geojson) {
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

        var prkMapIconKeys = PRK_CATEGORY_ORDER.concat(['NONE']);
        loadPrkMapDotImages(map, prkMapIconKeys, function () {
          map.addLayer({
            id: 'parking-point-icon',
            type: 'symbol',
            source: 'parking',
            layout: {
              'icon-image': prkPrimaryIconImageExpr(),
              'icon-size': prkMapIconSizeExpr,
              'icon-allow-overlap': true,
              'icon-ignore-placement': true
            },
            paint: {
              'icon-opacity': circleOpacityExpr
            }
          });

          initPrkFilterSidebar(map);

          map.fitBounds(bounds, { padding: 48, maxZoom: 14 });

          var CLICK_QUERY_RADIUS_PX = 20;

          function onMapParkingClick(e) {
            if (map.getZoom() <= ZOOM_CIRCLE_SHOW) return;
            var hits = map.queryRenderedFeatures(e.point, {
              layers: ['parking-point', 'parking-point-icon'],
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
          map.on('mouseenter', 'parking-point-icon', function () {
            if (map.getZoom() > ZOOM_CIRCLE_SHOW) map.getCanvas().style.cursor = 'pointer';
          });
          map.on('mouseleave', 'parking-point-icon', function () {
            map.getCanvas().style.cursor = '';
          });
          map.on('zoom', function () {
            if (map.getZoom() <= ZOOM_CIRCLE_SHOW) {
              map.getCanvas().style.cursor = '';
            }
          });

          applyMapTheme(map);
        });
      })
      .catch(function (err) {
        console.error(err);
        var el = document.createElement('div');
        el.className = 'load-error-overlay';
        el.innerHTML = '<p>Could not load <code>data/cycle_parking.json</code>. Serve this folder over HTTP (e.g. <code>python3 -m http.server</code>) and open the site from <code>http://localhost:…</code>.</p>';
        document.body.appendChild(el);
      });
  });
})();

