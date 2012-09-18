/**
  * Map module
  */


define( [ "ngeo.openlayers", "ngeo.globweb" ], 

// The function to define the map module
function(OpenLayersMapEngine, GlobWebMapEngine) {
	
	/**
	 * Private attributes
	 */
	var self = null;
	var engines = [ 'openlayers', 'globweb' ];
	var currentEngineIndex = 0;
	var mapEngine = null;
	var element = null;
	var selectedProduct = null;
	var visualizedProducts = [];
	var	popup = null;
	var resultStyle = {
		strokeColor: '#ff0000',
		strokeWidth: 1
	};
	var shopcartStyle = {
			strokeColor: '#00ff00',
			strokeWidth: 1
		};
	var selectedStyle = {
			strokeColor: '#0000ff',
			strokeWidth: 1
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
			$(popup).dialog( "close" );
		}
	}
	
	/**
	 * Get the product from a point : test if the point is inside the product footprint
	 */
	var getProductFromPoint = function(lonlat) {
		
		for ( var i = 0; i < visualizedProducts.length; i++ ) {
			var product = visualizedProducts[i];
			if ( pointInRing(lonlat,product.geometry.coordinates[0]) ) {
				return product;
			}
		}
				
		return null;
	};

	/**
	 * Clear the current selection
	 */
	var clearSelection = function() {
		if ( selectedProduct ) {
			map.modifyProductStyle( selectedProduct, selectedProduct.previousStyle );
			selectedProduct.style = selectedProduct.previousStyle;
			selectedProduct = null;
		}
	};

	
	/**
	 * Select product
	 */
	var selectProduct = function(product)  {
		if ( product != selectedProduct ) {
			
			clearSelection();
			
			map.modifyProductStyle( product, 'selected' );
			product.previousStyle = product.style;
			product.style = 'selected';
			selectedProduct = product;
		}
	};
	

	/**
	 * Call when the user click on the map
	 */
	var mapClickHandler = function(evt)
	{
		var clientX, clientY, pageX, pageY;
		var position = $("#map").offset();
		if ( evt.pageX ) {
			if ( !evt.originalEvent.ctrlKey )
				return;
			clientX = evt.pageX - position.left;
			clientY = evt.pageY - position.top;
			pageX = evt.pageX;
			pageY = evt.pageY;
		} else {
			if ( !evt.getCtrlKey() )
				return;
			clientX = evt.getClientX();
			clientY = evt.getClientY();
			pageX = clientX + position.left;
			pageY = clientY + position.top;
		}
		var lonlat = map.getLonLatFromPixel(clientX,clientY);
		
		clearSelection();
		
		// If we are on map, select the product below the mouse
		if ( lonlat) {
						
			if ( !popup ) {
				popup = document.createElement('div');
				popup.id = "cartoPopup";
				$("#map").append(popup);
							
				$(popup).dialog({ autoOpen: false, resizable: false });
			}
			
			var jPopup = $(popup);
			
			var product = getProductFromPoint(lonlat);
			if ( product ) {
				
				selectProduct(product);
				
            	var content = '<p> <b>Name : </b>' + product.name + '</p>'
            			+ '<p> <b>Status : </b>' + product.status + '</p>'
            			+ '<p> <b>Acquisistion date : </b>' + product.date + '</p>'
            			+ '<p> <b>Orbit : </b>' + product.orbit + '</p>'
    					+ '<p> <b>Pass : </b>' + product.pass + '</p>'
    					+ '<br>'
    					+ '<div id="popup-toolbar"></div>';
            	          	    			
            	jPopup.html(content);
            	
               	// Build the toolbar
            	var toolbar = productToolbarFactory.create( jPopup.find("#popup-toolbar").get(0) );
            	toolbar.productSelected( product );
               	popup.toolbar = toolbar;
            	
               	jPopup.dialog( "option", "title", "Selected product" );
               	jPopup.dialog( "option", "position", [pageX - jPopup.outerWidth() / 2, pageY - jPopup.outerHeight() / 2 ] );
               	jPopup.dialog( "option", "width", 'auto' );
               	jPopup.dialog( "open" );
				
				eocat.Events.trigger('product.selected', product, self );
            					
			} else {
				jPopup.dialog( "close" );
			}
		}
	};
	


	/**
	 * Compute the extent of a product
	 */
	var computeExtent = function(product)
	{
		// Compute the extent from the coordinates
		var coords = product.geometry.coordinates[0];
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
		product.extent = [ minX, minY, maxX, maxY ];
	};


	/**
	 * Visualize some products
	 */
	var visualizeResults = function( products ) {
		
		if ( selectedProduct && selectedProduct.previousStyle === "results") {
			clearSelection();
		}
		
		// Clear the product in the map engine, except for product in shopcart
		var vizProducts = [];
		for ( var i = 0; i < visualizedProducts.length; i++ ) {
			var product = visualizedProducts[i];	
			if ( product.style === "results" ) {
				map.removeProduct( product );
			} else {
				vizProducts.push( product );
			}
		}
				
		if ( products ) {
			// Add the product to the map, each map engine will render the product according to its capabilites
			for ( var i = 0; i < products.length; i++ ) {
				var product = products[i];	
				computeExtent(product);
				map.addProduct(product,'results');
				product.style = 'results';
				vizProducts.push( product );
			}
		}
		
		visualizedProducts = vizProducts;
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
			
			element = document.getElementById(eltId);
			
			// Default is OpenLayers ( can be stored in a session? )
			mapEngine = new OpenLayersMapEngine(element);
			mapEngine.setStyleMap( { 'results': resultStyle, 'shopcart': shopcartStyle, 'selected': selectedStyle } );
			
/*			map.subscribe("startNavigation",startNavigationHandler);
			map.subscribe("click",mapClickHandler);
			map.subscribe("endNavigation", function() {
				eocat.Events.trigger("map.endNavigation",map);
			});
			
			// Add a callback on eocat search success and error
			eocat.Events.bind("search.success", visualizeResults);
			eocat.Events.bind("search.error", visualizeResults);
			
			// Add callbacks when the shopcart is modified
			eocat.Events.bind("shopcart.productAdded", function(product) {
				if (product.style) {
					
					if ( product == selectedProduct ) {
						product.previousStyle = 'shopcart';	
					} else {
						map.modifyProductStyle(product,'shopcart');
						product.style = 'shopcart';	
					}
					
				} else {
					
					map.addProduct(product,'shopcart');
					visualizedProducts.push( product );
					product.style = 'shopcart';
					product.shopcartOnly = true;
					
				}
			});
			eocat.Events.bind("shopcart.productRemoved", function(product) {
				if (product.shopcartOnly) {
					map.removeProduct(product);
					visualizedProducts.splice( visualizedProducts.indexOf(product), 1 );
				} else {
					if ( product == selectedProduct ) {
						product.previousStyle = 'results';					
					} else {
						map.modifyProductStyle(product,'results');
						product.style = 'results';
					} 
				}
			});
			
			// Add a callback when the quicklook visibility of a product is changed
			eocat.Events.bind('product.quicklookChanged', function(product) {
				if ( product.quicklookVisible )
					map.showQuicklook( product );
				else
					map.hideQuicklook( product );
			});
				
			// Add a callback when a product is selected somewhere in the application
			eocat.Events.bind('product.selected', function(product,origin) {
				
				if ( origin == self )
					return;
				
				self.zoomTo(product);
				
				selectProduct(product);
			});*/
			
		},
		
		zoomIn: function() {
			mapEngine.zoomIn();
		},
		
		zoomOut: function() {
			mapEngine.zoomOut();
		},
		
		zoomToMaxExtent: function() {
			mapEngine.zoomToExtent( [-180,-85,180,85] );
		},
		
		zoomTo: function(product) {
			// Zoom on the product in the carto
			if (!product.extent)
				computeExtent(product);
			var extent = product.extent;
			var width = extent[2] - extent[0];
			var height = extent[3] - extent[1];
			var offsetExtent = [ extent[0] - 2 * width, extent[1] - 2 * height, extent[2] + 2 * width, extent[3] + 2 * height ];
			mapEngine.zoomToExtent( offsetExtent );				
		},
				

		/**
		 * Switch the map engine
		 */
		switchMapEngine: function()
		{	
			// Retrieve the current viewport extent
			var extent = mapEngine.getViewportExtent();
			
			// Destroy the old map engine
			mapEngine.destroy();
			
			// Callback called by the map engine when the map engine is initialized
			/*var initCallback = function(map)
			{
				// Zoom to previous extent
				if ( extent )
					map.zoomToExtent( extent );
				
				if ( visualizedProducts )	{	
					// Add the result products to the map to visualize them
					for (var i=0; i < visualizedProducts.length; i++ ) {
						var product = visualizedProducts[i];
						map.addProduct(product, product.style );
						if ( product.quicklookVisible )	{
							map.showQuicklook( product );
						}
					}
				}
			};*/
			
			currentEngineIndex = (currentEngineIndex+1) % 2;
			var value = engines[currentEngineIndex];
			
			// Instantiate the map engine
			if ( value === 'openlayers' )
				mapEngine = new OpenLayersMapEngine(element);
			/*else if ( value === 'googlemap' )
				map = new eocat.GoogleMapMap('map' );*/
			else if ( value === 'globweb' )
				mapEngine = new GlobWebMapEngine(element);
			/*else if ( value === 'googleearth' )
				map = new eocat.GoogleEarthMap('map' );*/
			
			mapEngine.setStyleMap( { 'results': resultStyle, 'shopcart': shopcartStyle, 'selected': selectedStyle } );

			// Subscribe to events
			/*map.subscribe("init",initCallback);
			map.subscribe("click",mapClickHandler);
			map.subscribe("startNavigation",startNavigationHandler);
			map.subscribe("endNavigation", function() {
				eocat.Events.trigger("map.endNavigation",map);
			});*/
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



