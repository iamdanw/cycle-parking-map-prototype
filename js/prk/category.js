import { PRK_CATEGORY_ORDER, PRK_CATEGORY_COLORS } from './constants.js';

export function primaryPrkCategory(props) {
  for (var i = 0; i < PRK_CATEGORY_ORDER.length; i++) {
    var k = PRK_CATEGORY_ORDER[i];
    if (props[k] === 'TRUE') return k;
  }
  return 'NONE';
}

export function assignPrimaryPrkToGeoJSON(geojson) {
  var feats = geojson.features || [];
  for (var i = 0; i < feats.length; i++) {
    var f = feats[i];
    if (!f.properties) f.properties = {};
    f.properties.PRIMARY_PRK = primaryPrkCategory(f.properties);
  }
}

export function circleColorMatchExpression() {
  var expr = ['match', ['get', 'PRIMARY_PRK']];
  for (var j = 0; j < PRK_CATEGORY_ORDER.length; j++) {
    var key = PRK_CATEGORY_ORDER[j];
    expr.push(key, PRK_CATEGORY_COLORS[key]);
  }
  expr.push(PRK_CATEGORY_COLORS.NONE);
  return expr;
}
