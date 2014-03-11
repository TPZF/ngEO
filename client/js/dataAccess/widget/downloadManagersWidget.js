/**
  * download manager widget module
  * Used to assign a download manager to a data access request 
  * (either simple DAR or a standing order)
  */


define( [ "jquery", "configuration", 'dataAccess/view/downloadManagersListView', 'dataAccess/model/downloadManagers' ], 
		function($,Configuration, DownloadManagersListView, DownloadManagers) {


var DownloadManagersWidget = function(request) {

	var downloadManagersListView;
	
	var parentElement = $('<div id="downloadManagersPopup">');

	var element = $('<div id="downloadManagersPopupContent"></div>'); 
	element.appendTo(parentElement);
	parentElement.appendTo('.ui-page-active');
	parentElement.ngeowidget({
		title: 'Data Access Request',
		hide: function() {
			//request.initialize();
			parentElement.remove();
			downloadManagersListView.remove();
		}
	});


	/**
		Open the popup
	 */
	this.open = function() {
	
		// Load DownloadManagers and then build and open the pop-up
		DownloadManagers.fetch().done(function() {
		
			// Create the view and render it
			downloadManagersListView = new DownloadManagersListView({
				model : DownloadManagers,
				el: element,
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
		parentElement.ngeowidget("hide");
	};
};

return DownloadManagersWidget;

});





