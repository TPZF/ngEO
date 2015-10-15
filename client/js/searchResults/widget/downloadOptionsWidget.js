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