
define( [ "jquery", "configuration", "dataAccess/model/downloadManagers", "dataAccess/view/directDownloadView"], 
		function($, Configuration, DownloadManagers, DirectDownloadView  ) {


var DirectDownloadWidget = function(url) {

	var parentElement = $('<div id="directDownloadPopup" data-role="popup" data-position-to="origin" data-overlay-theme="a" class="ui-content popup-widget-background">');

	var element = $('<div id="directDownloadPopupContent"></div>'); 
	element.appendTo(parentElement);

	/**
		Build the content of the popup with the direct download links view
	 */
	var buildContent = function() {
		DownloadManagers.fetch().done(function() {
			var directDownloadView = new DirectDownloadView({el : element, url : url});
			directDownloadView.render();
		});
	};
	
	/**
	 *	Open the popup
	 */
	this.open = function() {
	
		buildContent();
		element.trigger('create');
		parentElement.popup(); 		
		parentElement.popup("open");  
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





