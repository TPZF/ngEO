/**
 * Download options widget spawned-up from the results table view.
 * Used to update download options for the checked product urls.
 */

var Configuration = require('configuration');
var DownloadOptionsView = require('search/view/downloadOptionsView');
var DataSetSearch = require('search/model/datasetSearch');
var SearchResults = require('searchResults/model/searchResults');
var DownloadOptions = require('search/model/downloadOptions');


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
	var selectedDownloadOptions = new Backbone.Model({
		downloadOptions: {}
	});

	/**
	 *	Open the popup
	 */
	this.open = function(featureCollection) {

		// Update the selected download options model
		selectedDownloadOptions.attributes = featureCollection.getSelectedDownloadOptions();
		var datasetId = featureCollection.dataset.get("datasetId");

		// Fetch the available download options and then display the widget
		featureCollection.fetchAvailableDownloadOptions(function(datasetDownloadOptions) {
			//selectedDownloadOptions.set('downloadOptions', downloadOptions);
			
			// Stub_server HACK: Nominally, the getSelectedDownloadOptions must extract the ngEO_DO from productUrl, so no need to set downloadOptions
			// Since our stub currently doesn't have ngEO_DO on productUrl, force the the client to set:
			//	Two options:
			//		1) Set as @conflict
			//		2) Same as DataSetSearch : could bring to confusion..
			var widgetDownloadOptions = new DownloadOptions(datasetDownloadOptions);
			var fcDownloadOptions = featureCollection.getSelectedDownloadOptions();
			for ( var i=0; i<datasetDownloadOptions.length; i++ ){
				var key = datasetDownloadOptions[i].argumentName;
				if ( key == "cropProduct" ) {
					widgetDownloadOptions.attributes[key] = true; // HACK: Set true by default
				} else {
					if ( fcDownloadOptions[key] ) {
						widgetDownloadOptions.attributes[key] = fcDownloadOptions[key];
					} else {
						widgetDownloadOptions.attributes[key] = "@conflict";
					}
				}
			}
			
			var downloadOptionsView = new DownloadOptionsView({
				model: widgetDownloadOptions,
				el: element,
				updateCallback: function(event) {
					// Update the product url of the selected products with the selected download options
					var attributes = widgetDownloadOptions.getAttributes();
					return $.when(featureCollection.updateDownloadOptions(attributes));
				}
			});
			downloadOptionsView.render();

			// Trigger jqm styling
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

module.exports = DownloadOptionsWidget;