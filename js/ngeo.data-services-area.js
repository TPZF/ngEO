define(["widgets/ngeo.search", "widgets/ngeo.shopcart", "widgets/ngeo.layers", "widgets/ngeo.background", "ngeo.toolbarMap"], 
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
