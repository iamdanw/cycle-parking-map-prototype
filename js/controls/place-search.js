/** Photon bbox=minLon,minLat,maxLon,maxLat — approx. Greater London (axis-aligned). */
const PHOTON_GREATER_LONDON_BBOX = '-0.51,51.28,0.33,51.69';

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

export class PlaceSearchControl {
  onAdd(map) {
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
  }

  getDefaultPosition() {
    return 'top-left';
  }

  _openPanel() {
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

    var attrib = document.createElement('p');
    attrib.className = 'prk-search-attrib';
    attrib.innerHTML =
      'Search via ' +
      '<a href="https://photon.komoot.io" target="_blank" rel="noopener noreferrer">Photon</a> / ' +
      '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>';

    inner.appendChild(input);
    inner.appendChild(results);
    inner.appendChild(attrib);
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
  }

  _closePanel() {
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
  }

  _fetchResults(q) {
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
  }

  _renderResults(features) {
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
  }

  _navigateToFeature(feature) {
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
  }

  onRemove() {
    this._closePanel();
    if (this._container && this._container.parentNode) {
      this._container.parentNode.removeChild(this._container);
    }
    this._container = null;
    this._map = null;
    this._toggleBtn = null;
  }
}
