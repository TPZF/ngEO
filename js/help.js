
require.config({
     paths: {
        "jquery": "externs/jquery-1.8.3.min",
		"jquery.mobile": "externs/jquery.mobile-1.2.0",
        "underscore": "externs/underscore",
		"backbone": "externs/backbone"
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
require( ["jquery.mobile", "backbone"] ,
		function() {
		
/** 
	Load a page from help
 */
function loadPage(url) {
	$.ajax({
	  url: url,
	  dataType: 'text',
	  success: function(data) {
		var $container = $('#contentContainer');
		
		// Fix image path
		// Use a regexp to have some preloading when using .html()
		var fixImgData = data.replace(/<img([^>]*)\ssrc=['"]([^'"]+)['"]/gi, "<img$1 src='pages/userManual/$2'");
		
		// Set HMTL and called trigger create to apply jQM styling
		$container
			.html(fixImgData)
			.trigger('create');
		
		// Manage fragment in the URL
		var posFrag = url.indexOf('#');
		if ( posFrag >= 0 ) {
			var $fragment = $( url.substr( posFrag ) );
			if ( $fragment.length > 0 ) {
				$container.scrollTop( $fragment.offset().top + $container.scrollTop() - $container.offset().top );
			}
		} else {
			$container.scrollTop(0);
		}
	  }
	});
}

/** 
	Callback when window is resized
 */
function onWindowResize() {
	$('#contentContainer').height( $(window).height() - $('header').outerHeight(true) );
}

/** When the document is ready, clean-up styling */
$(document).ready( function() {

		var router = new Backbone.Router();
		router.route("chapter/:chapter(/:section)", "chapter", function(chapter,section) {
			var url = "pages/userManual/" + chapter + ".html";
			if ( section ) {
				url += "#" + section;
			}
			loadPage( url );
		});
		router.route("", "index", function() {
			loadPage("pages/userManual/overview.html");
		});
	
		// Remove some automatic styling from jQuery Mobile that don't fit in ngEO style
		$("body").removeClass("ui-mobile-viewport");
		$("header").find("a").removeClass("ui-link");
		
		onWindowResize();
		$(window).resize(onWindowResize);
			
		Backbone.history.start();
	});

});