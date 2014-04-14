/**
 * GeoJsonConverter based on OpenLayers
 */

define( [ "externs/OpenLayers.ngeo" ], function() {
 
// Use to convert to GeoJSON 
var geoJsonFormat = new OpenLayers.Format.GeoJSON();

/*!
 * Convert a OpenLayer.Feature object to GeoJSON
 * @return a GeoJSON feature collection
 */
var _convertOL = function(features) {
	if (features && features.length > 0) {
		var json = geoJsonFormat.write(features);
		return JSON.parse( json );
	}
};

/**
 * Public interface for GeoJsonConverter
 */
return {
	/*!
	 * Load layer data into GeoJSON
	 * @param layer the layer to load
	 * @param onload the callback to call when all data is loaded
	 */
	load: function(layer,onload) {

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
		if ( protocol ) {
			protocol.read({
					callback: function(resp) {
						if ( resp.features ) {
							onload( _convertOL(resp.features) );
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
	convert: function(features,format) {
		var f = format.toUpperCase();
		
		var fc = {
			type: 'FeatureCollection',
			features: features
		};
		
		switch (f) {
			case "KML":
				// Convert to OpenLayers
				var olFeatures = geoJsonFormat.read(fc);
				var kmlFormat = new OpenLayers.Format.KML();
				return kmlFormat.write(olFeatures);
				break;
			case "GML":
				var olFeatures = geoJsonFormat.read(fc);
				var gmlFormat = new OpenLayers.Format.GML();
				return gmlFormat.write(olFeatures);
				break;
			case "JSON":
			case "GEOJSON":
				return JSON.stringify(fc);
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
				if ( typeof layer.data == "string" ) {
					layer.data = JSON.parse(layer.data);
				}
				layer.type = 'GeoJSON';
				return true;
		}
		
		if ( features && features.length > 0 ) {
			layer.data = _convertOL(features);
			layer.type = 'GeoJSON';
			return true;
		}
		
		return false;
	}
};

});
