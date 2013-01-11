/**
  * Download options widget spawned-up from the results table view.
  * Used to update download options for the checked product urls.
  */


define( [ "jquery", "configuration", 'searchResults/view/downloadOptionsWidgetView', 'search/model/datasetSearch'], 
		function($, Configuration, DownloadOptionsWidgetView, DataSetSearch) {


var DownloadOptionsWidget = function() {

	var parentElement = $('<div id="downloadOptionsPopup">');
	parentElement = parentElement.appendTo('.ui-page-active');
	
	var element = $('<div id="downloadOptionsPopupContent"></div>'); 
	element.appendTo(parentElement);
	
	parentElement.ngeowidget({
		title: "Download Options",
		hide: function() {
			parentElement.remove();
		}
	});

	var downloadOptionsWidgetView = new DownloadOptionsWidgetView({
		model : DataSetSearch,
		el: element
	});
		
	/**
	 *	Open the popup
	 */
	this.open = function() {
	
		downloadOptionsWidgetView.render();
			
		//trigger jqm styling
		parentElement.ngeowidget("show"); 
		//TODO fix the selected value for the combos
		downloadOptionsWidgetView.setSelectedValues();
	};
		
	/**
	 *	For the moment not used since the popup can be 
	 *	closed by clicking out side its content.
	 */
	this.close = function() {
		parentElement.ngeowidget("hide");
	};
};

return DownloadOptionsWidget;

});





