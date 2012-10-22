
require.config({
     paths: {
        "jquery": "externs/jquery-1.8.2.min",
		"jquery.mobile": "externs/jquery.mobile-1.2.0",
        "underscore": "externs/underscore",
		"backbone": "externs/backbone",
		"text": "externs/text"
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
require( ["require", "jquery", "ngeo.configuration", "ngeo.menubar", "backbone", "jquery.mobile"] , function(require, $,Configuration, MenuBar) {

/** Use a defered object for document ready */
var doc_ready = $.Deferred();

/** When the document is ready and configuration is loaded load the rest of the application */
$.when(doc_ready, Configuration.load()).then(function() {
	
	// Remove some automatic styling from jQuery Mobile that don't fit in ngEO style
	$("body").removeClass("ui-mobile-viewport");
	$("header").find("a").removeClass("ui-link");
	
	// Initialize menu bar
	MenuBar.initialize("header nav");

	// Load the map and initialize it
	require(["map/ngeo.map"], function(Map) {
		Map.initialize("mapContainer");
	});
		
});

/** When the document is ready, resolve the deferred object */
$(document).ready(doc_ready.resolve);

});