/**
 * SearchWidget module
 */
define( ["jquery", "backbone", "search/model/datasetSearch", "search/view/searchCriteriaView", 
          "widget"], function($, Backbone, DatasetSearch, SearchCriteriaView) {

return function(element) {
		
	DatasetSearch.initialize();
	
	// Create the view and append it to the root element
	var view = new SearchCriteriaView({
		model : DatasetSearch,
	});
	element.append(view.$el);
	
	// Create the widget to display the search criteria view
	view.$el.ngeowidget({
		title: 'Search Criteria',
		activator: '#search',
	});
	
	view.render();

	return view.$el;
};

});
