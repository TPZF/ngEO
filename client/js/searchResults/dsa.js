
define(["jquery", "logger", "searchResults/map", "map/selectHandler", 
        "searchResults/model/searchResults", "searchResults/view/searchResultsView",
        "searchResults/view/searchResultsTableView", "map/widget/mapPopup"], 
	function($, Logger, SearchResultsMap, SelectHandler, SearchResults, SearchResultsView, SearchResultsTableView,
			MapPopup) {

// Private variable
var _views = {};

return {
	
	/**
	 * Initialize the search results component for data-services-area.
	 *
	 * @param element 	The root element of the data-services-area
	 * @param router 	The data-services-area router
	 */
	 initialize: function(element, router, panelManager) {
			
		// Call when a new feature collection is available
		SearchResults.on('add:featureCollection', function(fc) {
						
			// Create the search results view
			var searchResultsView = new SearchResultsView({ 
				model : fc 
			});
			_views[ fc.id ] = searchResultsView;
			$('#statusBar').append( searchResultsView.$el );
			searchResultsView.render();
			
			// Create the results table view
			var tableView = new SearchResultsTableView({ 
				model : fc 
			});
			tableView.hasGroup = fc.id == "Correlation" || fc.id == "Interferometry";
			
			// update the toolbar
			$('#bottomToolbar')
				.append('<command id="result' + fc.id + '" label="' + fc.id + '" class="result" />')
				.toolbar('refresh');
			$('#dateRangeSlider').css('left', $('#bottomToolbar').outerWidth() );
			var slider = $("#dateRangeSlider").data("dateRangeSlider");
			if (slider) slider.refresh();
			
			panelManager.bottom.addStatus({
				activator: '#result' + fc.id,
				show: function() {					
					searchResultsView.$el.show();
				},
				hide: function() {
					searchResultsView.$el.hide();
				},
				tableView: tableView,
				$tableCB: searchResultsView.$el.find('#tableCB')
			});
			tableView.render();
			
			// Add feature collection to the map
			SearchResultsMap.addFeatureCollection( fc, {
				layerName : fc.id + " Result",
				style: "results-footprint",
				hasBrowse: true
			});
			
			
			// Activate the new result
			$('#result' + fc.id).click();
			
		});
		
		// Call when a feature collection is removed
		SearchResults.on('remove:featureCollection', function(fc) {
			// Update the toolbar
			$('#result' + fc.id)
				.remove();
				
			// Update the daterange slider
			$('#dateRangeSlider').css('left', $('#bottomToolbar').outerWidth() );
			var slider = $("#dateRangeSlider").data("dateRangeSlider");
			if (slider) slider.refresh();
			
			// Remove the view
			_views[ fc.id ].remove();
			delete _views[ fc.id ];
			
			// Remove feature collection from the map
			SearchResultsMap.removeFeatureCollection( fc );
			
			// Activate the last
			$('#bottomToolbar command:last-child').click();
		});
		
		// Initialize the default handler
		SelectHandler.initialize();
		// Start it
		SelectHandler.start();
		
		// Create the popup for the map
		var mapPopup = new MapPopup('#mapContainer');
		mapPopup.close();		
		
		// Do not stay on shopcart when a search is launched
		SearchResults.on('launch', function() {
			if ( $('#shopcart').hasClass('toggle') ) {
				$('#shopcart').next().click();
			}
		});

	},
};

});
