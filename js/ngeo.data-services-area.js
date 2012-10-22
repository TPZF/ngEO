define(["search/widget/ngeo.search", "shopcart/widget/ngeo.shopcart", "map/widget/ngeo.layers", "map/widget/ngeo.background", "map/widget/ngeo.toolbarMap"], 
	function(SearchWidget, ShopcartWidget, LayersWidget, BackgroundWidget, ToolBarMap) {
	
return {
	initialize: function() {
		SearchWidget();
		ShopcartWidget();
		LayersWidget();
		ToolBarMap();
		BackgroundWidget();
	}
};

});
