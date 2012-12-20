
define(["jquery", "map/map", "search/model/searchResults", "search/model/datasetSearch", "search/widget/datasetSelection",
		"search/widget/searchCriteria", "search/widget/resultsTable",
		"shopcart/widget/shopcart", "map/widget/toolbarMap",
		"map/widget/mapPopup",
		"text!../pages/data-services-area.html"], 
	function($, Map, SearchResults, DatasetSearch, DataSetSelectionWidget, SearchCriteriaWidget, ResultsTableWidget, ShopcartWidget, ToolBarMap, MapPopup, dataservicesarea) {
	
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
	 */
	initialize: function() {
	
		// Create all widgets
		DataSetSelectionWidget();
		SearchCriteriaWidget();
		ResultsTableWidget();
		ShopcartWidget();
		ToolBarMap();
		
		// Create the popup for map
		var mapPopup = new MapPopup('.ui-page-active');
		mapPopup.close();
		
		// Display a message about dataset
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
