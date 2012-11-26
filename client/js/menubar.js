/**
 * MenuBar module
 * Manage page and module dynamic loading
 * Page are display above the map, with transparent background.
 */
define(['jquery','require'], function($,require) {

/**
 * The currently active menu item
 */
var activeMenuItem = null;

/**
 * The currently active page
 */
var activePage = null;

/**
 * Cache for menu page content
 */
 var cache = {};
 
  
 /**
  * Add page content
  */
var addPageContent = function($link,$div) {
	// Wrap the page co
	if ( !$link.data('nowrap') ) {
		$div.children().wrapAll('<div class="menuBarPageContent"></div>');
		$div.addClass('menuBarPage');
	}
	cache[ $link.attr('href') ] = $div;
	$div.hide();
	$('#mapContainer').prepend($div);
}
 
 /**
  * Load a page
  */
 var loadPage = function($link,onload) {
 
	var href = $link.attr('href');
	
	if ( $link.data('page') ) {
	
		// Load the page and insert it to the main page
		$.ajax({
			url: $link.data('page'),
			success: function(content) {
				
				// Add a div to embed page content
				var $div = $('<div id="' + href.substr(1) + '"></div>')
					.append(content);				
				addPageContent($link,$div);
				if (onload) onload($div);
			}
		});
		
	} else if ( $link.data('module') ) {
		
		// Load and intialize the module
		require([$link.data('module')], 
			function(Module) {
				// First build the div and add it to build content
				var $div = Module.buildElement();
				addPageContent($link,$div);
				Module.initialize();
				if (onload) onload($div);
		});
	
	}
	
 };
 
/**
 * Show a page
 */
var showPage = function(page) {
	if ( activePage ) {
		activePage.slideUp( 200, function() { page.slideDown(200); activePage = page; } );
	} else {
		page.slideDown(200);
		activePage = page;
	}
 };

return {
	initialize: function(selector) {
		// Traverse all the links and search if the div is not already contained in the main page
		$(selector).find('a').each( function() {
			var jThis = $(this);
			var jContent = $(jThis.attr('href'));
			
			if ( jContent.length > 0 ) {
			
				addPageContent(jThis,jContent);
			}
		});
	
		// Store the active menu item
		activeMenuItem = $(selector).find('a.active');
		activePage = cache[ activeMenuItem.attr('href') ];
		if (!activePage) {
			loadPage(activeMenuItem, showPage);
		} else {
			activePage.show();
		}		
		
		// Add interaction when user clicks on the link
		// Display the content, and hide previous one
		$(selector).find('a').click( function() {
			var jThis = $(this);
			if ( !jThis.hasClass('active') ) {
			
				// Check if the page already exists, load it if yes, otherwise first load it
				var pageRef = jThis.attr('href');
				if ( cache[pageRef] ) {
					showPage( cache[pageRef] );
				} else {
					loadPage(jThis, showPage);
				}
				
				// Update active menu item
				jThis.addClass('active');
				activeMenuItem.removeClass('active');
				activeMenuItem = jThis;
			}

			return true;			
		});
	}
};

});

