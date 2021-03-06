/**
 * export widget module
 * Used to display the supported export formats. 
 */
var Configuration = require('configuration');
var ExportView = require('searchResults/view/exportView');
var ngeoWidget = require('ui/widget');

var ExportWidget = function(featureCollection) {

	var parentElement = $('<div id="exportPopup">');
	var element = $('<div id="exportPopupContent"></div>');
	element.css('min-width', '200px');
	element.appendTo(parentElement);
	parentElement.appendTo('.ui-page-active');
	parentElement.ngeowidget({
		title: "Export",
		// Reinit the standing order when the widget is closed (FL: is it really needed?)
		hide: function() {
			parentElement.remove();
		}
	});

	var exportView = new ExportView({
		model: featureCollection,
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

module.exports = ExportWidget;