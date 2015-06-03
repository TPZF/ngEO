
define(["jquery.mobile"], 
	function() {
	
/**
 * The tooltip used to display context help
 */
var tooltip;

/**
 * Margin used by tooltip
 */
var topMargin = 10;

/**
 * Margin used by tooltip
 */
var startContent = "Click on interfaces element for context help.";

/**
 * Place the tooltip for context help
 */
var placeTooltip = function (element) {
	// Two cases : tooltip is attached to an element or not
	if (!element) {
		// Center the tooltip
		tooltip.find('p').html( startContent );
		var offset = {
			top: $(window).height()/2 - tooltip.outerHeight()/2,
			left: $(window).width()/2 - tooltip.outerWidth()/2
		};
		tooltip.offset(offset);
	} else {
		// Place the tooltip just below the element
		var $element = $(element);
		tooltip.find('p').html( $element.data('help') );
		var offset = {
			top: $element.offset().top + $element.outerHeight() + topMargin,
			left: $element.offset().left + $element.outerWidth()/2 - tooltip.outerWidth()/2
		};
		tooltip.offset(offset);
	}
};

/**
 * Handler to show help tooltip for elements containing "data-help" attribute
 * Checks the target element and its parent
 */
var onElementHelpClicked = function(event) {
	var helpTarget = $(event.target).is('[data-help]') ? event.target : $(event.target.parentElement).is('[data-help]') ? event.target.parentElement : null;
	if ( helpTarget ) {
		placeTooltip( helpTarget );
		event.stopPropagation();
		event.preventDefault();
		return false;
	} else {
		return true;
	}
};

return function(element) {

	// Add the tooltip element
	tooltip = $('<div class="ui-popup-container ui-popup-active">\
					<div class="ui-popup ui-overlay-shadow ui-corner-all ui-body-e"><p></p>\
					</div></div>').appendTo(element);
					
	// Increment the z-index, 1100 is for widget and popup, 1101 for icons in the popup (close button)
	// So 1102 is used for context help tooltip to be always above
	tooltip.css("z-index", 1102 );
	tooltip.hide();
	
	// Setup behavioir when the context help button is clicked
	$("#help").click( function() {
		var $this = $(this);
		if ( $this.hasClass('toggle') ) {
			tooltip.hide();
			$this.removeClass('toggle');
			$('[data-help]').css({ 
				cursor: 'inherit'
			});
			$('body').get(0).removeEventListener("click", onElementHelpClicked, true );
		} else {
			tooltip.show();
			placeTooltip();
			$('[data-help]').css({ 
				cursor: 'help',
				'pointer-events': 'auto'
			});
			$('body').get(0).addEventListener("click", onElementHelpClicked, true );
			$this.addClass('toggle');
		}
		
	});
};

});
