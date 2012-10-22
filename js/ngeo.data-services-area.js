
define(["search/widget/ngeo.search", "shopcart/widget/ngeo.shopcart", "map/widget/ngeo.layers", "map/widget/ngeo.background", "map/widget/ngeo.toolbarMap",
		"text!../pages/data-services-area.html"], 
	function(SearchWidget, ShopcartWidget, LayersWidget, BackgroundWidget, ToolBarMap, dataservicesarea) {
	
return {
	buildElement: function() {
	
		var dsa = $(dataservicesarea);
		dsa.find('#toolbar').toolbar();
	
		return dsa;
	},
	
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
