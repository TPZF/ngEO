/**
 * Download options widget spawned-up from the results table view.
 * Used to update download options for the checked product urls.
 */

var Configuration = require('configuration');
var DownloadOptionsView = require('search/view/downloadOptionsView');
var DataSetSearch = require('search/model/datasetSearch');
var SearchResults = require('searchResults/model/searchResults');


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

	/**
	 *	Open the popup
	 */
	this.open = function(featureCollection) {

		// Update the selected download options model
		selectedDownloadOptions.attributes = featureCollection.getSelectedDownloadOptions();

		// Fetch the available download options and then display the widget
		featureCollection.fetchAvailableDownloadOptions(function(downloadOptions) {
			selectedDownloadOptions.set('downloadOptions', downloadOptions);
			
			// Update download options model for checked products
			// Need to do this cuz for two reasons:
			//  1) NGEO-1884: take the same properties as in search panel (DatasetSearch)
			//  2) downloadOptionsView checks preconditions depending on properties set on model
			for ( var i=0; i<downloadOptions.length; i++ ) {
				var downloadOption = downloadOptions[i];
				if ( DataSetSearch.get(downloadOption.argumentName) ) {
					selectedDownloadOptions.set(downloadOption.argumentName, DataSetSearch.get(downloadOption.argumentName)); // 1)
				} else {
					selectedDownloadOptions.set(downloadOption.argumentName, downloadOption.value[0].name); // 2) Take the first value
				}
			}

			var downloadOptionsView = new DownloadOptionsView({
				model: selectedDownloadOptions,
				el: element,
				updateCallback: function(event) {
					// Update the product url of the selected products with the selected download options
					return $.when(featureCollection.updateProductUrls(selectedDownloadOptions.attributes));
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