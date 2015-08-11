
// TODO: move require config to separate config file
require.config({
     paths: {
        "jquery": "../bower_components/jquery/dist/jquery.min",
		"jquery.mobile": "../bower_components/jquery-mobile-bower/js/jquery.mobile-1.3.2.min",
        // "jquery.mobile": "http://code.jquery.com/mobile/1.4.5/jquery.mobile-1.4.5.min",
        "jqm-datebox": "externs/jqm-datebox-1.4.0",
		"jquery.dataTables" : "externs/jquery.dataTables",
		"jquery.autocomplete": "externs/jquery.auto-complete",
		//"jquery.easings": "externs/jquery.easings",
        "underscore": "externs/underscore",
		"backbone": "externs/backbone",
        "highchecktree": "externs/highchecktree",
		"text": "externs/text"
   },
	shim: {
        
        'jqm-datebox' : {
            deps: ['jquery', 'jquery.mobile'],
            exports: 'jQuery'
        },

        'highchecktree' : {
            deps: ['jquery'],
            exports: 'jQuery'
        }
        /*,

        'jquery.easings' : {
        	deps: ['jquery'],
        	exports: 'jQuery'
        }*/
        
	}
	
  });

/**
 * Main ngEO module
 */
require( ["require", "jquery", "configuration", "ui/menubar", "ui/context-help", "logger", "backbone", "jquery.mobile", 'shopcart/model/shopcartCollection', 'ui/toolbar', 'highchecktree'],
		function(require, $, Configuration, MenuBar, ContextHelp, Logger, Backbone) {
		
/** Use a defered object for document ready */
var doc_ready = $.Deferred();

// Remove history to avoid popups refreshing the page on close (related to migration of jqm from 1.2 to 1.3)
// For more details see: http://stackoverflow.com/questions/11907944/closing-jquery-mobile-new-popup-cause-page-to-refresh-uselessly
// TODO: find better solution
$.mobile.popup.prototype.options.history = false;

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
			
			$.mobile.activePage.find('#helpToolbar').toolbar({ onlyIcon: false });
			ContextHelp($.mobile.activePage);
		});
		
	})
	.fail( function(jqXHR, textStatus, errorThrown) {
		Logger.error('Cannot load configuration : ' + errorThrown);
	});

/** When the document is ready, resolve the deferred object */
$(document).ready(doc_ready.resolve);

});