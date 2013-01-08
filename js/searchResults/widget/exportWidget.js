/**
  * export widget module
  * Used to display the supported export formats. 
  */


define( [ "jquery", "configuration", 'searchResults/view/downloadOptionsWidgetView', 'search/model/datasetSearch'], 
		function($, Configuration, DownloadOptionsWidgetView, DataSetSearch) {


var ExportWidget = function() {

	var parentElement = $('<div id="exportPopup" data-role="popup" data-position-to="origin" data-overlay-theme="a" class="ui-content popup-widget-background ">');
	parentElement = parentElement.appendTo('.ui-page-active');
	
	var element = $('<div id="exportPopupContent"></div>'); 
	element.appendTo(parentElement);

	var downloadOptionsWidgetView = new DownloadOptionsWidgetView({
		model : DataSetSearch,
		el: element
	});
		
	/**
	 *	Open the popup
	 */
	this.open = function() {
	
		downloadOptionsWidgetView.render();
		parentElement.popup(); 		
		
		
		
		//after closing the popup reset the simple data access parameters 
		//and remove the popup elements
		parentElement.bind({
		   popupafterclose: function(event, ui) {
			   parentElement.remove();
		   }
		
		});
		
		//trigger jqm styling
		parentElement.popup("open"); 
		//TODO fix the selected value for the combos
		downloadOptionsWidgetView.setSelectedValues();
	};
		
	/**
	 *	For the moment not used since the popup can be 
	 *	closed by clicking out side its content.
	 */
	this.close = function() {
		parentElement.popup("close");
	};
};

return ExportWidget;

});





