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
	// The current selected features
	var selectedFeatures = [];
	// The index when using stack selection
	var stackSelectionIndex = -1;
	// Max extent of the map
	var maxExtent = [-180,-85,180,85];
	// An object to store all  browse layers 
	var browseLayers = {};
	// To know if map is in geographic or not
	var isGeo = false;

	/**
	 * Private methods
	 */
	 
	/**
	 * Check if the point is inside the given ring
	 */
	var pointInRing = function ( point, ring )
	{
		var nvert = ring.length;
		if ( ring[0][0] == ring[nvert-1][0] && ring[0][1] == ring[nvert-1][1] )
		{
			nvert--;
		}
		var inPoly = false;
		
		var j = nvert-1;
		for (var i = 0; i < nvert; j = i++)
		{
			if ( ((ring[i][1] > point[1]) != (ring[j][1] > point[1])) &&
			 (point[0] < (ring[j][0] - ring[i][0]) * (point[1] - ring[i][1]) / (ring[j][1] - ring[i][1]) + ring[i][0]) )
			{
				inPoly = !inPoly;
			}
		}
		return inPoly;
	}
	
	/**
	 * Get the feature from a point : test if the point is inside the footprint
	 */
	var getFeaturesFromPoint = function(lonlat) {
	
		var features = [];
		
		for ( var i = 0; i < resultsFeatureCollection.features.length; i++ ) {
			var feature = resultsFeatureCollection.features[i];
			var isMultiPolygon = feature.geometry.type == "MultiPolygon";
			if ( pointInRing(lonlat,isMultiPolygon ? feature.geometry.coordinates[0][0] : feature.geometry.coordinates[0]) ) {
				features.push( feature );
			}
		}
				
		return features;
	};
	
	 /** 
	  *	Test if a new selection is equal to the previous selection
	  */
	var isSelectionEqual = function( newSelection ) {
		if ( selectedFeatures.length == newSelection.length) {
			
			for ( var i=0; i < selectedFeatures.length; i++ ) {
				if ( selectedFeatures[i] != newSelection[i] )
					return false;
			}
			
			return true;
		}
		else
			return false;
	};

	/**
	 * Call when the user click on the map
	 */
	var mapClickHandler = function(pageX,pageY)
	{
		var position = $('#mapContainer').offset();
		var clientX = pageX - position.left;
		var clientY = pageY - position.top;
				
		var lonlat = mapEngine.getLonLatFromPixel(clientX,clientY);
		if ( lonlat ) {
			var features = getFeaturesFromPoint(lonlat);
			if ( isSelectionEqual(features) ) {
			
				// Reset previous selected feature
				if ( stackSelectionIndex == -1 ) {
					for ( var i=0; i < selectedFeatures.length; i++ ) {
						mapEngine.modifyFeatureStyle(resultFootprintLayer,selectedFeatures[i], "default");
					}		
				} else {
					mapEngine.modifyFeatureStyle(resultFootprintLayer,selectedFeatures[stackSelectionIndex], "default" );
				}
				
				stackSelectionIndex++;
				
				// Select individual feature
				if ( stackSelectionIndex == selectedFeatures.length ) {
					for ( var i=0; i < selectedFeatures.length; i++ ) {
						mapEngine.modifyFeatureStyle(resultFootprintLayer,selectedFeatures[i], "select" );
					}
					stackSelectionIndex = -1;
					self.trigger("featuresSelected",selectedFeatures,{ x:  pageX, y: pageY });
				} else {
					mapEngine.modifyFeatureStyle(resultFootprintLayer,selectedFeatures[stackSelectionIndex], "select" );
					self.trigger("featuresSelected", [ selectedFeatures[stackSelectionIndex] ],{ x:  pageX, y: pageY });
				}
				
			} else {
			
				// Remove selected style for previous selection
				for ( var i=0; i < selectedFeatures.length; i++ ) {
					mapEngine.modifyFeatureStyle(resultFootprintLayer,selectedFeatures[i],"default");
				}
				
				// Add style for new selection
				for ( var i=0; i < features.length; i++ ) {
					mapEngine.modifyFeatureStyle(resultFootprintLayer,features[i],"select");
				}
				
				selectedFeatures = features;
				stackSelectionIndex = -1;
				
				self.trigger("featuresSelected",selectedFeatures,{ x:  pageX, y: pageY });
			}
		}
	};
	


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
	
		// Click for selection
		var prevX, prevY;
		var prevTime;
		mapEngine.subscribe( 'mousedown',function(evt){
			prevX = evt.pageX;
			prevY = evt.pageY;
			prevTime = Date.now();
		}, true);
		mapEngine.subscribe( 'mouseup', function(evt) {
			var dx = evt.pageX - prevX;
			var dy = evt.pageY - prevY;
			var dt = Date.now() - prevTime;
			if ( dx <= 1 && dy <= 1 && dt < 1000 ) {
				mapClickHandler(evt.pageX,evt.pageY);
			}
		}, true);
	};

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
			
			// Manage window resize
			$(window).resize( function() {
				self.updateViewportSize();
			});
			
			
			// Check layers from configuration
			isGeo = Configuration.data.map.projection == "EPSG:4326";
			
			var confBackgroundLayers = Configuration.data.map.backgroundLayers;
			for ( var i = 0; i < confBackgroundLayers.length; i++ ) {
				if ( isLayerCompatible( confBackgroundLayers[i] ) ) {
					self.backgroundLayers.push( confBackgroundLayers[i] );
				}
			}
			
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
		 * @param i	The layer index
		 * @param vis The new visibility
		 */
		setLayerVisible: function(i,vis) {
			// Store visibilty in configuration data
			Configuration.data.map.layers[i].visible = vis;
			// Modify engine layers
			mapEngine.setLayerVisible(engineLayers[i],vis);
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
			if (!feature.bbox)
				computeExtent(feature);
			var extent = feature.bbox;
			var width = extent[2] - extent[0];
			var height = extent[3] - extent[1];
			var offsetExtent = [ extent[0] - 2 * width, extent[1] - 2 * height, extent[2] + 2 * width, extent[3] + 2 * height ];
			mapEngine.zoomToExtent( offsetExtent );				
		},
		
		zoomTo: function(extent) {
			mapEngine.zoomToExtent( extent );							
		},
		
		getViewportExtent: function() {
			return mapEngine.getViewportExtent();
		},
		
		/**
		 * Set results
		 * Called when new results has been received
		 */
		setResults: function(results) {
			// Remove browse browse layers
			for ( var x in browseLayers ) {
				if ( browseLayers.hasOwnProperty(x) ) {
					mapEngine.removeLayer( browseLayers[x] );	
				}
			}
			// Cleanup the browse layers
			browseLayers = {};
		
			// Remove all features
			mapEngine.removeAllFeatures( resultFootprintLayer );
			// Add it new
			resultsFeatureCollection = results.attributes;
			mapEngine.addFeatureCollection( resultFootprintLayer, resultsFeatureCollection );
		},

		/**
		 * Display the browse
		 */
		setDisplayBrowse: function(value,features) {
			for ( var i = 0; i < features.length; i++ ) {
				var feature = features[i];
				if (!feature.bbox)
					computeExtent(feature);
					
				// Create the WMS if it does not exists
				if (!browseLayers.hasOwnProperty(feature.id)) {
					var eo = feature.properties.EarthObservation;
					var layerDesc = {
						name: feature.id,
						type: "WMS",
						visible: value,
						baseUrl: "/wms2eos/servlets/wms",
						opacity: Configuration.data.map.browseDisplay.opacity,
						params: { layers: feature.properties.browseLayer,
							time: eo.gml_beginPosition +"/" + eo.gml_endPosition,
							version: "1.1.1",
							transparent: true,
							styles: "ellipsoid"
						},
						bbox: feature.bbox
					};
					browseLayers[ feature.id ] = mapEngine.addLayer(layerDesc);			
				}
				
				// Modify browse layer visibility
				var layer = browseLayers[ feature.id ];
				mapEngine.setLayerVisible(layer,value);
			}
		},
		
			
		/**
		 * Switch the map engine
		 */
		switchMapEngine: function(id)
		{
			if ( mapEngine ) {
				// Retrieve the current viewport extent
				var extent = mapEngine.getViewportExtent();
				
				// Destroy the old map engine
				mapEngine.destroy();
				mapEngine = null;
			}
			
			if (!engines[id]) {
				return false;
			}
				
			// Callback called by the map engine when the map engine is initialized
			var initCallback = function(map)
			{
				// Configure the map engine
				configureMapEngine(Configuration.data.map);
				
				// Zoom to previous extent
				if ( extent )
					map.zoomToExtent( extent );
				
				// Display footprints if any
				if ( resultsFeatureCollection.features.length > 0 ) {
					mapEngine.addFeatureCollection( resultFootprintLayer, resultsFeatureCollection );
				}
				
				// TODO : manage browse
			};
						
			// Create the new engine and catch any error
			try {
				mapEngine = new engines[id](element);			
			} catch (err) {
				mapEngine = null;
			}
			
			mapEngine.subscribe("init",initCallback);
			
			return mapEngine != null;
		},
				
		/**
		 * Method to call when the map viewport is resized
		 */
		updateViewportSize: function() {
			if (mapEngine)
				mapEngine.updateSize();
		},
	};
});



