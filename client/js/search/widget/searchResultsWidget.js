/**
 * SearchResultsWidget module
 */
 
define( ["jquery", "backbone", 'search/model/datasetSearch', 'search/model/searchResults', "search/view/searchResultsView", 
          "widget"], function($, Backbone, DatasetSearch, SearchResults, SearchResultsView) {

return function(datasetSearch) {
		
	// Create the model for search results
	var searchResults = new SearchResults();
	//TODO use the openSearch url when the service is implemented
	//searchResults.url = self.DatasetSearch.getOpenSearchURL();
	//For the moment used only host string to communicate with the stub server 
	searchResults.url = datasetSearch.get("host");
	
	// Create the main search results view
	var searchResultsView = new SearchResultsView({ model : searchResults });
	
	// TODO : where to append it to the data services area
	$('#dataServicesArea').append(searchResultsView.$el);
	
	// Create the widget for searchResults
	searchResultsView.$el.ngeowidget({
		
		title: 'SearchResults',
		
		activator: '#searchRequest',
		
		show: function() {
			searchResults.fetch();
			searchResultsView.render();
		}
	});
	
	//searchResultsView.$el.ngeowidget('addHeader', { title : 'Search Results'});//, buttons: [{id: 'closeSearchResults', value: 'close' }]} );
	
};

});