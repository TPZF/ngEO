/**
  * Map module
  */

define( [ "configuration", "search/model/searchResults", "map/openlayers", "map/globweb", "backbone" ], 

// The function to define the map module
function(Configuration, SearchResults, OpenLayersMapEngine, GlobWebMapEngine ) {
	
	/**
	 * Private attributes
	 */
	var self = null;
	var engines = {
		'2d' : OpenLayersMapEngine, 
		'3d' : GlobWebMapEngine,
	};
	var mapEngine = null;
	var engineLayers = [];
	var resultFootprintLayer = null;
	var element = null;
	var backgroundLayer = null;
	var selectedFeature = null;
	var	popup = null;
	var maxExtent = [-180,-85,180,85];
	var wmsBrowse = {
	};

	/**
	 * Private methods
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
	 * Navigation start handler
	 */
	var startNavigationHandler = function()
	{
		if ( popup ) {					
			popup.popup( "close" );
		}
	};
	
	/**
	 * Get a feature from a point : test if the point is inside the footprint
	 */
	var getFeatureFromPoint = function(lonlat) {
		
		for ( var i = 0; i < SearchResults.get('features').length; i++ ) {
			var feature = SearchResults.get('features')[i];
			if ( pointInRing(lonlat,feature.geometry.coordinates[0]) ) {
				return feature;
			}
		}
				
		return null;
	};

	/**
	 * Clear the current selection
	 */
	var clearSelection = function() {
		if ( selectedFeature ) {
			mapEngine.modifyFeatureStyle(resultFootprintLayer,selectedFeature,"default");
			selectedFeature = null;
		}
	};

	
	/**
	 * Select feature
	 */
	var selectFeature = function(feature)  {
		if ( feature != selectedFeature ) {
			
			clearSelection();
			
			mapEngine.modifyFeatureStyle(resultFootprintLayer,feature,"select");
			selectedFeature = feature;
		}
	};
	

	/**
	 * Call when the user click on the map
	 */
	var mapClickHandler = function(pageX,pageY)
	{
		var position = $('#mapContainer').offset();
		var clientX = pageX - position.left;
		var clientY = pageY - position.top;
		
		clearSelection();
		
		var lonlat = mapEngine.getLonLatFromPixel(clientX,clientY);
		if ( lonlat ) {
			var feature = getFeatureFromPoint(lonlat);
			if ( feature )
			{
				selectFeature(feature);
				
				if (!popup)
				{
					popup = $('<div data-role="popup" id="popupBasic"><p>This is a completely basic popup, no options set.<p></div>').appendTo('#mapContainer');
					popup.popup();
				}
				popup.popup('open', { x:  pageX, y: pageY });
			}
		}
	};
	


	/**
	 * Compute the extent of a feature
	 */
	var computeExtent = function(feature)
	{
		// Compute the extent from the coordinates
		var coords = feature.geometry.coordinates[0];
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
	 * Update results
	 */
	var updateResults = function() {
	
		mapEngine.removeAllFeatures( resultFootprintLayer );
		mapEngine.addFeatureCollection( resultFootprintLayer, SearchResults.attributes );

	};

	/**
	 * Display the browse
	 */
	var displayBrowse = function(value,features) {
		for ( var i = 0; i < features.length; i++ ) {
			var feature = features[i];
			if (!wmsBrowse.hasOwnProperty(feature.id)) {
				var eo = feature.properties.EarthObservation;
				var layerDesc = {
					name: feature.id,
					type: "WMS",
					visible: value,
					baseUrl: "/wms2eos/servlets/wms",
					params: { layers: feature.properties.browseLayer,
						time: eo.gml_beginPosition +"/" + eo.gml_endPosition,
						version: "1.1.1",
						transparent: true,
						styles: "ellipsoid"
					}
				};
				wmsBrowse[ feature.id ] = mapEngine.addLayer(layerDesc);			
			}
			var layer = wmsBrowse[ feature.id ];
			mapEngine.setLayerVisible(value);
		}
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
		
		for ( var i = 0; i < mapConf.layers.length; i++ ) {
			engineLayers[i] = mapEngine.addLayer( mapConf.layers[i] );
		}
		resultFootprintLayer = engineLayers[0];
		
		mapEngine.zoomToExtent( maxExtent );
		
		mapEngine.subscribe("endNavigation", function() {
			self.trigger("endNavigation",self);
		});
		
		mapEngine.subscribe("startNavigation",startNavigationHandler);
	
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

	
	/**
	 * Public interface
	 */
	return {
		
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
			
			backgroundLayer = Configuration.data.map.backgroundLayers[0];
			configureMapEngine(Configuration.data.map);
			
			SearchResults.on('change',updateResults);
			SearchResults.on('displayBrowse',displayBrowse);
			SearchResults.on('zoomToProductExtent',self.zoomToFeature);
		},
		
		setBackgroundLayer: function(layer) {
			// Store background layer
			backgroundLayer = layer;
			// Set the active background
			mapEngine.setBackgroundLayer(layer);
		},
		
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
				// Zoom to previous extent
				if ( extent )
					map.zoomToExtent( extent );
					
				// Configure it
				configureMapEngine(Configuration.data.map);
				
				mapEngine.addFeatureCollection( resultFootprintLayer, SearchResults.attributes );
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
		 * Method called when the map viewport is resized
		 */
		updateViewportSize: function() {
			if (mapEngine)
				mapEngine.updateSize();
		},
	};
});



