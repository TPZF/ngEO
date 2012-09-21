
require.config({
    //baseUrl: "/another/path",
    paths: {
        "jquery": "externs/jquery-1.8.2.min",
		"jquery.ui": "externs/jquery-ui-1.8.23.custom.min",
        "underscore": "externs/underscore",
		"backbone": "externs/backbone"
   },
	shim: {
		'jquery': {
            deps: [],
            exports: 'jQuery'
        },
		'jquery.ui': {
            deps: ['jquery'],
            exports: 'jQuery'
        },
		"underscore": {
            deps: [],
            exports: '_'
		},
		"backbone": {
            deps: ["underscore"],
            exports: 'Backbone'
		}
	}
  });

require( ["jquery.ui", "ngeo.map", "ngeo.search", "ngeo.shopcart", "ngeo.layers", "ngeo.toolbarMap", "ngeo.widget"], 
	function($, Map, SearchWidget, ShopcartWidget, LayersWidget, ToolBarMap) {

//** Main function : called when the document is ready
$(document).ready(function() {
	
	// Initialize the map
	Map.initialize('mapContainer');
	
	// Manage window resize
	$(window).resize( function() {
		Map.updateViewportSize();
	});
	
	SearchWidget();
	ShopcartWidget();
	LayersWidget();
	ToolBarMap();

});

});