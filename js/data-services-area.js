
define(["jquery", "menubar", "map/map", "searchResults/model/searchResults", "search/model/datasetSearch", "search/widget/datasetSelection",
		"search/widget/searchCriteria", "searchResults/widget/resultsTable",
		"shopcart/widget/shopcart", "map/widget/toolbarMap",
		"map/widget/mapPopup",
		"text!../pages/data-services-area.html"], 
	function($, MenuBar, Map, SearchResults, DatasetSearch, DataSetSelectionWidget, SearchCriteriaWidget, ResultsTableWidget, ShopcartWidget, ToolBarMap, MapPopup, dataservicesarea) {
	
return {

	/**
	 * Build the root element of the module and return it
	 */
	buildElement: function() {
	
		var dsa = $(dataservicesarea);
		dsa.find('#toolbar').toolbar();
	
		return dsa;
	},
	
	/**
	 * Initialize the module.
	 * Called after buildElement
	 *
	 * @param element The root element of the module
	 */
	initialize: function(element) {
	
		// Create all widgets
		DataSetSelectionWidget(element);
		var searchWidget = SearchCriteriaWidget(element);
		ResultsTableWidget(element);
		//ShopcartWidget(element);
		ToolBarMap(element);
		
		// Setup the router for shared URL support
		var router = new Backbone.Router();
		router.route("data-services-area/search", "search", function() {
			MenuBar.showPage("data-services-area");
			searchWidget.ngeowidget("show");
		});
		
		// Create the popup for map
		var mapPopup = new MapPopup('.ui-page-active');
		mapPopup.close();
		
		// Display a message about dataset in the map
		DatasetSearch.on('change:datasetId', function(model) {
			var datasetId = model.get('datasetId');
			if ( datasetId ) {
				$('#datasetMessage').html( "Current dataset : " + model.get('datasetId') );
			} else {
				$('#datasetMessage').html( "Current dataset : None" );
			}
		});

		// Connect with map feature picking
		Map.on('pickedFeatures',SearchResults.setSelection,SearchResults);
	
		// Connect search results events with map
		SearchResults.on('change',Map.setResults);
		SearchResults.on('zoomToProductExtent',Map.zoomToFeature);
		SearchResults.on('selectFeatures',Map.selectFeatures);
		SearchResults.on('unselectFeatures',Map.unselectFeatures);		
	}
};

});
