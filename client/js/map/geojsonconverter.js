/**
 * GeoJsonConverter based on OpenLayers
 */

//require('OpenLayers.min');
var Configuration = require('../configuration');

// Use to convert to GeoJSON 
var geoJsonFormat = new OpenLayers.Format.GeoJSON();

/*!
 * Convert a OpenLayer.Feature object to GeoJSON
 * @return a GeoJSON feature collection
 */
var _convertOL = function(features) {
	if (features && features.length > 0) {
		var json = geoJsonFormat.write(features);
		return JSON.parse(json);
	}
};

/**
 * @function _buildKMLDescription
 * @param {object} myFeature 
 * @returns {string}
 */
var _buildKMLDescription = function(myFeature) {
	var result = '';
	result += ' <description><![CDATA[';
	var urlIcon = Configuration.getFromPath(myFeature, 'properties.link[].@.rel=icon.href', '');
	if (urlIcon !== '') {
		result += ' <img width="100" height="100" src="' + urlIcon + '" >';
	}
	result += ' ]]></description>';
	return result;
};

var _buildKMLExtendedData = function(myFeature) {
	var aProp = ["identifier", "title", "published", "updated", "date", "originDatasetId", "productUrl", "polygon"];
	var result = '';
	result += ' <ExtendedData>';
	aProp.forEach(function(property) {
		if (myFeature.properties[property]) {
			result += '  <Data name="' + property + '">';
			result += '   <value>' + myFeature.properties[property] + '</value>';
			result += '  </Data>';
		}
	})
	result += ' </ExtendedData>';
	return result;
};

/**
 * @function _buildKMLGeometry
 * @param {*} myFeatureGeometry 
 * @returns {string}
 */
var _buildKMLGeometry = function(myFeatureGeometry) {
	var result = '';
	// Only type Polygon is treated
	if (myFeatureGeometry.type === 'Polygon') {
		result += ' <Polygon>';
		result += '  <outerBoundaryIs>';
		result += '   <LinearRing>';
		result += '    <coordinates>';
		myFeatureGeometry.coordinates[0].forEach(function(coord) {
			result += coord[0] + ',' + coord[1] + ' ';
		});
		result += '    </coordinates>';
		result += '   </LinearRing>';
		result += '  </outerBoundaryIs>';
		result += ' </Polygon>';
	}
	return result;
};

/**
 * Convert to KML, without use OpenLayers lib
 * 
 * @function _convertToKML
 * @param {object} myFeatureCollection 
 */
var _convertToKML = function(myFeatureCollection) {
	var result = '<kml xmlns="http://earth.google.com/kml/2.0">';
	result += '<Folder>';
    result += '<name>Export from ngEO</name>';
    result += '<description>Exported on ' + new Date() + '</description>';
	myFeatureCollection.features.forEach(function(feature) {
		result += '<Placemark id="' + feature.id + '">';
        result += ' <name>' + feature.properties.title + '</name>';
        result += _buildKMLDescription(feature);
		result += _buildKMLGeometry(feature.geometry);
		result += _buildKMLExtendedData(feature);
		result += '</Placemark>'
	});
    result += '</Folder>';
	result += '</kml>';
	return result;
}

/**
 * @function _convertToMetalink
 * @param {object} myFeatureCollection 
 */
var _convertToMetalink = function(myFeatureCollection) {
	var result = '<metalink version="3.0" xmlns="http://www.metalinker.org/">';
	result += ' <files>';
	myFeatureCollection.features.forEach(function(feature) {
		var productUrl = feature.properties.productUrl;
		var fileName = productUrl.substr(productUrl.lastIndexOf('/'), productUrl.length);
	    result += '  <file name="' + fileName + '">';
		result += '   <resources>';
        result += '    <url type="http">' + productUrl + '</url> ';
		result += '   </resources>'
		result += '  </file>'
	});
    result += ' </files>';
	result += '</metalink>';
	return result;
}

/**
 * Public interface for GeoJsonConverter
 */
module.exports = {
	/*!
	 * Load layer data into GeoJSON
	 * @param layer the layer to load
	 * @param onload the callback to call when all data is loaded
	 */
	load: function(layer, onload) {

		// Create OpenLayers protocol according to its type
		var protocol;
		switch (layer.type) {
			case "GeoRSS":
				protocol = new OpenLayers.Protocol.HTTP({
					url: layer.location,
					format: new OpenLayers.Format.GeoRSS()
				});
				break;
			case "WFS":
				protocol = new OpenLayers.Protocol.WFS({
					url: layer.baseUrl,
					featureType: layer.featureType,
					featureNS: layer.featureNS
				});
				break;
		}

		// If protocol exists, call it to load data
		if (protocol) {
			protocol.read({
				callback: function(resp) {
					if (resp.features) {
						onload(_convertOL(resp.features));
					}
				}
			});
		}
	},

	/*!
	 * Convert GeoJSON features to any format
	 *
	 * @param features the features to convert
	 * @param format the format
	 *
	 * @return the data as a string
	 */
	convert: function(features, format) {
		var f = format.toUpperCase();

		var fc = {
			type: 'FeatureCollection',
			features: features
		};

		switch (f) {
			case "KML":
				// Convert to OpenLayers
				return _convertToKML(fc);
				/*var olFeatures = geoJsonFormat.read(fc);
				var kmlFormat = new OpenLayers.Format.KML();
				return kmlFormat.write(olFeatures);*/
			case "GML":
				var olFeatures = geoJsonFormat.read(fc);
				var gmlFormat = new OpenLayers.Format.GML();
				return gmlFormat.write(olFeatures);
			case "JSON":
			case "GEOJSON":
				return JSON.stringify(fc);
			case "METALINK":
				return _convertToMetalink(fc);
		}
	},

	/*!
	 * Convert a vector layer to GeoJSON
	 * The layer data is converted to GeoJSON
	 *
	 * @param layer the layer to convert
	 *
	 * @return if the function succeeds
	 */
	toGeoJSON: function(layer) {
		if (!layer.data) {
			return false;
		}

		var features;
		switch (layer.type.toUpperCase()) {
			case "KML":
				var kmlFormat = new OpenLayers.Format.KML({
					extractStyles: true,
					extractAttributes: true,
					maxDepth: 0
				});
				features = kmlFormat.read(layer.data);
				break;
			case "GML":
				var gmlFormat = new OpenLayers.Format.GML();
				features = gmlFormat.read(layer.data);
				break;
			case "JSON":
			case "GEOJSON":
				if (typeof layer.data == "string") {
					layer.data = JSON.parse(layer.data);
				}
				layer.type = 'GeoJSON';
				return true;
		}

		if (features && features.length > 0) {
			layer.data = _convertOL(features);
			layer.type = 'GeoJSON';
			return true;
		}

		return false;
	}
};