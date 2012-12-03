/**
  * download manager widget module
  */


define( [ "jquery", "configuration", 'dataAccess/view/downloadManagersListView', 'dataAccess/model/downloadManagers' ], 
		function($,Configuration, DownloadManagersListView, DownloadManagers) {


var DownloadManagersWidget = function(request) {

	var parentElement = $('<div id="downloadManagersPopup" data-role="popup" data-position-to="origin" data-overlay-theme="a" class="ui-content">');
	parentElement.attr('style', '{"background" : "@widget-background-color"}');

	var element = $('<div id="downloadManagersPopupContent"></div>'); 
	element.appendTo(parentElement);
	//parentElement.appendTo(container);

	/**
		Build the content of the popup from the given product
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
			
			downloadManagersListView.$el.trigger('create');
		});
	};
		
	/**
		Open the popup
	 */
	this.open = function() {
	
		buildContent();
		parentElement.popup(); 		
			
		//after closing the popup reset the simple data access parameters 
		parentElement.bind({
		   popupafterclose: function(event, ui) {
			   //container.remove(parentElement);
			   request.initialize();
			   parentElement.remove();
		   }
		   
		});
		
		//trigger jqm styling
		parentElement.popup("open");  
	};

		
	/**
		Close the popup
	 */
	this.close = function() {
		parentElement.popup("close");
	};
};

return DownloadManagersWidget;

});





