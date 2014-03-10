
define(["jquery", "ui/menubar", "map/map", "searchResults/map",  
        "shopcart/model/shopcartCollection", "shopcart/model/shopcart", 
 		 "shopcart/view/shopcartItemView"], 
	function($, MenuBar, Map, SearchResultsMap, ShopcartCollection, Shopcart, ShopcartTableView) {

	
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
		
		// Change model on table when the shopcart is changed
		tableView.listenTo(ShopcartCollection, 'change:current', tableView.setShopcart);
		
		// Add table to status panel
		panelManager.bottom.addStatus({
			activator: '#shopcart',
			show: function() {
				$('#shopcartStatus').show();
			},
			hide: function() {
				$('#shopcartStatus').hide();
			},
			tableView: tableView,
			$tableCB: $('#tableCB')
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
			shareShopcart.on("add:features", function() {
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
			var numItems = ShopcartCollection.getCurrent().featureCollection.features.length;
			$('#shopcartMessage').html( ShopcartCollection.getCurrent().get('name') + ' : ' + numItems + ' items' );
		};
		
		// Manage display of shopcart footprints
		ShopcartCollection.on('change:current', function( current, prevCurrent ) {
			if ( prevCurrent ) {
				prevCurrent.featureCollection.off('add:features', updateNumberOfItems );
				prevCurrent.featureCollection.off('remove:features', updateNumberOfItems );
				prevCurrent.off('change:name', updateNumberOfItems);
				
				SearchResultsMap.removeFeatureCollection( prevCurrent.featureCollection );
			}
			
			updateNumberOfItems();
			
			shopcartLayer.clear();
			
			SearchResultsMap.addFeatureCollection( current.featureCollection, {
				layer: shopcartLayer,
				hasBrowse: false
			});
			
			current.on('change:name', updateNumberOfItems);
			current.featureCollection.on('add:features', updateNumberOfItems );
			current.featureCollection.on('remove:features', updateNumberOfItems );
		});
		
	},
};

});
