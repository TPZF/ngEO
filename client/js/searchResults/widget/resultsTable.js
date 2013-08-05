/**
 * SearchWidget module
 */
define( ["searchResults/model/searchResults", "searchResults/view/searchResultsTableView", 
          "panelManager"], function(SearchResults, SearchResultsTableView, PanelManager) {

return function() {
			
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
	PanelManager.addPanelContent({
		element: view.$el,
		position: 'bottom',
		activator: '#result',
		show: $.proxy( view.onShow, view ),
		hide: $.proxy( view.onHide, view )
	});
	
	// Manage panel size
	view.$el.on('panel:show', $.proxy( view.onShow, view ) );
	view.$el.on('panel:hide', $.proxy( view.onHide, view ) );
	view.on("sizeChanged", function() {
		PanelManager.updatePanelSize('bottom');
	});
	
	view.render();

//	// Show the widget when search results are retreived
//	SearchResults.on("change", function() {
//		view.$el.panel('show');		
//	});
	
	return view.$el;
};

});
