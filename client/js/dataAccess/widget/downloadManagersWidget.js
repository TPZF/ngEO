/**
  * download manager widget module
  * Used to assign a download manager to a data access request 
  * (either simple DAR or a standing order)
  */


define( [ "jquery", "configuration", 'dataAccess/view/downloadManagersListView', 'dataAccess/model/downloadManagers' ], 
		function($,Configuration, DownloadManagersListView, DownloadManagers) {


var DownloadManagersWidget = function(request) {

	var parentElement = $('<div id="downloadManagersPopup" data-role="popup" data-overlay-theme="a" class="ui-content popup-widget-background">');

	var element = $('<div id="downloadManagersPopupContent"></div>'); 
	element.appendTo(parentElement);

	/**
		Build the content of the popup with the download managers view
	 */
	var buildContent = function() {

		DownloadManagers.fetch().done(function() {
		
			var downloadManagersListView = new DownloadManagersListView({
				model : DownloadManagers,
				el: element,
				selectedDownloadManager : "",
				request : request
			});
			
			downloadManagersListView.render();		
		});
	};
		
	/**
		Open the popup
	 */
	this.open = function() {
	
		buildContent();
			
		//after closing the popup reset the simple data access parameters 
		//and remove the popup elements
		parentElement.bind({
		   popupafterclose: function(event, ui) {
			   request.initialize();
			   parentElement.remove();
		   }
		   
		});
		
		//Open the popup
		//parentElement.popup({ "position-to" : "#searchCriteriaSummaryContainer" }); 
		parentElement.popup();
		parentElement.popup("open");
		window.resizeTo(window.innerWidth, window.innerHeight);
	};

		
	/**
	 *	For the moment not used since the popup can be 
	 *	closed by clicking out side its content.
	 */
	this.close = function() {
		parentElement.popup("close");
	};
};

return DownloadManagersWidget;

});





