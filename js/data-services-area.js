
define(["jquery", "map/map", "search/model/searchResults", "search/widget/search", "shopcart/widget/shopcart", "map/widget/layers", "map/widget/background", "map/widget/toolbarMap",
		"map/widget/mapPopup",
		"text!../pages/data-services-area.html"], 
	function($, Map, SearchResults, SearchWidget, ShopcartWidget, LayersWidget, BackgroundWidget, ToolBarMap, MapPopup, dataservicesarea) {
	
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
		SearchWidget();
		ShopcartWidget();
		LayersWidget();
		ToolBarMap();
		BackgroundWidget();
		
		// Create the popup for map
		var mapPopup = new MapPopup('.ui-page-active');
		mapPopup.close();

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
