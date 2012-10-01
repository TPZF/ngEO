/**
 * MenuBar module
 * Basic MenuBar with internal div.
 */
define(['jquery'], function($) {

var activeMenuItem = null;

return {
	initialize: function(selector) {
	
		// Hide the not active href
		$(selector).find('a').each( function() {
			var jThis = $(this);
			var jContent = $(jThis.attr('href'));
			
			if ( !jThis.data('nowrap') ) {
				jContent.children().wrapAll('<div class="menuBarPageContent"></div>');
				jContent.addClass('menuBarPage');
			}
			
			if ( !jThis.hasClass('active') ) {
				 jContent.hide();
			}
		});
	
		// Store the active menu item
		activeMenuItem = $(selector).find('a.active');
		
		// Add interaction when user clicks on the link
		// Display the content, and hide previous one
		$(selector).find('a').click( function() {
			var jThis = $(this);
			if ( !jThis.hasClass('active') ) {
				$(activeMenuItem.attr('href')).slideUp( 200, function() { $(jThis.attr('href')).slideDown(200); } );
				jThis.addClass('active');
				activeMenuItem.removeClass('active');
				
				activeMenuItem = jThis;
			}	
		});
	}
};

});

