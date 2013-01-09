/**
 * SearchWidget module
 */
define( ["jquery", "backbone", "searchResults/model/searchResults", "searchResults/view/searchResultsTableView", 
          "widget"], function($, Backbone, SearchResults, SearchResultsTableView) {

return function(element) {
			
	// Create the main search view
	var view = new SearchResultsTableView({ 
		model : SearchResults 
	});
	
	// Append it to the data services area
	element.append(view.$el);
	
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
	
	return view.$el;
};

});
