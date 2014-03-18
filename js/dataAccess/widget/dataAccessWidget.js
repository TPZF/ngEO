/**
  * Data widget module
  * Used to assign a download manager/product processing to a data access request
  */
define( [ "jquery", "configuration", 'dataAccess/view/dataAccessRequestView', 'dataAccess/model/downloadManagers', 'ui/widget' ], 
		function($,Configuration, DataAccessRequestView, DownloadManagers) {


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
				model : DownloadManagers,
				el: element
			});

	/**
		Open the popup
	 */
	this.open = function(request) {

		// Load DownloadManagers and then build and open the pop-up
		DownloadManagers.fetch().done(function() {
		
			dataAccessRequestView.setRequest(request);
			dataAccessRequestView.render();
			
			//Open the popup
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

return new DataAccessWidget;

});





