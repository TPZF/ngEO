
/*
* define(["jquery.mobile"]
*/
	
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
var startContent = "Mouse over interface elements for context help.";

/**
 * Current state of help component
 */
var helpActivated = false;

/**
 * Place the tooltip for context help
 */
var placeTooltip = function (element) {
	tooltip.show();
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
			top: $element.offset().top + $element.outerHeight(),
			left: $element.offset().left + $element.outerWidth()/2 - tooltip.outerWidth()/2
		};
		tooltip.offset(offset);
	}
};

/**
 *	Lazy hide function which debounces after 500ms
 *	Hides tooltip depending on hide boolean
 */
var lazyHide = _.debounce(function(hide) {
	if ( hide ) {
		tooltip.hide();
	} else {
		lazyHide(hide);
	}
}, 500)

/**
 * Handler to show help tooltip for elements containing "data-help" attribute
 * Checks the target element and its parent
 */
var onElementHelpClicked = function(event) {
	// OLD code to store data-help on tb-icon, discarded by NGEO-2003
	// var helpTarget = $(event.target).is('[data-help]') ? event.target : $(event.target.parentElement).is('[data-help]') ? event.target.parentElement : null;
	// if ( helpTarget ) {
	// 	placeTooltip(helpTarget);
	if ( helpActivated && !$(event.target).closest('#help').length ) {
		var helpTarget = $(event.target).is('[data-help]') ? $(event.target) : $(event.target).closest('[data-help]');
		if ( helpTarget.length ) {
			placeTooltip( helpTarget );
		}
		event.stopPropagation();
		event.preventDefault();
		return false;
	} else {
		return true;
	}
};

/**
 * Handler to show help tooltip for elements containing "data-help" attribute
 * Checks the target element and its parent
 */
var onElementHelpOver = function(event) {
	//var helpTarget = $(event.target).is('[data-help]') ? event.target : $(event.target.parentElement).is('[data-help]') ? event.target.parentElement : null;
	var helpTarget = $(event.target).is('[data-help]') ? $(event.target) : $(event.target).closest('[data-help]');
	if ( helpTarget ) {
		placeTooltip( helpTarget );
		lazyHide(false);
		event.stopPropagation();
		event.preventDefault();
		return false;
	} else {
		return true;
	}
};

module.exports = function(element) {

	// Add the tooltip element
	tooltip = $('<div class="helpTooltip ui-popup-container ui-popup-active">\
					<div class="ui-popup ui-overlay-shadow ui-corner-all ui-body-e"><p></p>\
					</div></div>').appendTo(element);
	// Increment the z-index, 1100 is for widget and popup, 1101 for icons in the popup (close button)
	// So 1102 is used for context help tooltip to be always above
	tooltip.css("z-index", 1102 );
	tooltip.hide();
	
	var hideTooltip = function(event) {
		if ( $(event.target).closest('.helpTooltip').length || $(event.target).is('[data-help]') || $(event.target).closest('[data-help]').length ) {
			// Do not hide tooltip while the mouse is over tooltip or help
			lazyHide(false);
		} else {
			// Hide it otherwise
			lazyHide(true);
		}
	}

	// Setup behavioir when the context help button is clicked
	$("#help").click( function() {
		var $this = $(this);
		if ( $this.hasClass('toggle') ) {
			tooltip.hide();
			$this.removeClass('toggle');
			$('[data-help]').removeClass('helpActivated');
			$('[data-help]').off("mouseover", onElementHelpOver);
			$('body').off("mousemove", hideTooltip)
			$('body').get(0).removeEventListener("click", onElementHelpClicked, true );
		} else {
			tooltip.show();
			placeTooltip();
			$('[data-help]').addClass('helpActivated');
			$('[data-help]').on("mouseover", onElementHelpOver);
			$('body').on("mousemove", hideTooltip);
			$('body').get(0).addEventListener("click", onElementHelpClicked, true );
			$this.addClass('toggle');
		}
		helpActivated = !helpActivated;
		
	});
};
