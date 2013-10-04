
require.config({
     paths: {
        "jquery": "externs/jquery-1.8.3",
		"jquery.mobile": "externs/jquery.mobile-1.2.0",
        //"jquery": "//ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min",
		//"jquery.mobile": "http://code.jquery.com/mobile/1.2.0/jquery.mobile-1.2.0.min",
        "underscore": "externs/underscore",
		"backbone": "externs/backbone"
  }
  
});

/**
 * Main ngEO module
 */
require( ["jquery.mobile", "backbone", "externs/jquery.imagesloaded"] ,
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
			
				$container.imagesLoaded( function() {
					$container.scrollTop( $fragment.offset().top + $container.scrollTop() - $container.offset().top );
				});
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