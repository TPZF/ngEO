
require.config({
     paths: {
        "jquery": "externs/jquery-1.8.3.min",
		"jquery.mobile": "externs/jquery.mobile-1.2.0",
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
            exports: '$'
        }
	}
  });

/**
 * Main ngEO module
 */
require( ["jquery.mobile"] ,
		function() {

/** When the document is ready, clean-up styling */
$(document).ready( function() {
	
		// Remove some automatic styling from jQuery Mobile that don't fit in ngEO style
		$("body").removeClass("ui-mobile-viewport");
		$("header").find("a").removeClass("ui-link");
		
/*		$('#content').load("index.html", function() {
			$('.right').load("Overview.html");
			$('#content').find('a').click( function() {
				$('.right').load( $(this).attr('href') );
				return false;
			});
			
			
		});*/
		
	});

});