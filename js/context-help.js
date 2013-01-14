
define(["jquery.mobile"], 
	function() {
	
var tooltip;

var placeTooltip = function () {
	var windowWidth = $(window).width();
	var windowHeight = $(window).height();
	tooltip.offset({ top: windowHeight/2, left: windowWidth/2 });
};

return function(element) {

	// Add the tooltip element
	tooltip = $('<div class="ui-popup-container ui-popup-active">\
					<div class="ui-popup ui-overlay-shadow ui-corner-all ui-body-e"><p>Coucou</p>\
					</div></div>').appendTo(element);
	tooltip.hide();
	

	$("#help").click( function() {
		var $this = $(this);
		if ( $this.hasClass('toggle') ) {
			tooltip.hide();
			$this.removeClass('toggle');
		} else {
			tooltip.show();
			placeTooltip();
			$this.addClass('toggle');
		}
		
	});
};

});
