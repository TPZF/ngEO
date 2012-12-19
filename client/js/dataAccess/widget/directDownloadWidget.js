
define( [ "jquery", "configuration", "dataAccess/model/downloadManagers", "dataAccess/view/directDownloadView"], 
		function($, Configuration, DownloadManagers, DirectDownloadView  ) {


var DirectDownloadWidget = function(url) {

	var parentElement = $('<div id="directDownloadPopup" data-role="popup" data-overlay-theme="a" class="ui-content popup-widget-background">');

//	var element = $('<div id="directDownloadPopupContent"></div>'); 
//	element.appendTo(parentElement);

	/**
		Build the content of the popup with the direct download links view
	 */
	var buildContent = function() {
		DownloadManagers.fetch().done(function() {
			var directDownloadView = new DirectDownloadView({el : parentElement, url : url});
			directDownloadView.render();
		});
	};
	
	/**
	 *	Open the popup
	 */
	this.open = function() {
	
		buildContent();
		parentElement.bind({

			popupafterclose : function(event, ui) {
				parentElement.remove();
			}
		});
		
		//parentElement.popup({ "position-to" : "#retrieve" });  
		parentElement.popup();
		parentElement.popup("open"); 
		// trigger jqm styling
		parentElement.trigger('create');
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





