
require.config({
     paths: {
        "jquery": "externs/jquery-1.8.3",
		"jquery.mobile": "externs/jquery.mobile-1.2.0",
        //"jquery": "//ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min",
		//"jquery.mobile": "http://code.jquery.com/mobile/1.2.0/jquery.mobile-1.2.0.min",
		"jquery-gantt" : "externs/jquery.fn.gantt",
		"jqm-datebox-calbox" : "externs/jqm-datebox-1.1.0.mode.calbox",
		"jqm-datebox-datebox" : "externs/jqm-datebox-1.1.0.mode.datebox",
		"jqm-datebox-core" : "externs/jqm-datebox-1.1.0.core",
		"jquery.dataTables" : "externs/jquery.dataTables",
        "underscore": "externs/underscore",
		"backbone": "externs/backbone",
		"text": "externs/text"
   },
	shim: {
        
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
        
        'jquery-gantt': {
            deps: ['jquery'],
            exports: 'jQuery'
        }
               
	}
		
  });

/**
 * Main ngEO module
 */
require( ["require", "jquery", "configuration", "ui/menubar", "logger", "backbone", "jquery.mobile", 'shopcart/model/shopcartCollection'] ,
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
					
			// Initialize menu bar
			MenuBar.initialize("header nav");
			
			// Initialize map
			Map.initialize("map");
			
		});
		
	})
	.fail( function(jqXHR, textStatus, errorThrown) {
		Logger.error('Cannot load configuration : ' + errorThrown);
	});

/** When the document is ready, resolve the deferred object */
$(document).ready(doc_ready.resolve);

});