
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
/*require( ["jquery", "backbone", "ngeo.menubar", "ngeo.map", "widgets/ngeo.search", "widgets/ngeo.shopcart", "widgets/ngeo.layers", "widgets/ngeo.background", "ngeo.toolbarMap"], 
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
});*/

require( ["require", "jquery", "ngeo.configuration", "backbone", "jquery.mobile"] , function(require, $,Configuration) {

/** Use a defered object for document ready */
var doc_ready = $.Deferred();

/** When the document is ready and configuration is loaded load the rest of the application */
$.when(doc_ready, Configuration.load()).then(function() {
	
	// Load the menu bar and initialize it
	require(["ngeo.menubar"], function(MenuBar) {
		MenuBar.initialize("header nav");
	});

	// Load the map and initialize it
	require(["ngeo.map"], function(Map) {
		Map.initialize("mapContainer");
	});
	
	// Load and intialize data services area
	require(["ngeo.data-services-area"], 
		function(DataServicesArea) {
			DataServicesArea.initialize();
	});
	
});

/** When the document is ready, resolve the deferred object */
$(document).ready(doc_ready.resolve);

});