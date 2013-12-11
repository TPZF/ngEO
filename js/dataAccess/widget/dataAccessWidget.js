/**
  * Data widget module
  * Used to assign a download manager/product processing to a data access request
  */
define( [ "jquery", "configuration", 'dataAccess/view/downloadManagersListView', 'dataAccess/model/downloadManagers' ], 
		function($,Configuration, DownloadManagersListView, DownloadManagers) {


var DataAccessWidget = function() {

	var downloadManagersListView;
	
	var parentElement = $('<div id="dataAccessPopup">');
	var element = $('<div id="dataAccessPopupContent"></div>'); 
	element.appendTo(parentElement);
	parentElement.appendTo('.ui-page-active');
	var self = this;
	parentElement.ngeowidget({
		title: 'Data Access Request',
	});

	/**
		Open the popup
	 */
	this.open = function(request) {

		// Remove previous download managers list view if exists
		if ( downloadManagersListView )
		{
			downloadManagersListView.remove();
		}
		// Load DownloadManagers and then build and open the pop-up
		DownloadManagers.fetch().done(function() {
		
			// Create the view and render it
			downloadManagersListView = new DownloadManagersListView({
				model : DownloadManagers,
				el: element,
				selectedDownloadManager : "",
				request : request
			});
			downloadManagersListView.render();
			
			//Open the popup
			parentElement.ngeowidget("show");
		});
	};

		
	/**
	 *	For the moment not used since the popup can be 
	 *	closed by clicking out side its content.
	 */
	this.close = function() {
		downloadManagersListView.remove();
		parentElement.ngeowidget("hide");
	};
};

return new DataAccessWidget;

});





