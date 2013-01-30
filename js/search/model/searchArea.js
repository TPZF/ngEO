define( ['map/map', 'map/geojsonconverter'], function(Map, GeoJSONConverter) {

// Utility method to transfrom from decimal degree to degree/minute/second
var toDMS = function(dd) {
	var deg = dd | 0; // truncate dd to get degrees
	var frac = Math.abs(dd - deg); // get fractional part
	var min = (frac * 60) | 0; // multiply fraction by 60 and truncate
	var sec = (frac * 3600 - min * 60) | 0;
	return deg + ":" + min + ":" + sec;
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
		bbox: [-180,-90,180,90],
		type: 'Feature',
		geometry: {
			type: 'Polygon',
			coordinates: [[ [ -180, -90 ],
				[ 180, -90 ],
				[ 180, 90 ],
				[ -180, 90 ],
				[ -180, -90 ]
			]]
		}
	};
	// The search area mode : BBOX or POLYGON
	var _mode = SearchArea.BBOX;

	/**
	 * Private methods
	 */
	
	// Update the feature when the mode or geometry has changed
	var _updateFeature = function() {
		if ( _mode == SearchArea.BBOX ) {
			_feature.geometry.coordinates = [[ [ _feature.bbox[0], _feature.bbox[1] ],
				[ _feature.bbox[2], _feature.bbox[1] ],
				[ _feature.bbox[2], _feature.bbox[3] ],
				[ _feature.bbox[0], _feature.bbox[3] ],
				[ _feature.bbox[0], _feature.bbox[1] ]
			]];
		} else {
			// Compute the extent from the coordinates
			var coords = _feature.geometry.coordinates[0];
			var minX = coords[0][0];
			var minY = coords[0][1];
			var maxX =  coords[0][0];
			var maxY =  coords[0][1];
			for ( var i = 1;  i < coords.length; i++ )	{
				minX = Math.min( minX, coords[i][0] );	
				minY = Math.min( minY, coords[i][1] );	
				maxX = Math.max( maxX, coords[i][0] );	
				maxY = Math.max( maxY, coords[i][1] );	
			}
			_feature.bbox = [ minX, minY, maxX, maxY ];
		}
	};
	
	// Get a polygon from a layer
	var _getPolygonFromLayer = function(layer) {
	
		// First convert the layer to GeoJSON
		if ( !GeoJSONConverter.toGeoJSON(layer) ) {
			return { valid: false, message: 'format not supported' };
		}
		
		var f;
		// Then check if the data is a feature collection or not
		if ( layer.data.type == 'FeatureCollection' ) {
			if ( layer.data.features.length == 1 ) {
				f = layer.data.features[0];
			} else {
				return { valid: false, message: 'file must have only one feature, ' + layer.data.features.length + ' found'};
			}
		} else {
			f = layer.data;
		}
	
		// Then check feature is geojson
		if ( f.type != 'Feature' ) {
			return { valid: false, message: 'invalid feature' };
		}
	
		// Then check feature is polygon
		if ( f.geometry.type != 'Polygon' ) {
			return { valid: false, message: 'feature must be a polygon' };
		}
		
		return { valid: true, feature: f };
	};
	
	// Get the mode for the search area
	this.getMode = function() {
		return _mode;
	};
	
	// Get the bbox as a object
	this.getBBox = function() {
		return { west: _feature.bbox[0],
			south: _feature.bbox[1],
			east: _feature.bbox[2],
			north: _feature.bbox[3] };
	};
	
	// Get the GeoJSON feature that represents the search area
	this.getFeature = function() {
		return _feature;
	};
		
	// Get the polygon text
	this.getPolygonText = function() {
		var coords = _feature.geometry.coordinates[0];
		var text = "";
		for ( var i = 0; i < coords.length; i++ ) {
			text += toDMS(coords[i][1]) + " " + toDMS(coords[i][0]) + "\n";
		}
		return text;
	};
	
	// 	Get the opensearch parameter for the search area
	this.getOpenSearchParameter = function() {
		var param;
		if (_mode == SearchArea.POLYGON) {
		
			// See http://www.opensearch.org/Specifications/OpenSearch/Extensions/Geo/1.0/Draft_2#The_.22geometry.22_parameter
			var coords = _feature.geometry.coordinates;
			param = "g=POLYGON(";
			for ( var j = 0; j < coords.length; j++ ) {
				if ( j != 0 ) {
					param += ",";
				}
				param += "(";
				for ( var i = 0; i < coords[j].length; i++ ) {
					if ( i != 0 ) {
						param += ",";
					}
					param += coords[j][i][1] + " " + coords[j][i][0]
				}
				param += ")";
			}
			
			param += ")";
		
		} else if (_mode == SearchArea.BBOX){
		
			param = "bbox=" + _feature.bbox[0] + "," + _feature.bbox[1] + "," 
				+ _feature.bbox[2] + "," + _feature.bbox[3];
		}
		
		return param;
	};
	
	// Set an empty search area
	this.empty = function() {
		_feature.bbox = [ 0, 0, 0, 0 ];
		_feature.geometry.coordinates = [[ [0,0] ]];
		_updateFeature();
	};
	
	// Set the BBox
	this.setBBox = function(bbox) {
		_feature.bbox = [ parseFloat(bbox.west), parseFloat(bbox.south), parseFloat(bbox.east), parseFloat(bbox.north) ];
		_mode = SearchArea.BBOX;
		_updateFeature();
	};
	
	// Set the search area from a layer
	this.setFromLayer = function(layer) {
		var result = _getPolygonFromLayer(layer);
		if ( result.valid ) {
			_feature.geometry.coordinates = result.feature.geometry.coordinates;
			_mode = SearchArea.POLYGON;
			_updateFeature();
		}
		return result;
	};
	
	// Import polygon from text
	this.setPolygonFromText = function(text) {
		var polygonRe = /\s*([-+]?)(\d+):(\d+):(\d+)\s+([-+]?)(\d+):(\d+):(\d+)/gm;
		var match = polygonRe.exec(text);
		if (!match) {
			this.empty();
			return false;
		}
		var coordinates = [];
		while (match) {
			var lat = parseFloat(match[2]) + (parseFloat(match[3])/60.0) + (parseFloat(match[4])/3600.0);
			var lon = parseFloat(match[6]) + (parseFloat(match[7])/60.0) + (parseFloat(match[8])/3600.0);
			lat *= (match[1] == '-') ? -1.0 : 1.0;
			lon *= (match[5] == '-') ? -1.0 : 1.0;
			coordinates.push( [lon,lat] );
			match = polygonRe.exec(text);
		}
		_feature.geometry.coordinates = [coordinates];
		_mode = SearchArea.POLYGON;
		_updateFeature();
		return true;
	};
	
	// Import from WKT
	this.setFromWKT = function(wkt, invertLatLon) {
		var polygonRe = /POLYGON\(\(([^\)]+)\)\)/gm;
		var match = polygonRe.exec( decodeURIComponent(wkt) );
		if ( match ) {
			var data = match[1];
			var strCoords = data.split(',');
			var coordinates = [];
			for ( var i = 0; i < strCoords.length; i++ ) {
				var strLatLon = strCoords[i].split(/\s+/);
				var lat = parseFloat(strLatLon[invertLatLon ? 1 : 0]);
				var lon = parseFloat(strLatLon[invertLatLon ? 0 : 1]);
				coordinates.push( [lon,lat] );
			}
			_feature.geometry.coordinates = [coordinates];
			_mode = SearchArea.POLYGON;
			_updateFeature();
		}
	};
};

SearchArea.BBOX = 0;
SearchArea.POLYGON = 1;

return SearchArea;

});
