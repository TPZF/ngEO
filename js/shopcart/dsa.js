
define(["jquery", "logger", "ui/menubar", "map/map", 
        "shopcart/model/shopcartCollection", "shopcart/model/shopcart", 
 		"shopcart/widget/shopcartWidget"], 
	function($, Logger, MenuBar, Map, ShopcartCollection, Shopcart, ShopcartWidget) {


return {
		
	/**
	 * Initialize the shopcart component for data-services-area.
	 *
	 * @param element 	The root element of the data-services-area
	 * @param router 	The data-services-area router
	 */
	initialize: function(element, router) {

		// Create the shopcart widget
		ShopcartWidget.create();
		
	
		//Route for share shopcart
		router.route(
				"data-services-area/shopcart/:shopcartId", 
				"shopcart", function(shopcartId) {		

			MenuBar.showPage("data-services-area");
			
			// Create a shared shopcart and load its content to be displayed
			var shareShopcart = new Shopcart({ id: shopcartId, name: "Share Shopcart", isShared: true });
			ShopcartCollection.setCurrent( shareShopcart );
			
			// Load content is not needed because it is already done by the shopcart widget when setCurrent is done
			//shareShopcart.loadContent();
			
			// Show the GUI once loaded
			shareShopcart.on("loaded", function(id) {
				// Toggle the shopcart button to be clicked
				$("#shopcart").trigger('click');
			});
		});
		
		
		// Connect shopcart with Map		
		var shopcartLayer = Map.addLayer({
			name: "Shopcart Footprints",
			type: "Feature",
			visible: true,
			style: "shopcart-footprint"
		});
		
		// Manage display of shopcart footprints
		ShopcartCollection.on('change:current', function( current, prevCurrent ) {
			if ( prevCurrent ) {
				prevCurrent.off('loaded', shopcartLayer.addFeatures, shopcartLayer );
				prevCurrent.off('itemsAdded', shopcartLayer.addFeatures, shopcartLayer );
				prevCurrent.off('itemsDeleted', shopcartLayer.removeFeatures, shopcartLayer );
			}
			shopcartLayer.clear();
			current.on('loaded', shopcartLayer.addFeatures, shopcartLayer );
			current.on('itemsAdded', shopcartLayer.addFeatures, shopcartLayer );
			current.on('itemsDeleted', shopcartLayer.removeFeatures, shopcartLayer );
		});
		
	},
};

});