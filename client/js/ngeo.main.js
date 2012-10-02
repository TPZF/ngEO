
require.config({
     paths: {
        "jquery": "externs/jquery-1.8.2.min",
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

/**
 * Main ngEO module
 */
require( ["jquery", "backbone", "ngeo.menubar", "ngeo.map", "widgets/ngeo.search", "widgets/ngeo.shopcart", "widgets/ngeo.layers", "widgets/ngeo.background", "ngeo.toolbarMap", "ngeo.widget", "jquery.mobile"], 
	function($, Backbone, MenuBar, Map, SearchWidget, ShopcartWidget, LayersWidget, BackgroundWidget, ToolBarMap) {

//** Called when the document is ready
$(document).ready(function() {
	
	// Initialize the map
	Map.initialize('mapContainer');
	
	// Manage window resize
	$(window).resize( function() {
		Map.updateViewportSize();
	});
	
	// Initialize the menu bar
	MenuBar.initialize('header nav');
	
	// Initialize data services area
	SearchWidget();
	ShopcartWidget();
	LayersWidget();
	ToolBarMap();
	BackgroundWidget();
	
	Backbone.history.start({pushState: true, root: "/ngEO/client/"})
});

});