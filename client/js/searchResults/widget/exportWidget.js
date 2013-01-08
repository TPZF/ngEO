/**
  * export widget module
  * Used to display the supported export formats. 
  */


define( [ "jquery", "configuration", 'searchResults/view/exportView', 'search/model/datasetSearch'], 
		function($, Configuration, ExportView, DataSetSearch) {


var ExportWidget = function() {

	var parentElement = $('<div id="exportPopup" data-role="popup" data-position-to="origin" data-overlay-theme="a" class="ui-content">');
	parentElement = parentElement.appendTo('.ui-page-active');
	
	var element = $('<div id="exportPopupContent"></div>'); 
	element.appendTo(parentElement);

	var exportView = new ExportView({
		model : DataSetSearch,
		el: element
	});
		
	/**
	 *	Open the popup
	 */
	this.open = function() {
	
		exportView.render();
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





