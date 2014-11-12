/**
  * Browses layer module
  */

define( ["configuration"], 

function( Configuration ) {

function pad2(num) {
    var s = num+"";
    if (s.length < 2) s = "0" + s;
    return s;
}

// Helper function to convert a date to an iso string, only the date part
var toWMTSTime = function(date) {
	return date.getUTCFullYear() + "-" + pad2(date.getUTCMonth()+1) + "-" + pad2(date.getUTCDate()) + "T" + pad2(date.getUTCHours()) + ":" + pad2(date.getUTCMinutes()) + ":" + pad2(date.getUTCSeconds()) + "Z";
};
var sortByTime = function(a,b) {
			if ( a.time == b.time ) return 0;
			if ( a.time < b.time ) return -1; else return 1;
		};
		
var BrowsesLayer = function(params,mapEngine) {
	this.params = params;
	
	// A map between feature id and internal browse layer
	var browseLayersMap = {};
	// The array of browse layers
	var browseLayers = [];
	
	
	/**
	 * Update the browser layers indices
	 */
	var updateBroweLayersIndex = function() {
	
		// First sort the browe layer
		browseLayers.sort( sortByTime );
		
		// Then modify the browe layer indices
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
			
			var config = {
				name: feature.id,
				type: type,
				visible: this.params.visible,
				baseUrl: eoBrowse.eop_url || eoBrowse.eop_filename,
				opacity: Configuration.data.map.browseDisplay.opacity,
				params: params,
				bbox: feature.bbox
			};
			
			var browseLayerDesc = {
				time:  eo.gml_endPosition,
				params: config,
				engineLayer: mapEngine.addLayer(config)
			};
			
			browseLayersMap[feature.id] = browseLayerDesc;
			browseLayers.push( browseLayerDesc );
			
			updateBroweLayersIndex();
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



