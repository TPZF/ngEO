/**
  * Browses layer module
  */

define( ["configuration"], 

function( Configuration ) {

var BrowsesLayer = function(params,mapEngine) {
	this.params = params;
	
	// An object to store all internal layers
	var browseLayers = {};
	
	/**
	 * Add a browse for the given feature
	 */
	var addBrowse = function(feature,vis) {
	
		if (!browseLayers.hasOwnProperty(feature.id)) {
	
			var eo = feature.properties.EarthObservation;
			if (!eo || !eo.EarthObservationResult || !eo.EarthObservationResult.eop_BrowseInformation) return;
			var eoBrowse = eo.EarthObservationResult.eop_BrowseInformation;
			if (eoBrowse) {
							
				var params = {
					time: eo.gml_beginPosition +"/" + eo.gml_endPosition,
					transparent: true
				};
				
				var type = eoBrowse.eop_type;
				if (!type) {
					type = "wmts";
				}
				
				if ( type == "wms" ) {
					params.layers = eoBrowse.eop_layer;
					params.styles = "ellipsoid";
				} else if ( type == "wmts" ) {
					params.layer = eoBrowse.eop_layer || "TEST_SAR";
					params.matrixSet = "WGS84";
				}
				
				var config = {
					name: feature.id,
					type: type,
					visible: vis,
					baseUrl: eoBrowse.eop_url || eoBrowse.eop_filename,
					opacity: Configuration.data.map.browseDisplay.opacity,
					params: params,
					bbox: feature.bbox
				};
				
				browseLayers[feature.id] = {
					params: config,
					engineLayer: mapEngine.addLayer(config)
				};
			}
		}
	};
	
	/**
	 * Remove the browse layer of the given feature
	 */
	var removeBrowse = function(feature) {	
		// Create the WMS if it does not exists
		if (browseLayers.hasOwnProperty(feature.id)) {
			mapEngine.removeLayer(browseLayers[ feature.id ].engineLayer);
			delete browseLayers[ feature.id ];
		}
	};

	/**
	 * Change visibility of browse layers
	 */
	this.setVisible = function(vis) {
		this.params.visible = vis;
		for ( var x in browseLayers ) {
			if ( browseLayers.hasOwnProperty(x) ) {
				browseLayers[x].params.visible = vis;
				mapEngine.setLayerVisible(browseLayers[x].engineLayer,vis);
			}
		}
	};
	this.clear = function() {
		for ( var x in browseLayers ) {
			if ( browseLayers.hasOwnProperty(x) ) {
				mapEngine.removeLayer(browseLayers[x].engineLayer);
			}
		}
		browseLayers = {};
	};
	this.addFeatures = function(features) {
		for ( var i = 0; i < features.length; i++ ) {
			addBrowse( features[i], this.params.visible );
		}
	};
	this.removeFeatures = function(features,style)  {
		for ( var i = 0; i < features.length; i++ ) {
			removeBrowse(features[i]);
		}
	};
	this.changeEngine = function(me) {
		mapEngine = me;
		for ( var x in browseLayers ) {
			if ( browseLayers.hasOwnProperty(x) ) {
				browseLayers[x].engineLayer = mapEngine.addLayer( browseLayers[x].params );
			}
		}
	};
};

return BrowsesLayer;

});



