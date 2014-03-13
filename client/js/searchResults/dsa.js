
define(["jquery", "logger", "searchResults/map", "map/selectHandler", 
        "searchResults/model/searchResults", "searchResults/view/searchResultsView",
        "searchResults/view/searchResultsTableView", "map/widget/mapPopup", "ui/ganttView"], 
	function($, Logger, SearchResultsMap, SelectHandler, SearchResults, SearchResultsView, SearchResultsTableView,
			MapPopup, GanttView) {

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
	 
		// Create the results table view
		var tableView = new SearchResultsTableView();
		panelManager.bottom.addView( tableView );
		tableView.render();
		
		// Create the GanttView
		var ganttView = new GanttView();
		panelManager.bottom.addView( ganttView );
		ganttView.render();
	
		// Call when a new feature collection is available
		SearchResults.on('add:featureCollection', function(fc) {
						
			// Create the search results view
			var searchResultsView = new SearchResultsView({ 
				model : fc 
			});
			_views[ fc.id ] = searchResultsView;
			$('#statusBar').append( searchResultsView.$el );
			searchResultsView.render();
						
			// update the toolbar
			$('#bottomToolbar')
				.append('<command id="result' + fc.id + '" label="' + fc.id + '" class="result" />')
				.toolbar('refresh');
			$('#dateRangeSlider').css('left', $('#bottomToolbar').outerWidth() );
			var slider = $("#dateRangeSlider").data("dateRangeSlider");
			if (slider) slider.refresh();
			
			// Add to status bar
			panelManager.bottom.addStatus({
				activator: '#result' + fc.id,
				$el: searchResultsView.$el,
				views: [tableView, ganttView],
				viewActivators: [ searchResultsView.$el.find('#tableCB'), searchResultsView.$el.find('#ganttCB') ],
				model: fc
			});
			
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
			
			// WARNING : order of removal is important !
			
			// Update the toolbar
			$('#result' + fc.id)
				.remove();
				
			// Activate the last
			$('#bottomToolbar command:last-child').click();
				
			// Update the daterange slider
			$('#dateRangeSlider').css('left', $('#bottomToolbar').outerWidth() );
			var slider = $("#dateRangeSlider").data("dateRangeSlider");
			if (slider) slider.refresh();
			
			// Remove the view
			_views[ fc.id ].remove();
			delete _views[ fc.id ];
			
			// Remove feature collection from the map
			SearchResultsMap.removeFeatureCollection( fc );
			
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
