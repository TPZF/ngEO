
define(["jquery", "logger", "ui/menubar", "map/map", 
        "shopcart/model/shopcartCollection", "shopcart/model/shopcart", 
 		 "shopcart/view/shopcartItemView"], 
	function($, Logger, MenuBar, Map, ShopcartCollection, Shopcart, ShopcartTableView) {


return {
		
	/**
	 * Initialize the shopcart component for data-services-area.
	 *
	 * @param element 	The root element of the data-services-area
	 * @param router 	The data-services-area router
	 */
	initialize: function(element, router, panelManager) {

		// Create the shopcart table view
		var tableView = new ShopcartTableView();
		tableView.listenTo(ShopcartCollection, 'change:current', tableView.setModel);
		
		// Add it to status panel
		panelManager.bottom.addStatus({
			activator: '#shopcart',
			show: function() {
				$('#shopcartMessage').show();
			},
			hide: function() {
				$('#shopcartMessage').hide();
			},
			tableView: tableView
		});		
		
		tableView.render();
		
		// load the shopcart collection to display the current shopcart in the data services area
		ShopcartCollection.fetch();
	
		//Route for share shopcart
		router.route(
				"data-services-area/shopcart/:shopcartId", 
				"shopcart", function(shopcartId) {		

			MenuBar.showPage("data-services-area");
			
			// Create a shared shopcart and load its content to be displayed
			var shareShopcart = new Shopcart({ id: shopcartId, name: "Share Shopcart " + shopcartId, isShared: true });
			ShopcartCollection.setCurrent( shareShopcart );
			
			// Load content is not needed because it is already done by the shopcart widget when setCurrent is done
			//shareShopcart.loadContent();
			
			// Show the GUI once loaded
			shareShopcart.on("itemsAdded", function(id) {
				// Toggle the shopcart button to be clicked
				$("#shopcart").trigger('click');
				panelManager.bottom.showTable();
			});
		});
		
		
		// Connect shopcart with Map		
		var shopcartLayer = Map.addLayer({
			name: "Shopcart Footprints",
			type: "Feature",
			visible: true,
			style: "shopcart-footprint"
		});
		
		var updateNumberOfItems = function() {
			var numItems = ShopcartCollection.getCurrent().features.length;
			$('#shopcartMessage').html( ShopcartCollection.getCurrent().get('name') + ' : ' + numItems + ' items' );
		};
		
		// Manage display of shopcart footprints
		ShopcartCollection.on('change:current', function( current, prevCurrent ) {
			if ( prevCurrent ) {
				prevCurrent.off('itemsAdded', shopcartLayer.addFeatures, shopcartLayer );
				prevCurrent.off('itemsDeleted', shopcartLayer.removeFeatures, shopcartLayer );
				prevCurrent.off('itemsAdded', updateNumberOfItems );
				prevCurrent.off('itemsDeleted', updateNumberOfItems );
			}
			updateNumberOfItems();
			shopcartLayer.clear();
			current.on('itemsAdded', shopcartLayer.addFeatures, shopcartLayer );
			current.on('itemsDeleted', shopcartLayer.removeFeatures, shopcartLayer );
			current.on('itemsAdded', updateNumberOfItems );
			current.on('itemsDeleted',updateNumberOfItems );
		});
		
	},
};

});