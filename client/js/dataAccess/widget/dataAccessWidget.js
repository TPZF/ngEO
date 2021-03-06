/**
 * Data widget module
 * Used to assign a download manager/product processing to a data access request
 */

var Configuration = require('configuration');
var DataAccessRequestView = require('dataAccess/view/dataAccessRequestView');
var DownloadManagers = require('dataAccess/model/downloadManagers');
var ngeoWidget = require('ui/widget');

var DataAccessWidget = function() {

	var parentElement = $('<div id="dataAccessPopup">');
	var element = $('<div id="dataAccessPopupContent"></div>');
	element.appendTo(parentElement);
	parentElement.appendTo('.ui-page-active');
	var self = this;
	parentElement.ngeowidget({
		title: 'Data Access Request'
	});

	var dataAccessRequestView = new DataAccessRequestView({
		model: DownloadManagers,
		el: element
	});

	/**
	 *	Open the popup
	 *	@param request
	 *		The request to be used by widget: could be SimpleDataAccessRequest or StandingOrderDataAccessRequest
	 */
	this.open = function(request) {

		// Load the available download managers: even if fetch has failed
		DownloadManagers.fetch().complete(function() {
			// Build the given request
			dataAccessRequestView.setRequest(request);
			dataAccessRequestView.render();

			// Open the popup
			parentElement.ngeowidget("show");
		});
	};


	/**
	 *	For the moment not used since the popup can be 
	 *	closed by clicking out side its content.
	 */
	this.close = function() {
		parentElement.ngeowidget("hide");
	};
};

module.exports = new DataAccessWidget();