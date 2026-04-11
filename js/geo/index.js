export function boundsFromGeoJSON(geojson) {
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
export function geodesicCircleFeature(lng, lat, radiusMeters, numSegments) {
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
export function offsetNorthByMetres(lng, lat, distanceMeters) {
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
