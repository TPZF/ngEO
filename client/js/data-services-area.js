
define(["jquery", "search/widget/search", "shopcart/widget/shopcart", "map/widget/layers", "map/widget/background", "map/widget/toolbarMap",
		"text!../pages/data-services-area.html"], 
	function($, SearchWidget, ShopcartWidget, LayersWidget, BackgroundWidget, ToolBarMap, dataservicesarea) {
	
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
		
	}
};

});
