/**
  * export widget module
  * Used to display the supported export formats. 
  */


define( [ "jquery", "configuration", 'shopcart/view/shopcartExportView', 'ui/widget'], 
		function($, Configuration, ShopcartExportView, ngeoWidget) {


var ShopcartExportWidget = function() {

	var parentElement = $('<div id="exportShopcartPopup">');
	var element = $('<div id="exportShopcartPopupContent"></div>');
	element.css('min-width','200px');
	element.appendTo(parentElement);
	parentElement.appendTo('.ui-page-active');
	parentElement.ngeowidget({
		title: "Export Shopcart",
		// Reinit the standing order when the widget is closed (FL: is it really needed?)
		hide: function() {
			parentElement.remove();
		}
	});

	var exportView = new ShopcartExportView({
		el: element
	});
		
	/**
	 *	Open the popup
	 */
	this.open = function() {
	
		exportView.render();
			
		//trigger jqm styling
		parentElement.ngeowidget("show"); 
	};
		
	/**
	 *	For the moment not used since the popup can be 
	 *	closed by clicking out side its content.
	 */
	this.close = function() {
		parentElement.ngeowidget("hide");
	};
};

return ShopcartExportWidget;

});





