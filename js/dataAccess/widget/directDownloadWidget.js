
define( [ "jquery", "configuration", "dataAccess/model/downloadManagers", "dataAccess/view/directDownloadView"], 
		function($, Configuration, DownloadManagers, DirectDownloadView  ) {


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
		
		DownloadManagers.fetch().done(function() {
			
			var directDownloadView = new DirectDownloadView({
				el : parentElement,
				url : url});
			
			directDownloadView.render();

			parentElement.popup();
			parentElement.popup("open", {
				x: event.pageX,
				y: event.pageY,
				positionTo: "origin"
			}); 
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





