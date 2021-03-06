var Map = require('map/map');
var MapUtils = require('map/utils');
var GeoJSONConverter = require('map/geojsonconverter');
var Rectangle = require('map/rectangle');
var degreeConvertor = require('map/degreeConvertor');

function isValidLon(lon) {
	if (isNaN(lon))
		return false;

	return lon >= -180 && lon <= 180;
}

function isValidLat(lat) {
	if (isNaN(lat))
		return false;

	return lat >= -90 && lat <= 90;
}

var numberToString = function(number, precision) {
	if (typeof precision != 'undefined' && precision >= 0) {
		var factor = Math.pow(10, precision);
		return (Math.floor(number * factor) / factor).toString();
	} else {
		return number.toString();
	}
};

/**
 * An object to represent the search area
 */
var SearchArea = function() {

	/**
	 * Private variables
	 */

	// Search area is represented by a GeoJSON feature
	var _feature = {
		id: '0',
		bbox: [-180, -90, 180, 90],
		type: 'Feature',
		geometry: {
			type: 'Polygon',
			coordinates: [
				[
					[-180, -90],
					[180, -90],
					[180, 90],
					[-180, 90],
					[-180, -90]
				]
			]
		},
		properties: {}
	};
	// The search area mode : BBOX or POLYGON
	var _mode = SearchArea.BBOX;

	/**
	 * Private methods
	 */

	// Update the feature when the mode or geometry has changed
	var _updateFeature = function() {
		if (_mode == SearchArea.BBOX) {

			// We really need to update the feature like that to be able to display wide rectangles, otherwise the shortest
			// segments will be taken..
			var rectangle = new Rectangle({
				west: _feature.bbox[0],
				south: _feature.bbox[1],
				east: _feature.bbox[2],
				north: _feature.bbox[3]
			});
			_feature.geometry.coordinates = rectangle.feature.geometry.coordinates;
			_feature.geometry.type = rectangle.feature.geometry.type;

			// Code hereafter doesn't really work, but should be.. improve it one day...
			// var rectangle = new Rectangle({
			// 	feature: _feature,
			// 	type: _feature.bbox[0] > _feature.bbox[2] ? "MultiLineString" : "Polygon"
			// });

		} else {
			// Compute the extent from the coordinates
			var coords = _feature.geometry.coordinates[0];
			var minX = coords[0][0];
			var minY = coords[0][1];
			var maxX = coords[0][0];
			var maxY = coords[0][1];
			for (var i = 1; i < coords.length; i++) {
				minX = Math.min(minX, coords[i][0]);
				minY = Math.min(minY, coords[i][1]);
				maxX = Math.max(maxX, coords[i][0]);
				maxY = Math.max(maxY, coords[i][1]);
			}
			_feature.bbox = [minX, minY, maxX, maxY];
		}
	};

	// Get a polygon from a layer
	var _getPolygonFromLayer = function(layer) {

		// First convert the layer to GeoJSON
		if (!GeoJSONConverter.toGeoJSON(layer)) {
			return {
				valid: false,
				message: 'format not supported or invalid.'
			};
		}

		var f;
		// Then check if the data is a feature collection or not
		if (layer.data.type == 'FeatureCollection') {
			if (layer.data.features.length == 1) {
				f = layer.data.features[0];
			} else {
				return {
					valid: false,
					message: 'file must have only one feature, ' + layer.data.features.length + ' found'
				};
			}
		} else {
			f = layer.data;
		}

		// Then check feature is geojson
		if (f.type != 'Feature') {
			return {
				valid: false,
				message: 'invalid feature'
			};
		}

		// Then check feature is polygon
		if (f.geometry.type != 'Polygon') {
			return {
				valid: false,
				message: 'feature must be a polygon'
			};
		}

		return {
			valid: true,
			feature: f
		};
	};

	// Get the mode for the search area
	this.getMode = function() {
		return _mode;
	};

	// Set the mode for the search area
	this.setMode = function(mode) {
		_mode = mode;
	};

	// Get the bbox as a object
	this.getBBox = function() {
		return {
			west: _feature.bbox[0],
			south: _feature.bbox[1],
			east: _feature.bbox[2],
			north: _feature.bbox[3]
		};
	};

	// Get the GeoJSON feature that represents the search area
	this.getFeature = function() {
		return _feature;
	};

	// Get the polygon text
	this.getPolygonText = function() {
		var coords = _feature.geometry.coordinates[0];
		var text = "";
		for (var i = 0; i < coords.length; i++) {
			text += degreeConvertor.toDMS(coords[i][1], true, {positionFlag: 'number'}) + " " + degreeConvertor.toDMS(coords[i][0], false, {positionFlag: 'number'}) + "\n";
		}
		return text;
	};

	//Transform to WKT
	//NGEO 509 : it is requested to rollback the changes !
	this.toWKT = function(precision) {

		var coords = _feature.geometry.coordinates;

		var param = "POLYGON(";
		if ( _feature.geometry.type == "MultiLineString" ) {
			// Create rectangle containing Polygon coordinates for the given feature
			var rectangle = new Rectangle({
				west: _feature.bbox[0],
				south: _feature.bbox[1],
				east: _feature.bbox[2],
				north: _feature.bbox[3],
				type: "Polygon"
			});
			coords = rectangle.feature.geometry.coordinates;
		} 

		// Convert polygon coordinates to WKT
		for (var j = 0; j < coords.length; j++) {
			if (j != 0) {
				param += ",";
			}
			param += "(";
			for (var i = 0; i < coords[j].length; i++) {
				if (i != 0) {
					param += ",";
				}
				param += numberToString(coords[j][i][0], precision) + " " + numberToString(coords[j][i][1], precision);
			}
			param += ")";
		}

		param += ")";

		return param;
	};

	// 	Get the opensearch parameter for the search area
	this.getOpenSearchParameter = function(precision) {
		var param;
		if (_mode == SearchArea.POLYGON) {
			// See http://www.opensearch.org/Specifications/OpenSearch/Extensions/Geo/1.0/Draft_2#The_.22geometry.22_parameter
			param = "geom=" + this.toWKT(precision);

		} else if (_mode == SearchArea.BBOX) {

			param = "bbox=" + numberToString(_feature.bbox[0], precision) + "," + numberToString(_feature.bbox[1], precision) + "," + numberToString(_feature.bbox[2], precision) + "," + numberToString(_feature.bbox[3], precision);
		}

		return param;
	};

	// Set an empty search area
	this.empty = function() {
		_feature.bbox = [0, 0, 0, 0];
		_feature.geometry.coordinates = [
			[
				[0, 0]
			]
		];
		_mode = SearchArea.EMPTY;
		_updateFeature();
	};

	// Set the BBox
	this.setBBox = function(bbox) {
		_feature.bbox = [bbox.west, bbox.south, bbox.east, bbox.north];
		_mode = SearchArea.BBOX;
		_updateFeature();
	};

	// Set the search area from a layer
	this.setFromLayer = function(layer) {
		var result = _getPolygonFromLayer(layer);
		if (result.valid) {
			_feature.geometry.coordinates = result.feature.geometry.coordinates;
			_mode = SearchArea.POLYGON;
			_updateFeature();
		}
		return result;
	};

	// Import polygon from text
	this.setPolygonFromText = function(text) {

		var coordinates = degreeConvertor.textToDecimalDegrees(text);
		if ( coordinates.length == 0 ) {
			this.empty();
			return false;
		}

		// Validate lon/lat values
		for ( var i=0; i<coordinates.length; i++ ) {
			if ( !isValidLon(coordinates[i][0]) || !isValidLat(coordinates[i][1]) ) {
				return false;
			}
		}
		
		// Close polygon if needed
		if (coordinates[0][0] != coordinates[coordinates.length - 1][0] || coordinates[0][1] != coordinates[coordinates.length - 1][1]) {
			coordinates.push(coordinates[0]);
		}
		_feature.geometry.coordinates = [coordinates];
		_mode = SearchArea.POLYGON;
		_updateFeature();
		return true;
	};

	// Import from WKT, POLYGON or MULTIPOLYGON
	this.setFromWKT = function(wkt) {
		var polygonRe = /POLYGON\(\(([^\)]+)\)\)/gm;
		var match = polygonRe.exec(decodeURIComponent(wkt));

		if (match) {
			data = match[1];
		} else {
			var multiPolygonRe = /MULTIPOLYGON\(\(\(([^\)]+)/gm;
			match = multiPolygonRe.exec(decodeURIComponent(wkt));
		}

		if (match) {
			var data = match[1];
			var strCoords = data.split(',');
			var coordinates = [];
			for (var i = 0; i < strCoords.length; i++) {
				var strLatLon = strCoords[i].split(/\s+/);
				var lat = parseFloat(strLatLon[1]);
				var lon = parseFloat(strLatLon[0]);
				coordinates.push([lon, lat]);
			}
			_feature.geometry.coordinates = [coordinates];
			_mode = SearchArea.POLYGON;
			_updateFeature();
		}
	};
};

SearchArea.BBOX = 0;
SearchArea.POLYGON = 1;
SearchArea.EMPTY = -1;


module.exports = SearchArea;