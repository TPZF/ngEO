/**
 * SearchWidget module
 */
define( ["jquery", "backbone", "searchResults/model/searchResults", "searchResults/view/searchResultsTableView", 
          "panel"], function($, Backbone, SearchResults, SearchResultsTableView) {

return function(root) {
			
	// Create the main search view
	var view = new SearchResultsTableView({ 
		model : SearchResults 
	});
	
	/**
 	 * Decomment to add the results table as a widget 
	 */
/*	// Append it to the data services area
	 root.append(view.$el);
	 
	//Create the widget for view
	view.$el.ngeowidget({
		activator: '#result'
	});
	
	view.render();
	
	// Show the widget when search results are retreived
	SearchResults.on("change", function() {
		view.$el.ngeowidget('show');		
	});*/


	/**
 	 * Add the results table as a bottom panel 
	 */
	// Append it to the panel manager (ie parent of the root)
	root.parent().append(view.$el);
	
	// Create the panel for the view
	view.$el.panel({
		panelManager: root.parent(),
		activator: '#result'
	});
	
	view.render();

//	// Show the widget when search results are retreived
//	SearchResults.on("change", function() {
//		view.$el.panel('show');		
//	});
	
	return view.$el;
};

});
