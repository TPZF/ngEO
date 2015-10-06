/**
 * MapUtils module
 */
module.exports = {

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

			if (Math.abs(x1 - x2) > 180)
				return true;
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
					[out[1]]
				];
				break;
			case "MultiPolygon":
				var dateLineCoords = [];
				for (var i = 0; i < geometry.coordinates.length; i++) {
					var out = this.fixDateLineCoords(geometry.coordinates[i][0]);
					dateLineCoords.push([out[0]], [out[1]]);
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
					dateLineCoords.push(out[0], out[1]);
				}
				featureCopy.geometry.type = "MultiLineString";
				featureCopy.geometry.coordinates = dateLineCoords;
				break;
		}

		return featureCopy;
	},

	/**
	 * Fix date line on coordinates
	 */
	fixDateLineCoords: function(coords) {

		var posc = [];
		var negc = [];
		for (var n = 0; n < coords.length; n++) {
			var coord = [coords[n][0], coords[n][1]];
			if (coord[0] < 0) {
				coord[0] += 360;
			}
			posc.push(coord);
			negc.push([coord[0] - 360, coord[1]]);
		}

		return [posc, negc];
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
	}
}