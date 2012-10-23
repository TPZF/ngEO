
define(["search/widget/search", "shopcart/widget/shopcart", "map/widget/layers", "map/widget/background", "map/widget/toolbarMap",
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
