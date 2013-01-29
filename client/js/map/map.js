/**
  * Map module
  */

define( [ "configuration", "map/openlayers", "map/globweb", "backbone" ], 

// The function to define the map module
function(Configuration, OpenLayersMapEngine, GlobWebMapEngine, Backbone ) {
	
	/**
	 * Private attributes
	 */
	 
	// Reference to the map singleton
	var self = null;
	// The different engines used by the map
	var engines = {
		'2d' : OpenLayersMapEngine, 
		'3d' : GlobWebMapEngine,
	};
	// The current map engine
	var mapEngine = null;
	// The engine layers
	var engineLayers = [];
	// The layer to store the results footprints
	var resultFootprintLayer = null;
	// The feature collection for results
	var resultsFeatureCollection = null;
	// The map DOM element
	var element = null;
	// The current background layer
	var backgroundLayer = null;
	// Max extent of the map
	var maxExtent = [-180,-85,180,85];
	// An object to store all  browse layers 
	var browseLayers = {};
	// To know if map is in geographic or not
	var isGeo = false;

	/**
	 * Compute the extent of a feature
	 */
	var computeExtent = function(feature)
	{
		var isMultiPolygon = feature.geometry.type == "MultiPolygon";
		// Compute the extent from the coordinates
		var coords = isMultiPolygon ? feature.geometry.coordinates[0][0] : feature.geometry.coordinates[0];
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
		feature.bbox = [ minX, minY, maxX, maxY ];
	};
	
	/**
	 * Configure the map engine : set background layer, adjust style, connect events, etc...
	 */
	var configureMapEngine = function(mapConf) {
	
		mapEngine.setBackgroundLayer( backgroundLayer );
		
		for ( var x in mapConf.styles ) {
			if ( mapConf.styles.hasOwnProperty(x) ) {
				var style = mapConf.styles[x];
				if ( style['default'] &&  style['select'] ) {
					mapEngine.addStyle( x, style['default'], style['select'] );
				} else {
					mapEngine.addStyle( x, style );
				}
			}
		}
		
		for ( var i = 0; i < self.layers.length; i++ ) {
			engineLayers[i] = mapEngine.addLayer( self.layers[i] );
		}
		resultFootprintLayer = engineLayers[0];
		
		mapEngine.zoomToExtent( maxExtent );
		
		mapEngine.subscribe("endNavigation", function() {
			self.trigger("endNavigation",self);
		});
		mapEngine.subscribe("startNavigation", function() {
			self.trigger("startNavigation",self);
		});
	};
	
	/**
	 * Create a browse layer for the given feature
	 */
	var createBrowseLayer = function(feature) {
	
		var eo = feature.properties.EarthObservation;
		if (eo.EarthObservationResult && eo.EarthObservationResult.eop_BrowseInformation) {
		
			var eoBrowse = eo.EarthObservationResult.eop_BrowseInformation;
			
			var params = {
				time: eo.gml_beginPosition +"/" + eo.gml_endPosition,
				transparent: true
			};
			
			if ( eoBrowse.eop_type == "wms" ) {
				params.layers = eoBrowse.eop_layer;
				params.styles = "ellipsoid";
			} else if ( eoBrowse.eop_type == "wmts" ) {
				params.layer = eoBrowse.eop_layer;
				params.matrixSet = "WGS84";
			}
			
			var layerDesc = {
				name: feature.id,
				type: eoBrowse.eop_type,
				visible: true,
				baseUrl: eoBrowse.eop_url,
				opacity: Configuration.data.map.browseDisplay.opacity,
				params: params,
				bbox: feature.bbox
			};
			
			return { 
				desc: layerDesc,
				engine: mapEngine.addLayer(layerDesc)
			};
			
		}
		
		return null;
	};
	
	/**
	 * Show a browse layer for the given feature
	 */
	var showBrowseLayer = function(feature) {			
		// Create the WMS if it does not exists
		if (!browseLayers.hasOwnProperty(feature.id)) {
			browseLayers[ feature.id ] = createBrowseLayer(feature);
		}
	};
	
	/**
	 * Hide the browse layer of the given feature
	 */
	var hideBrowseLayer = function(feature) {	
		// Create the WMS if it does not exists
		if (browseLayers.hasOwnProperty(feature.id)) {
			mapEngine.removeLayer( browseLayers[ feature.id ].engine );
			delete browseLayers[ feature.id ];
		}
	};

	/**
	 * Check if layers are compatible
	 */
	var isLayerCompatible = function(layer) {
		switch (layer.type)
		{
			case "Bing":
			case "OSM":
				return !isGeo;
			case "WMTS":
				return Configuration.data.map.projection == layer.projection;
			case "WMS":
				return layer.projection ? Configuration.data.map.projection == layer.projection : true;
			case "GeoJSON":
			case "KML":
			case "GeoRSS":
			case "WFS":
				return true;
			default:
				return false;
		}
	}	
	
	/**
	 * Public interface
	 */
	return {
	
		/**
		 * The background layers that can be used on the map.
		 * Loaded from configuration, this array only stores the 'compatible' background layers
		 */
		backgroundLayers: [],
	
		/**
		 * The layers applied on the map.
		 * Loaded from configuration, this array only stores the 'compatible' layers
		 */
		layers: [],
		
		/**
		 * Initialize module
		 */
		initialize: function(eltId) {
			
			// Keep the this
			self = this;
			
			_.extend(self, Backbone.Events);
	
			element = document.getElementById(eltId);
			
			mapEngine = new engines['2d'](element);			
			
			// Check layers from configuration
			isGeo = Configuration.data.map.projection == "EPSG:4326";
			
			// Build the background layers from the configuration
			var confBackgroundLayers = Configuration.data.map.backgroundLayers;
			for ( var i = 0; i < confBackgroundLayers.length; i++ ) {
				if ( isLayerCompatible( confBackgroundLayers[i] ) ) {
					self.backgroundLayers.push( confBackgroundLayers[i] );
				}
			}
			
			// Build the addtionnal layers from the configuration
			var confLayers = Configuration.data.map.layers;
			for ( var i = 0; i < confLayers.length; i++ ) {
				if ( isLayerCompatible( confLayers[i] ) ) {
					self.layers.push( confLayers[i] );
				}
			}
			
			backgroundLayer = self.backgroundLayers[0];
			configureMapEngine(Configuration.data.map);
		},
				
		/**
		 * Modify the background layer
		 *
		 * @param layer The layer to use as new background
		 */
		setBackgroundLayer: function(layer) {
			// Store background layer
			backgroundLayer = layer;
			// Set the active background
			mapEngine.setBackgroundLayer(layer);
		},
		
		/**
		 * Change visibilty of a layer
		 *
		 * @param layer	The layer
		 * @param vis The new visibility
		 */
		setLayerVisible: function(layer,vis) {
			var i = self.layers.indexOf(layer);
			if ( i >= 0 ) {
				// Store visibilty in configuration data
				self.layers[i].visible = vis;
				// Modify engine layers
				mapEngine.setLayerVisible(engineLayers[i],vis);
			}
		},
		
		/**
		 * Dynamically add a layer to the map
		 *
		 * @param layerDesc	The layer description
		 */
		addLayer: function(layerDesc) {
			engineLayers.push( mapEngine.addLayer(layerDesc) );
			self.layers.push(layerDesc);
			self.trigger('layerAdded',layerDesc);	
		},
	
		/**
		 * Dynamically remove a layer from the map
		 *
		 * @param layerDesc	The layer description
		 */
		removeLayer: function(layerDesc) {
			var index = self.layers.indexOf(layerDesc);
			if ( index >= 0 ) {
				mapEngine.removeLayer( engineLayers[index] );
				engineLayers.splice( index, 1 );
				self.layers.splice( index, 1 );
				self.trigger('layerRemoved',layerDesc);
				return true;
			} else {
				return false;
			}
		},

		/**
		 * Update a feature in a layer
		 *
		 * @param layerDesc	The layer description
		 * @param feature	The feature
		 */
		updateFeature: function(layerDesc,feature) {
			var index = self.layers.indexOf(layerDesc);
			if ( index >= 0 ) {
				mapEngine.updateFeature( engineLayers[index], feature );
				return true;
			} else {
				return false;
			}
		},
		
		zoomIn: function() {
			mapEngine.zoomIn();
		},
		
		zoomOut: function() {
			mapEngine.zoomOut();
		},
		
		zoomToMaxExtent: function() {
			mapEngine.zoomToExtent( maxExtent );
		},
		
		zoomToFeature: function(feature) {
			// Zoom on the product in the carto
			if (!feature.bbox) {
				computeExtent(feature);
			}
			var extent = feature.bbox;
			var width = extent[2] - extent[0];
			var height = extent[3] - extent[1];
			var offsetExtent = [ extent[0] - 2 * width, extent[1] - 2 * height, extent[2] + 2 * width, extent[3] + 2 * height ];
			mapEngine.zoomToExtent( offsetExtent );				
		},
		
		zoomTo: function(extent) {
			mapEngine.zoomToExtent( extent );							
		},
		
		/**
		 * Get current viewport extent
		 * @return an array of 4 number : [west,south,east,north]
		 */
		getViewportExtent: function() {
			return mapEngine.getViewportExtent();
		},
		
		/**
		 * Get the page (?) position from a lonlat
		 */
		getPixelFromLonLat: function(lon,lat) {
			return mapEngine.getPixelFromLonLat(lon,lat);
		},
		
		/**
		 * Get the page position from a lonlat
		 */
		getLonLatFromEvent: function(event) {
			var rect = element.getBoundingClientRect();
			var clientX = event.pageX - rect.left;
			var clientY = event.pageY - rect.top;
			return mapEngine.getLonLatFromPixel(clientX,clientY);
		},
				
		/**
		 * Set results
		 * Called when new results has been received
		 */
		setResults: function(results) {
			// Remove browse browse layers
			for ( var x in browseLayers ) {
				if ( browseLayers.hasOwnProperty(x) ) {
					mapEngine.removeLayer( browseLayers[x].engine );	
				}
			}
			// Cleanup the browse layers
			browseLayers = {};
		
			// Remove all features
			mapEngine.removeAllFeatures( resultFootprintLayer );
			// Add it new
			resultsFeatureCollection = results.attributes;
			// Update the data layer
			self.layers[0].data = resultsFeatureCollection;
			// Process the feature collection
			for ( var i = 0; i < resultsFeatureCollection.features.length; i++ ) {
				if (!resultsFeatureCollection.features[i].bbox)
					computeExtent(resultsFeatureCollection.features[i]);
			}
			mapEngine.addFeatureCollection( resultFootprintLayer, resultsFeatureCollection );
		},
		
		/**
		 * Select the features in the map
		 */
		selectFeatures: function(features) {
			for ( var i=0; i < features.length; i++ ) {
				mapEngine.modifyFeatureStyle(resultFootprintLayer,features[i], "select");
				showBrowseLayer(features[i]);
			}
		},
		
		/**
		 * Unselect the features in the map
		 */
		unselectFeatures: function(features) {
			for ( var i=0; i < features.length; i++ ) {
				mapEngine.modifyFeatureStyle(resultFootprintLayer,features[i], "default");
				hideBrowseLayer(features[i]);
			}
		},

		/**
		 * Switch the map engine
		 */
		switchMapEngine: function(id)
		{
			if (!engines[id]) {
				return false;
			}
			
			if ( mapEngine ) {
				// Retrieve the current viewport extent
				var extent = mapEngine.getViewportExtent();
				
				// Destroy the old map engine
				mapEngine.destroy();
				mapEngine = null;
			}
				
			// Callback called by the map engine when the map engine is initialized
			var initCallback = function(map)
			{
				// Configure the map engine
				configureMapEngine(Configuration.data.map);
				
				// Zoom to previous extent
				if ( extent )
					map.zoomToExtent( extent );
							
				// Display browse
				for ( var x in browseLayers ) {
					if ( browseLayers.hasOwnProperty(x) ) {
						browseLayers[x].engine = mapEngine.addLayer( browseLayers[x].desc );
					}
				}
			};
						
			// Create the new engine and catch any error
			try {
				mapEngine = new engines[id](element);			
			} catch (err) {
				mapEngine = null;
			}
			
			if ( mapEngine ) {
				mapEngine.subscribe("init",initCallback);
			}
			
			return mapEngine != null;
		},
				
		/**
		 * Method to call when the map viewport is resized
		 */
		updateViewportSize: function() {
			if (mapEngine)
				mapEngine.updateSize();
		},
		
		getMapEngine: function() {
			return mapEngine;
		}
	};
});



