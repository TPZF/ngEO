/**
  * Download options widget spawned-up from the results table view.
  * Used to update download options for the checked product urls.
  */


define( [ "jquery", "backbone", "configuration", 'search/view/downloadOptionsView', 'search/model/datasetSearch', 'searchResults/model/searchResults'], 
		function($, Backbone, Configuration, DownloadOptionsView, DataSetSearch, SearchResults) {


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
	
	// Use a model to store the download options of selected products
	var selectedDownloadOptions = new Backbone.Model();

	var downloadOptionsView = new DownloadOptionsView({
		model : selectedDownloadOptions,
		el: element
	});
		
	/**
	 *	Open the popup
	 */
	this.open = function(featureCollection) {
	
		//  Update the selected download options model
		selectedDownloadOptions.attributes = featureCollection.getSelectedDownloadOptions();
		
		// Fetch the available download options and then display the widget
		featureCollection.fetchAvailableDownloadOptions( function(downloadOptions) {
			selectedDownloadOptions.set( 'downloadOptions', downloadOptions );
			
			downloadOptionsView.render();
			
			downloadOptionsView.$el.append('\
				<div class="popup-widget-footer">\
					<button id="downloadOptionsUpdate" data-role="button" data-mini="true"\
							data-inline="true" data-theme="a">Update</button>\
					<div id="downloadOptionsMessage"></div>\
				</div>').trigger('create');
				
			// called when  'Update' is clicked
			downloadOptionsView.$el.find('#downloadOptionsUpdate').click( function(event){
				//update the product url of the selected products with the selected download options
				//and display a message to the user.
				$.when(featureCollection.updateProductUrls(selectedDownloadOptions.attributes)).done(function(){
					$("#downloadOptionsMessage").empty();
					$("#downloadOptionsMessage").append("<p>Download options updated.<p>");
				});
			});
				
			//trigger jqm styling
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

return DownloadOptionsWidget;

});





