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
var addPageContent = function(href,$div) {
	cache[href] = $div;
	$div.hide();
	$('#mapContainer').prepend($div);
}
 
 /**
  * Load a page
  */
 var loadPage = function(link,onload) {
 
	var href = link.attr('href');
	
	if ( link.data('page') ) {
	
		// Load the page and insert it
		$.ajax({
			url: link.data('page'),
			success: function(content) {
				
				var $div = $('<div id="' + href.substr(1) + '"></div>')
					.append(content);
					
				if ( !link.data('nowrap') ) {
					$div.children().wrapAll('<div class="menuBarPageContent"></div>');
					$div.addClass('menuBarPage');
				}
				
				addPageContent(href,$div);
				if (onload) onload($div);
			}
		});
		
	} else if ( link.data('module') ) {
		
		// Load and intialize the module
		require([link.data('module')], 
			function(Module) {
				var $div = Module.buildElement();
				addPageContent(href,$div);
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
	
		// Pre-process the links
		$(selector).find('a').each( function() {
			var jThis = $(this);
			var jContent = $(jThis.attr('href'));
			
			if ( jContent.length > 0 ) {
			
				if ( !jThis.data('nowrap') ) {
					jContent.children().wrapAll('<div class="menuBarPageContent"></div>');
					jContent.addClass('menuBarPage');
				}
				
				if ( !jThis.hasClass('active') ) {
					 jContent.hide();
				}
				
				cache[jThis.attr('href')] = jContent;
				
			}
		});
	
		// Store the active menu item
		activeMenuItem = $(selector).find('a.active');
		activePage = cache[ activeMenuItem.attr('href') ];
		if (!activePage) {
			loadPage(activeMenuItem, showPage);
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

