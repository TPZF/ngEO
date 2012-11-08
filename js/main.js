
require.config({
     paths: {
        "jquery": "externs/jquery-1.8.2.min",
		"jquery.mobile": "externs/jquery.mobile-1.2.0",
		"jqm-datebox-calbox" : "externs/jqm-datebox-1.1.0.mode.calbox",
		"jqm-datebox-core" : "externs/jqm-datebox-1.1.0.core",
		"jquery.dataTables" : "externs/jquery.dataTables",
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
require( ["require", "jquery", "configuration", "menubar", "backbone", "jquery.mobile"] ,
		function(require, $,Configuration, MenuBar) {

/** Console fix	: create a dummy console.log when console is not present. Otherwise it is not working on some browser configuration */
window.console || (console={log:function(){}});

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
	require(["map/map"], function(Map) {
		Map.initialize("mapContainer");
	});
		
});

/** When the document is ready, resolve the deferred object */
$(document).ready(doc_ready.resolve);

});