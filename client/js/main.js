
require.config({
     paths: {
        "jquery": "externs/jquery-1.8.3",
		"jquery.mobile": "externs/jquery.mobile-1.2.0",
		"jqm-datebox-calbox" : "externs/jqm-datebox-1.1.0.mode.calbox",
		"jqm-datebox-datebox" : "externs/jqm-datebox-1.1.0.mode.datebox",
		"jqm-datebox-core" : "externs/jqm-datebox-1.1.0.core",
		"jquery.dataTables" : "externs/jquery.dataTables",
		"jquery.dateRangeSlider" : "externs/jQDateRangeSlider",
		"jquery.rangeSlider" : "externs/jQRangeSlider",	
        "underscore": "externs/underscore",
		"backbone": "externs/backbone",
		"text": "externs/text"
   },
	shim: {
		'jquery': {
            deps: [],
            exports: 'jQuery'
        },
		'jqm-config': {
            deps: ['jquery']
        },
        
 		'jquery.mobile': {
            deps: ['jquery','jqm-config'],
            exports: 'jQuery'
        },
        
        'jqm-datebox-core' : {
        	 deps: ['jquery', 'jquery.mobile'],
             exports: 'jQuery'
        },
        
        'jqm-datebox-calbox': {
            deps: ['jqm-datebox-core'],
            exports: 'jQuery'
        },
        
        'jqm-datebox-datebox': {
            deps: ['jqm-datebox-core'],
            exports: 'jQuery'
        },
        
        'jquery.dataTables' : {
        	 deps: ['jquery'],
             exports: 'jQuery'
        },
                
		'underscore': {
            deps: [],
            exports: '_'
		},
		'backbone': {
            deps: ['underscore'],
            exports: 'Backbone'
		}
	}
		
  });

/**
 * Main ngEO module
 */
require( ["require", "jquery", "configuration", "menubar", "logger", "backbone", "jquery.mobile", "panel"] ,
		function(require, $, Configuration, MenuBar, Logger, Backbone) {

/** Use a defered object for document ready */
var doc_ready = $.Deferred();

/** When the document is ready and configuration is loaded load the rest of the application */
$.when(doc_ready, Configuration.load())
	.done( function() {
	
		$.mobile.loading("show");
	
		// Remove some automatic styling from jQuery Mobile that don't fit in ngEO style
		$("body").removeClass("ui-mobile-viewport");
		$("header").find("a").removeClass("ui-link");

		// Load the map module and initialize it
		require(["map/map"], function(Map) {
		
			// Initialze the panel container
			$("#mapContainer").panelManager({
				center: "#map",
				update: Map.updateViewportSize
			});
			
			// Initialize menu bar
			MenuBar.initialize("header nav");
			
			// Initialize map
			Map.initialize("map");
			
		});
		
	})
	.fail( function() {
		Logger.error('Cannot load configuration');
	});

/** When the document is ready, resolve the deferred object */
$(document).ready(doc_ready.resolve);

});