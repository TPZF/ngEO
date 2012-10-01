
require.config({
    //baseUrl: "/another/path",
    paths: {
        "jquery": "externs/jquery-1.8.2.min",
		"jquery.ui": "externs/jquery-ui-1.8.23.custom.min",
		"jquery.mobile": "externs/jquery.mobile-1.1.1",
        "underscore": "externs/underscore",
		"backbone": "externs/backbone"
   },
	shim: {
		'jquery': {
            deps: [],
            exports: 'jQuery'
        },
		'ngeo.jqm-config': {
            deps: ['jquery']
        },
 		'jquery.mobile': {
            deps: ['jquery','ngeo.jqm-config'],
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

require( ["jquery.ui", "ngeo.map", "widgets/ngeo.search", "widgets/ngeo.shopcart", "widgets/ngeo.layers", "widgets/ngeo.background", "ngeo.toolbarMap", "ngeo.widget", "jquery.mobile"], 
	function($, Map, SearchWidget, ShopcartWidget, LayersWidget, BackgroundWidget, ToolBarMap) {

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
	BackgroundWidget();

});

});