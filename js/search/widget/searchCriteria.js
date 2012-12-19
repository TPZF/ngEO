/**
 * SearchWidget module
 */
define( ["jquery", "backbone", "search/model/datasetSearch", "search/view/searchCriteriaView", 
          "widget"], function($, Backbone, DatasetSearch, SearchCriteriaView) {

return function() {
		
	var view = new SearchCriteriaView({
		model : DatasetSearch,
	});
	
	// Append it to the data services area
	$('#dataServicesArea').append(view.$el);
	
	// Create the widget for main search view
	view.$el.ngeowidget({
		title: 'Search Criteria',
		activator: '#search',
	});
	
	view.render();

};

});
