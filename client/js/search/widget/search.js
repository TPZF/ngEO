/**
 * SearchWidget module
 */
define( ["jquery", "backbone", 'search/model/dataSetPopulation', "search/view/mainSearchView", 
          "widget"], function($, Backbone, DataSetPopulation, MainSearchView) {

return function() {
		
	// Create the model for DataSetPopulation
	var datasetPopulation = new DataSetPopulation();
	
	// Create the main search view
	var mainSearchView = new MainSearchView({ datasetSelectionModel : datasetPopulation });
	
	// Append it to the data services area
	$('#dataServicesArea').append(mainSearchView.$el);
	
	// Create the widget for main search view
	mainSearchView.$el.ngeowidget({
		title: 'Search',
		activator: '#search',
		show: function() {
			// The dataset population is fetch each time the user launch a search
			datasetPopulation.fetch();
			mainSearchView.render();
		}
	});
	
//	// Router for seach shared url
//    var SearchRouter = Backbone.Router.extend({
//        routes: {
//            "search/:id": "search"
//        },
//        search: function( id ){
//			$("#searchWidget").ngeowidget("show");
//        }
//    });
//	
//    // Initiate the router
//    var router = new SearchRouter;	

};

});
