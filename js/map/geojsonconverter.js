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
	 * Convert a vector layer to GeoJSON
	 * The layer in parameter is converted to GeoJSON
	 *
	 * @param layer the layer to convert
	 *
	 * @return if the function succeeds
	 */
	convert: function(layer) {
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
				layer.data = JSON.parse(layer.data);
				layer.type = 'GeoJSON';
				return true;
		}
		
		if ( features ) {
			layer.data = _convertOL(features);
			layer.type = 'GeoJSON';
			return true;
		}
		
		return false;
	}
};

});
