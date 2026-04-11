import { PRK_LABELS, PRK_CATEGORY_COLORS } from '../prk/constants.js';
import { applySidebarCollapsed } from './sidebar-layout.js';

/** Default view leaves PRK_HANGAR and PRK_CARR unchecked so hangar-only or carriageway-only sites stay hidden until enabled. */
export function buildPrkFilterExpression(enabledKeys) {
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

export function applyPrkFilters(map) {
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
}

export function initPrkFilterSidebar(map) {
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
    applySidebarCollapsed(map, true);
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
