var Vector3d = require('map/vector3d');

var toRadians = function(num) {
	return num * Math.PI / 180;
}

/**
 * MapUtils module
 */
module.exports = {

	earthRadius: 6371e3,

	/**
	 * Normalize longitude to always be betwwen -180 and 180
	 */
	normalizeLon: function(lon) {
		while (lon > 180)
			lon -= 360;
		while (lon < -180)
			lon += 360;
		return lon;
	},

	/**
	 * Compute the bbox of a geometry
	 */
	computeBbox: function(geometry) {
		//list of array of coordinates from which we have to compute the extent bbox
		var coordsList = [];
		switch (geometry.type) {
			case "Point":
				var pointCoords = geometry.coordinates;
				return [pointCoords[0], pointCoords[1], pointCoords[0], pointCoords[1]];
			case "MultiPoint":
				coordsList.push(geometry.coordinates);
				break;
			case "Polygon":
				coordsList.push(geometry.coordinates[0]);
				break;
			case "MultiPolygon":
				var numOuterRings = geometry.coordinates.length;
				for (var j = 0; j < numOuterRings; j++) {
					coordsList.push(geometry.coordinates[j][0]);
				}
				break;
			case "LineString":
				coordsList.push(geometry.coordinates);
				break;
			case "MultiLineString":
				var numOuterRings = geometry.coordinates.length;
				for (var j = 0; j < numOuterRings; j++) {
					coordsList.push(geometry.coordinates[j]);
				}
				break;
		}

		//if there is nothing to compute then just return
		if (coordsList.length == 0)
			return;


		var minX = 10000;
		var minY = 10000;
		var maxX = -10000;
		var maxY = -10000

		for (var j = 0; j < coordsList.length; j++) {
			var coords = coordsList[j];
			for (var i = 0; i < coords.length; i++) {
				minX = Math.min(minX, coords[i][0]);
				minY = Math.min(minY, coords[i][1]);
				maxX = Math.max(maxX, coords[i][0]);
				maxY = Math.max(maxY, coords[i][1]);
			}
		}
		return [minX, minY, maxX, maxY];
	},

	/**
	 * Compute the bbox of a feature and set it as a property
	 */
	computeExtent: function(feature) {
		if (feature.bbox)
			return;
		feature.bbox = this.computeBbox(feature.geometry);
	},

	/**
	 * Tesselate the feature to follow great-circle
	 */
	tesselateGreatCircle: function(feature) {

		// Tesselate polygon to follow great circle
		// TODO : holes are not managed
		var geometry = feature.geometry;
		switch (geometry.type) {
			case "Polygon":
				geometry.coordinates[0] = this.tesselateGreatCircleCoordinates(geometry.coordinates[0]);
				break;
			case "MultiPolygon":
				for (var i = 0; i < geometry.coordinates.length; i++) {
					geometry.coordinates[i][0] = this.tesselateGreatCircleCoordinates(geometry.coordinates[i][0]);
				}
				break;
			case "LineString":
				geometry.coordinates = this.tesselateGreatCircleCoordinates(geometry.coordinates);
				break;
			case "MultiLineString":
				for (var i = 0; i < geometry.coordinates.length; i++) {
					geometry.coordinates[i] = this.tesselateGreatCircleCoordinates(geometry.coordinates[i]);
				}
				break;
		}
	},

	/**
	 *	Check if array of coordinates crossing the dateline
	 */
	crossDateLine: function(coords) {
		var posc = [];
		var negc = [];
		for (var n = 0; n < coords.length - 1; n++) {
			var x1 = coords[n][0];
			var x2 = coords[n + 1][0];

			if (Math.abs(x1 - x2) > 180) {
				return true;
			}
		}
		return false;
	},

	/**
	 * Fix dateline
	 */
	fixDateLine: function(feature) {

		// Fix dateline if needed
		var crossDateLine = false;
		var geometry = feature.geometry;
		switch (geometry.type) {
			case "Polygon":
				crossDateLine = this.crossDateLine(geometry.coordinates[0]);
				break;
			case "MultiPolygon":
				var allCoords = [];
				for (var i = 0; i < geometry.coordinates.length; i++) {
					crossDateLine |= this.crossDateLine(geometry.coordinates[i][0]);
					allCoords = allCoords.concat(geometry.coordinates[i][0]);
				}
				// NGEO-1863: Check if dataline is crossed between polygons
				// NB: Sometimes server splits polygon crossing dateline
				crossDateLine |= this.crossDateLine(allCoords);
				break;
			case "LineString":
				crossDateLine = this.crossDateLine(geometry.coordinates);
				break;
			case "MultiLineString":
				for (var i = 0; i < geometry.coordinates.length; i++) {
					crossDateLine |= this.crossDateLine(geometry.coordinates[i]);
				}
				break;
		}

		if (crossDateLine) {
			return this.splitFeature(feature);
		} else {
			return feature;
		}

	},

	/**
	 *	Splits feature's geometry into MultiPolygon which fixes the date line issue
	 *	
	 *	@return
	 *		New feature with splitted geometry
	 */
	splitFeature: function(feature) {
		var geometry = feature.geometry;
		var featureCopy = {
			id: feature.id,
			type: "Feature",
			geometry: {},
			properties: feature.properties
		};
		switch (geometry.type) {
			case "Polygon":
				var out = this.fixDateLineCoords(geometry.coordinates[0]);
				featureCopy.geometry.type = "MultiPolygon";
				featureCopy.geometry.coordinates = [
					[out[0]],
					[out[1]],
					[out[2]]
				];
				break;
			case "MultiPolygon":
				var dateLineCoords = [];
				for (var i = 0; i < geometry.coordinates.length; i++) {
					var out = this.fixDateLineCoords(geometry.coordinates[i][0]);
					dateLineCoords.push([out[0]], [out[1]], [out[2]]);
				}
				featureCopy.geometry.type = "MultiPolygon";
				featureCopy.geometry.coordinates = dateLineCoords;
				break;
			case "LineString":
				featureCopy.geometry.type = "MultiLineString";
				featureCopy.geometry.coordinates = this.fixDateLineCoords(geometry.coordinates);
				break;
			case "MultiLineString":
				var dateLineCoords = [];
				for (var i = 0; i < geometry.coordinates.length; i++) {
					var out = this.fixDateLineCoords(geometry.coordinates[i]);
					dateLineCoords.push(out[0], out[1], out[2]);
				}
				featureCopy.geometry.type = "MultiLineString";
				featureCopy.geometry.coordinates = dateLineCoords;
				break;
		}

		// Copy intern 3D property too..
		if ( geometry._bucket )
		 	featureCopy.geometry._bucket = geometry._bucket;
		
		return featureCopy;
	},

	/**
	 * Fix date line on coordinates
	 * From one array of coordinates,
	 * split on 2 arrays, one for each side
	 * 
	 * @function fixDateLineCoordsWithSplit
	 * @param coords
	 * @returns {object}
	 */
	fixDateLineCoordsWithSplit: function(coords) {
		var crossDate = 0;
		var newCrossDate = 0;
		var first = [];
		var second = [];
		var current = [];
		current = first;
		for (var n = 0; n < coords.length; n++) {

			// get coord for n
			var coord = [coords[n][0], coords[n][1]];

			// get coord for n+1
			var p = n + 1;
			if (p == coords.length) {
				p = 0;
			}
			var coordP = [coords[p][0], coords[p][1]];

			if ((coord[0] - coordP[0]) > 180) {
				// if cross date line 180/-180 from west to east
				// 0 - push current coord in current polygon
				// 1 - calcul of coord at 180 lon (coordDateLine1)
				// 2 - push it in current polygon
				// 3 - calcul of coord at -180 lon (coordDateLine2)
				// 4 - push it in other polygon

				// 0
				current.push(coord);
				// 1
				var deltaLong = (coordP[0] + 360) - coord[0];
				var deltaLat = coordP[1] - coord[1];
				var coordDateLine1;
				if (deltaLong !== 0) {
					coordDateLine1 = [180, coord[1] + (180 - coord[0]) * deltaLat / deltaLong];
				} else {
					coordDateLine1 = [180, coord[1]];
				}
				// 2
				current.push(coordDateLine1);
				// 3
				var coordDateLine2;
				if (deltaLong !== 0) {
					coordDateLine2 = [-180, coord[1] + (180 - coord[0]) * deltaLat / deltaLong];
				} else {
					coordDateLine2 = [-180, coord[1]];
				}
				// 4
				if (current === first) {current = second;} else {current = first;}
				current.push(coordDateLine2);

			} else if ((coord[0] - coordP[0]) < -180) {
				// if cross date line 180/-180 from east to west
				// 0 - push current coord in current polygon
				// 1 - calcul of coord at 180 lon (coordDateLine1)
				// 2 - push it in current polygon
				// 3 - calcul of coord at -180 lon (coordDateLine2)
				// 4 - push it in other polygon

				// 0
				current.push(coord);

				// 1
				var deltaLong = (coordP[0] - 360) - coord[0];
				var deltaLat = coordP[1] - coord[1];
				var coordDateLine1;
				if (deltaLong !== 0) {
					coordDateLine1 = [-180, coord[1] + (-180 - coord[0]) * deltaLat / deltaLong];
				} else {
					coordDateLine1 = [-180, coord[1]];
				}
				// 2
				current.push(coordDateLine1);
				// 3
				var coordDateLine2;
				if (deltaLong !== 0) {
					coordDateLine2 = [180, coord[1] + (-180 - coord[0]) * deltaLat / deltaLong];
				} else {
					coordDateLine2 = [180, coord[1]];
				}
				// 4
				if (current === first) {current = second;} else {current = first;}
				current.push(coordDateLine2);
			} else {
				current.push(coord);
			}
			crossDate = newCrossDate;
		}
		return [first, second];
	},

	/**
	 * Fix date line on coordinates
	 * From one array of coordinates,
	 * set 3 arrays
	 *  - original values + gap
	 *  - original values + gap - 360
	 *  - original values + gap + 360
	 * 
	 * @function fixDateLineCoords
	 * @param coords
	 * @returns {object}
	 */
	fixDateLineCoords: function(coords) {
		var gapCrossDate = 0;
		var newCrossDate = 0;
		var first = [];
		var second = [];
		var third = [];
		current = first;
		for (var n = 0; n < coords.length; n++) {

			// get coord for n
			var coord = [coords[n][0], coords[n][1]];

			first.push([coord[0] + gapCrossDate, coord[1]]);
			second.push([coord[0] + gapCrossDate - 360, coord[1]]);
			third.push([coord[0] + gapCrossDate + 360, coord[1]]);

			// get coord for n+1
			var p = n + 1;
			if (p == coords.length) {
				p = 0;
			}
			var coordP = [coords[p][0], coords[p][1]];

			if ((coord[0] - coordP[0]) > 180) {
				// if cross date line 180/-180 from west to east
				gapCrossDate += 360;
			} else if ((coord[0] - coordP[0]) < -180) {
				// if cross date line 180/-180 from east to west
				gapCrossDate -= 360;
			}
		}
		return [first, second, third];
	},

	/**
	 * Tesselate coordinates to follow great circle
	 */
	tesselateGreatCircleCoordinates: function(coords) {

		var output = [];
		for (var i = 0; i < coords.length - 1; i++) {
			output.push(coords[i]);
			this.tesselateGreatCircleLine(coords[i], coords[i + 1], output);
		}

		output.push(coords[coords.length - 1]);

		return output;
	},

	/**
	 * Tesselate an edge (point1,point2) to follow great circle
	 */
	tesselateGreatCircleLine: function(point1, point2, output) {

		var lat1 = point1[1];
		var lon1 = point1[0];
		var lat2 = point2[1];
		var lon2 = point2[0];
		lat1 = lat1 * (Math.PI / 180);
		lon1 = lon1 * (Math.PI / 180);
		lat2 = lat2 * (Math.PI / 180);
		lon2 = lon2 * (Math.PI / 180);
		var d = 2 * Math.asin(Math.sqrt(Math.pow((Math.sin((lat1 - lat2) / 2)), 2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow((Math.sin((lon1 - lon2) / 2)), 2)));
		var numsegs = Math.floor(d * 6371.0 / 200.0);
		var f = 0.0;
		for (var i = 0; i < numsegs - 1; i++) {
			f += 1.0 / numsegs;
			var A = Math.sin((1 - f) * d) / Math.sin(d);
			var B = Math.sin(f * d) / Math.sin(d);
			var x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
			var y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
			var z = A * Math.sin(lat1) + B * Math.sin(lat2);
			var latr = Math.atan2(z, Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)));
			var lonr = Math.atan2(y, x);
			var lat = latr * (180 / Math.PI);
			var lon = lonr * (180 / Math.PI);

			output.push([lon, lat]);
		}
	},

	/**
	 *	Parse url extracting all the parameters which respecting key=value
	 *	Ex: http://base_url?key1=val1&key2=val2
	 *
	 *	Returns a dictionary containing parameters + BASEURL
	 */
	parseUrl: function(url) {
		var parsed = {};
		var params = url.split(/\?|\&/);
		parsed["BASEURL"] = params[0];
		_.each(params, function(param) {
			var kv = param.split("=");
			if (kv.length == 2)
				parsed[kv[0].toUpperCase()] = kv[1];
		});

		return parsed;
	},

	/**
	 *	Get WMS/WMTS layer name from url
	 */
	getLayerName: function(url) {
		var parsed = this.parseUrl(url);
		if ( !parsed['SERVICE'] ) {
			console.warn("Url " + url + " hasn't got a SERVICE parameter");
			return null;
		}
		var layerTag = parsed['SERVICE'].toUpperCase() == 'WMS' ? 'LAYERS' : 'LAYER';
		return parsed[layerTag];
	},

	/**
	 *	Create WMS/WMTS layer from url
	 *	Not really appropriate here, move it ?
	 */
	createWmsLayerFromUrl: function(url) {

		var parsed = this.parseUrl(url);
		
		// TODO: Check SRS --> must be 4326 ?
		var layerTag = parsed['SERVICE'].toUpperCase() == 'WMS' ? 'LAYERS' : 'LAYER';
		var wmsLayer = {
			type: parsed['SERVICE'],
			baseUrl: parsed["BASEURL"],
			name: parsed[layerTag],
			title: parsed[layerTag],
			params: {
				format: parsed['FORMAT'] ? decodeURIComponent(parsed['FORMAT']) : 'image/png',
				style: parsed['STYLE'],
				time: parsed['TIME'] ? decodeURIComponent(parsed['TIME']) : null
			}
		};
		if ( parsed['SERVICE'].toUpperCase() == 'WMTS' ) {
			wmsLayer.params.matrixSet = parsed['TILEMATRIXSET'];
			wmsLayer.params.layer = parsed[layerTag];
		} else {
			wmsLayer.params.layers = parsed[layerTag];
		}
		return wmsLayer;
	},

	/**
	 *	The following part is extracted from http://www.movable-type.co.uk/scripts/latlong.html
	 *	(c) Chris Veness 2011-2015
	 *	MIT Licence
	 */

	/**
	 *	Convert the given lat/lon to Vector3 object
	 */
	toVector: function(latLon) {
		var phi = toRadians(latLon.lat);
		var lambda = toRadians(latLon.lon);

		// Right-handed vector: x -> 0°E,0°N; y -> 90°E,0°N, z -> 90°N
		var x = Math.cos(phi) * Math.cos(lambda);
		var y = Math.cos(phi) * Math.sin(lambda);
		var z = Math.sin(phi);
		return new Vector3d(x,y,z);
	},

	/**
	 * Great circle obtained by heading on given bearing from the given lat/lon
	 *
	 * Direction of vector is such that initial bearing vector b = c × p.
	 *
	 * @param   {number}   bearing - Compass bearing in degrees.
	 * @returns {Vector3d} Normalised vector representing great circle.
	 *
	 * @example
	 *   var p1 = new LatLon(53.3206, -1.7297);
	 *   var gc = p1.greatCircle(96.0); // gc.toString(): [-0.794,0.129,0.594]
	 */
	greatCircle: function(lat, lon, bearing) {
		var phi = toRadians(lat);
		var lambda = toRadians(lon);
		var theta = toRadians(Number(bearing));

		var x =  Math.sin(lambda) * Math.cos(theta) - Math.sin(phi) * Math.cos(lambda) * Math.sin(theta);
		var y = -Math.cos(lambda) * Math.cos(theta) - Math.sin(phi) * Math.sin(lambda) * Math.sin(theta);
		var z =  Math.cos(phi) * Math.sin(theta);
		return new Vector3d(x, y, z);
	},

	/**
	 *	Distance between to points on earth
	 *	@param {Object} p1 : Geo-point {lat: int, lon: int}
	 *	@param {Object} p2 : Geo-point {lat: int, lon: int}
	 *	@param {number} radius : Earth radius in meters
	 *	@returns
	 *		Distance between to points in same units as radius
	 */
	distanceBetween: function(p1, p2, radius) {
	    // if (!(point instanceof LatLon)) throw new TypeError('point is not LatLon object');
		radius = (radius === undefined) ? this.earthRadius : Number(radius);

		var v1 = this.toVector(p1);
		var v2 = this.toVector(p2);
		var delta = v1.angleTo(v2);
		var d = delta * radius;
		return d;
	},

	crossTrackDistanceBetween: function(latLon, pathStart, pathEnd, radius) {
	    radius = (radius === undefined) ? this.earthRadius : Number(radius);

	    var p = this.toVector(latLon);

	    // Great circle defined by two points
	    // console.log("pathStart", pathStart);
	    var v1 = this.toVector(pathStart);
	    // console.log("v1", v1);
	    // console.log("pathEnd", pathEnd);
	    var v2 = this.toVector(pathEnd);
	    // console.log("v2", v2);
	    var gc = v1.cross(v2);
	    // console.log(gc);

	    var alpha = gc.angleTo(p, p.cross(gc)); // (signed) angle between point & great-circle normal vector
	    alpha = alpha<0 ? -Math.PI/2 - alpha : Math.PI/2 - alpha; // (signed) angle between point & great-circle

	    var d = alpha * radius;

	    return d;
	},

	distanceToSegment: function(latLon, point1, point2, radius) {
	    var v0 = this.toVector(latLon),
	    	v1 = this.toVector(point1),
	    	v2 = this.toVector(point2);

	    // Dot product p10⋅p12 tells us if p0 is on p2 side of p1, similarly for p20⋅p21
	    var p10 = v0.minus(v1), p12 = v2.minus(v1);
	    var p20 = v0.minus(v2), p21 = v1.minus(v2);

	    var extent1 = p10.dot(p12);
	    var extent2 = p20.dot(p21);

	    var withinExtent = extent1>=0 && extent2>=0;

	    if (withinExtent) {
	        // closer to segment than to its endpoints, use cross-track distance
	        var d = Math.abs(this.crossTrackDistanceBetween(latLon, point1, point2, radius));
	    } else {
	        // beyond segment extent, take smaller of distances to endpoints
	        var d1 = this.distanceBetween(latLon, point1, radius);
	        var d2 = this.distanceBetween(latLon, point2, radius);
	        var d = Math.min(d1, d2);
	    }

	    return d;
	}
}