
define(["jquery", "menubar", "map/map", "searchResults/model/searchResults", "search/model/datasetSearch", "search/widget/datasetSelection",
		"search/widget/searchCriteria", "searchResults/widget/resultsTable",
		"shopcart/widget/shopcart", "map/widget/toolbarMap",
		"map/widget/mapPopup",
		"text!../pages/data-services-area.html", "context-help"], 
	function($, MenuBar, Map, SearchResults, DatasetSearch, DataSetSelectionWidget, SearchCriteriaWidget, ResultsTableWidget, ShopcartWidget, ToolBarMap, MapPopup, dataservicesarea, ContextHelp) {
	
return {

	/**
	 * Build the root element of the module and return it
	 */
	buildElement: function() {
	
		var dsa = $(dataservicesarea);
		var toolbar = dsa.find('#toolbar');
		
		// Wrap the image with a div to display both image and text below, and then add class for button styling
		toolbar.find('img')
			.wrap('<div class="tb-elt" />')
			.addClass('tb-button');
			
		// Add text for each element
		toolbar.find('img').each( function(index) {
			$(this).after('<div class="tb-text">' + $(this).attr('name') + '</div>');
		});
	
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
		ContextHelp(element);
		
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
