/**
 * Browses layer module
 */

var Configuration = require('configuration');
var MapUtils = require('map/utils');

// Helper function to format the numbers in range [0,9] by adding "0" before
var pad2 = function(num) {
    var s = num + "";
    if (s.length < 2) s = "0" + s;
    return s;
}

// Helper function to convert a date to an iso string, only the date part
var toWMTSTime = function(date) {
	return date.getUTCFullYear() + "-" + pad2(date.getUTCMonth()+1) + "-" + pad2(date.getUTCDate()) + "T" + pad2(date.getUTCHours()) + ":" + pad2(date.getUTCMinutes()) + ":" + pad2(date.getUTCSeconds()) + "Z";
};

/**
 *	Container of browses
 */
var BrowsesLayer = function(params, mapEngine) {
	this.params = params;
	
	// A map between feature id and internal browse layer
	var browseLayersMap = {};
	// The array of browse layers
	var browseLayers = [];
	
	/**
	 * Change visibility of browse layers
	 */
	this.setVisible = function(vis) {
		this.params.visible = vis;
		for ( var i = 0; i < browseLayers.length; i++ ) {
			browseLayers[i].params.visible = vis;
			mapEngine.setLayerVisible(browseLayers[i].engineLayer,vis);
		}

		// HACK: Load Map dynamically to avoid circular dependency
		var Map = require('map/map');
		Map.trigger("visibility:changed", this);
	};
	
	/**
	 * Clear the  browse layers
	 */
	this.clear = function() {
		for ( var i = 0; i < browseLayers.length; i++ ) {
			mapEngine.removeLayer(browseLayers[i].engineLayer);
		}
		browseLayersMap = {};
		browseLayers = [];
	};
	
	/**
	 * Add features to layer
	 */
	this.addBrowse = function(feature, browseUrl) {
		if (!browseLayersMap.hasOwnProperty(browseUrl)) {
			// Set browseUrl in map to mark the creation of browse to avoid double creating of
			// browse provoked by highlight event as well..
			browseLayersMap[browseUrl] = browseUrl;
			
			var layerDesc = MapUtils.createWmsLayerFromUrl(browseUrl);
			if ( !layerDesc.params.time ) {
				// Take the time from feature if no time has been defined in url
				// Fix NGEO-1031 : remove milliseconds from date
				var begin = Date.fromISOString(Configuration.getMappedProperty( feature, "start" ));
				begin.setUTCMilliseconds(0);
				var end = Date.fromISOString(Configuration.getMappedProperty( feature, "stop" ));
				end.setUTCMilliseconds(0);
				layerDesc.params.time = toWMTSTime(begin) + "/" + toWMTSTime(end);
			}

			if ( layerDesc.type.toUpperCase() == "WMTS" && !layerDesc.params.matrixSet ) {
				// If no matrixSet is defined, take ones from configuration
				var mapProjection = Configuration.get('map.projection', "EPSG:4326");
				var wmtsMap = Configuration.get('browseDisplay.wmtsParameters', {
					"EPSG:4326": {
						"params" : {
							"matrixSet": "WGS84"
						}
					},
					"EPSG:3857": {
						"params": {
							"matrixSet": "g"
						}
					}
				});
				layerDesc.params.matrixSet = wmtsMap[mapProjection].params.matrixSet;
			}
			MapUtils.computeExtent(feature);

			// Update some WEBC intrinsic values which couldn't be extracted from browse url
			_.merge(layerDesc, {
				name: browseUrl,
				visible: this.params.visible,
				opacity: Configuration.get("map.browseDisplay.opacity", 1.0),
				bbox: feature.bbox,
				crossOrigin: Configuration.get("map.browseDisplay.crossOrigin", "anonymous")
			});
			layerDesc.params.transparent = true;

			var browseLayerDesc = {
				time:  Configuration.getMappedProperty( feature, "stop" ),
				params: layerDesc.params,
				engineLayer: mapEngine.addLayer(layerDesc)
			};

			// Finally set the real browseLayerDesc in browseLayerMap
			browseLayersMap[browseUrl] = browseLayerDesc;
			browseLayers.push( browseLayerDesc );
		}
	};

	/**
	 * Remove browse from layer
	 *
	 * @param id
	 *		Browse url
	 */
	this.removeBrowse = function(browseUrl)  {
		// Remove the WMS only if it does exists
		if (browseLayersMap.hasOwnProperty(browseUrl)) {
		
			// Get the browse layer structure from the map
			var bl = browseLayersMap[ browseUrl ];
			
			// Delete it
			delete browseLayersMap[ browseUrl ];
			
			// Remove browse layer from the current engine
			mapEngine.removeLayer(bl.engineLayer);
			
			// Remove from array
			browseLayers.splice( browseLayers.indexOf(bl), 1 );
		}
	};
	
	this.isEmpty = function() {
		return browseLayers.length == 0;
	};
	
	/**
	 * Change engine
	 */
	this.changeEngine = function(me) {
		mapEngine = me;
		for ( var i = 0; i < browseLayers.length; i++ ) {
			browseLayers[i].engineLayer = mapEngine.addLayer( browseLayers[i].params );
		}
	};

	/**
	 *	Browses getter
	 */
	this.getBrowses = function() {
		return browseLayers;
	}
};

module.exports = BrowsesLayer;



