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
var convert = function(features) {
	if (features && features.length > 0) {
		var json = geoJsonFormat.write(features);
		return JSON.parse( json );
	}
};

/*!
 * Load layer data into GeoJSON
 * @param layer the layer to load
 * @param cb the callback to call when all data is loaded
 */
var load = function(layer,cb) {

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
						cb( convert(resp.features) );
					}
				}
			});
	}
};

/**
 * Public interface for GeoJsonConverter
 */
return {
	load: load,
	convert: convert
};

});
