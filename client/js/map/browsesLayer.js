/**
  * Browses layer module
  */

define( ["configuration", "map/utils"], 

function( Configuration, MapUtils ) {

function pad2(num) {
    var s = num+"";
    if (s.length < 2) s = "0" + s;
    return s;
}

// Helper function to convert a date to an iso string, only the date part
var toWMTSTime = function(date) {
	return date.getUTCFullYear() + "-" + pad2(date.getUTCMonth()+1) + "-" + pad2(date.getUTCDate()) + "T" + pad2(date.getUTCHours()) + ":" + pad2(date.getUTCMinutes()) + ":" + pad2(date.getUTCSeconds()) + "Z";
};
// Helper sorting functions for:
//  - Browses
var sortByTime = function(a,b) {
	return new Date(a.time) - new Date(b.time);
};
//  - Features
var sortFeatureByDate = function(a,b) {
	return new Date(a.properties.EarthObservation.gml_endPosition) - new Date(b.properties.EarthObservation.gml_endPosition);
}
	
var BrowsesLayer = function(params,mapEngine) {
	this.params = params;
	
	// A map between feature id and internal browse layer
	var browseLayersMap = {};
	// The array of browse layers
	var browseLayers = [];
	
	/**
	 *	Update browse layer index AND update highlighted features z-index
	 */
	this.updateHighlightedIndex = function(highlighted) {

		this.updateBrowseLayersIndex();

		if ( highlighted ) {
			highlighted.sort(sortFeatureByDate);
			for ( var i = 0; i < highlighted.length; i++ ) {
				var id = highlighted[i].id;
				if (browseLayersMap.hasOwnProperty(id)) {
				
					// Get the browse layer structure from the map
					var bl = browseLayersMap[ id ];
					if ( bl ) {
						mapEngine.setLayerIndex( bl.engineLayer, browseLayers.length + i + 100 );
					}
				}
			}
		}
	};

	/**
	 * Update the browser layers indices
	 */
	this.updateBrowseLayersIndex = function() {
		
		// First sort the browse layer
		browseLayers.sort( sortByTime );
		
		// Then modify the browse layer indices
		for ( var i = 0; i < browseLayers.length; i++ ) {
			mapEngine.setLayerIndex( browseLayers[i].engineLayer, i+100 );
		}
	};
	
	/**
	 * Change visibility of browse layers
	 */
	this.setVisible = function(vis) {
		this.params.visible = vis;
		for ( var i = 0; i < browseLayers.length; i++ ) {
			browseLayers[i].params.visible = vis;
			mapEngine.setLayerVisible(browseLayers[i].engineLayer,vis);
		}
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
	this.addBrowse = function(feature,eoBrowse) {
		if (!browseLayersMap.hasOwnProperty(feature.id)) {
			var eo = feature.properties.EarthObservation;
			// Fix NGEO-1031 : remove milliseconds from date
			var begin = Date.fromISOString( eo.gml_beginPosition );
			begin.setUTCMilliseconds(0);
			var end = Date.fromISOString( eo.gml_endPosition );
			end.setUTCMilliseconds(0);
			
			var params = {
				time: toWMTSTime(begin) + "/" + toWMTSTime(end),
				transparent: true
			};
			
			var type = eoBrowse.eop_type;
			if (!type) {
				type = "wmts";
			}
			
			if ( type == "wms" ) {
				params.layers = eoBrowse.eop_layer;
				params.styles = "ellipsoid";
			} else {
				// Default is WMTS
				params.layer = eoBrowse.eop_layer || "TEST_SAR";
				params.matrixSet = "WGS84";
			}
			
			MapUtils.computeExtent(feature);
			var config = {
				name: feature.id,
				type: type,
				visible: this.params.visible,
				baseUrl: eoBrowse.eop_url || eoBrowse.eop_filename,
				opacity: Configuration.get("map.browseDisplay.opacity", 1.0),
				params: params,
				bbox: feature.bbox,
				crossOrigin: Configuration.get("map.browseDisplay.crossOrigin", "anonymous")
			};
			
			var browseLayerDesc = {
				time:  eo.gml_endPosition,
				params: config,
				engineLayer: mapEngine.addLayer(config)
			};
			
			browseLayersMap[feature.id] = browseLayerDesc;
			browseLayers.push( browseLayerDesc );
			
			this.updateBrowseLayersIndex();
		}
	};

	/**
	 * Remove browse from layer
	 */
	this.removeBrowse = function(id)  {
		// Create the WMS if it does not exists
		if (browseLayersMap.hasOwnProperty(id)) {
		
			// Get the browse layer structure from the map
			var bl = browseLayersMap[ id ];
			
			// Delete it
			delete browseLayersMap[ id ];
			
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
};

return BrowsesLayer;

});



