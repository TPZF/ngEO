
require.config({
     paths: {
        "jquery": "externs/jquery-1.8.3.min",
		"jquery.mobile": "externs/jquery.mobile-1.2.0"
	}
  });

/**
 * Home ngEO module
 */
require( ["jquery.mobile"] ,
		function() {
		
// Configure jQuery Mobile
$.mobile.ignoreContentEnabled = true;
$.mobile.ajaxEnabled = false;
$.mobile.linkBindingEnabled = false;
$.mobile.hashListeningEnabled = false;
$.mobile.pushStateEnabled = false;	
		

/** When the document is ready, clean-up styling */
$(document).ready( function() {
	
		// Remove some automatic styling from jQuery Mobile that don't fit in ngEO style
		$("body").removeClass("ui-mobile-viewport");
		$("header").find("a").removeClass("ui-link");
		
	});

});