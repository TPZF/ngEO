
define(["jquery", "globalEvents", "ui/menubar", "map/map", "searchResults/map",  
        "shopcart/model/shopcartCollection", "shopcart/model/shopcart", 
 		 "shopcart/view/shopcartItemView", "account/view/createShopcartView"], 
	function($, GlobalEvents, MenuBar, Map, SearchResultsMap, ShopcartCollection, Shopcart, ShopcartTableView, CreateShopcartView) {

	
return {
		
	/**
	 * Initialize the shopcart component for data-services-area.
	 *
	 * @param element 	The root element of the data-services-area
	 * @param router 	The data-services-area router
	 */
	initialize: function(element, router, panelManager) {

		// Create the shopcart table view and add it to panel
		var tableView = new ShopcartTableView();
		panelManager.bottom.addView( tableView );
	
		var shopcartStatus = {
			activator: '#shopcart',
			$el: $('#shopcartStatus'),
			views: [tableView],
			viewActivators: [ $('#shopcartStatus').find('#tableCB') ],
			model: ShopcartCollection.getCurrent()
		};
		
		// Add shopcart status to panel
		panelManager.bottom.addStatus(shopcartStatus);	
		
		// Change model on table when the shopcart is changed
		tableView.listenTo(ShopcartCollection, 'change:current', function(shopcart) {
			shopcartStatus.model = shopcart.featureCollection;
			tableView.setShopcart(shopcart);
			shopcart.loadContent();
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
				
				SearchResultsMap.removeFeatureCollection( prevCurrent.featureCollection, { keepLayer: true } );
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
		
		// Subscribe add to shopcart
		GlobalEvents.on('addToShopcart', function(features) {
		
			if (!ShopcartCollection.getCurrent()) {

				var createShopcartView = new CreateShopcartView({
					model : ShopcartCollection,
					title : "Create shopcart",
					success : function(model) {
						ShopcartCollection.setCurrent( model );
						ShopcartCollection.getCurrent().addItems( features );
					}
				});
				createShopcartView.render();
				
			} else {
				ShopcartCollection.getCurrent().addItems( features );
			}

		})
		
	},
};

});
