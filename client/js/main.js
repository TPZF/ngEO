
require.config({
     paths: {
        "jquery": "externs/jquery-1.8.3",
		"jquery.mobile": "externs/jquery.mobile-1.2.0",
//TODO TO BE REMOVED 
//		"jqm-datebox-slidebox" : "externs/jqm-datebox-1.1.0.mode.slidebox",
		"jqm-datebox-calbox" : "externs/jqm-datebox-1.1.0.mode.calbox",
		"jqm-datebox-datebox" : "externs/jqm-datebox-1.1.0.mode.datebox",
		"jqm-datebox-core" : "externs/jqm-datebox-1.1.0.core",
		"jquery.dataTables" : "externs/jquery.dataTables",
		"jquery.dateRangeSlider" : "externs/jQDateRangeSlider",
		"jquery.rangeSlider" : "externs/jQRangeSlider",
//TODO TO BE REMOVED 
//		"jquery.ui" : "externs/jquery-ui-1.10.0.custom.min",		
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
        
//TODO TO BE REMOVED        
//        'jqm-datebox-slidebox': {
//            deps: ['jqm-datebox-core'],
//            exports: 'jQuery'
//        },
        
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
        
        'jquery.dateRangeSlider' : {
			deps: ['jquery','jquery.rangeSlider'],
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
require( ["require", "jquery", "configuration", "menubar", "backbone", "jquery.mobile", "panel"] ,
		function(require, $, Configuration, MenuBar, Backbone) {

/** Console fix	: create a dummy console.log when console is not present. Otherwise it is not working on some browser configuration */
window.console || (console={log:function(){}});

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
		// Create a pop-up to warn the user
		$('<div><p>Error : Cannot load configuration</p></div>')
			.appendTo('#mapContainer')
			.popup()
			.popup('open');
	});

/** When the document is ready, resolve the deferred object */
$(document).ready(doc_ready.resolve);

});