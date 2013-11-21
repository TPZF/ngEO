
define( [ "jquery", "backbone", "configuration", "dataAccess/model/downloadManagers", "text!dataAccess/template/directDownloadWidgetContent.html"], 
		function($, Backbone, Configuration, DownloadManagers, directDownload_Content  ) {


var DirectDownloadWidget = function(url) {

	var parentElement = $('<div id="directDownloadPopup" data-role="popup" data-overlay-theme="a" class="popup-widget-background">');
	parentElement = parentElement.appendTo('.ui-page-active');

	/**
	 *	Open the popup
	 */
	this.open = function(event) {
	
		
		parentElement.bind({
			popupafterclose : function(event, ui) {
				parentElement.remove();
			}
		});
				
		// Create the content
		if (DownloadManagers.get('downloadmanagers').length >= 1){
			parentElement.append(_.template(directDownload_Content, {url : url, downloadHelperUrl : Configuration.baseServerUrl + "/downloadHelper" + "?productURI=" + encodeURIComponent(url + '.ngeo')}));
		}else{
			parentElement.append(_.template(directDownload_Content, {url : url, downloadHelperUrl : false}));
		}
		
		parentElement.trigger('create');

		parentElement.popup();
		parentElement.popup("open", {
			x: event.pageX,
			y: event.pageY,
			positionTo: "origin"
		}); 
		
	};

		
	/**
	 *	For the moment not used since the popup can be 
	 *	closed by clicking out side its content.
	 */
	this.close = function() {
		parentElement.popup("close");
	};
};

return DirectDownloadWidget;

});





