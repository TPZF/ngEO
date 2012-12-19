/**
 * SearchWidget module
 */
define( ["jquery", "backbone", "search/model/searchResults", "search/view/searchResultsTableView", 
          "widget"], function($, Backbone, SearchResults, SearchResultsTableView) {

return function() {
			
	// Create the main search view
	var view = new SearchResultsTableView({ 
		model : SearchResults 
	});
	
	// Append it to the data services area
	$('#dataServicesArea').append(view.$el);
	
	// Create the widget for view
	view.$el.ngeowidget({
		title: 'Results Table',
		activator: '#result'
	});
	
	view.render();

	// Show the widget when search results are retreived
	SearchResults.on("change", function() {
		view.$el.ngeowidget("show");
	});
	
};

});
