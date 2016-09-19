var DownloadOptionsView = require('search/view/downloadOptionsView');
var DataSetSearch = require('search/model/datasetSearch');
var DataSetPopulation = require('search/model/dataSetPopulation');
var DownloadOptions = require('search/model/downloadOptions');

/**
 *	Download options widget allowing to update download options from table view
 *	Current widget could be initialized within a feature collection XOR download options
 *	In case of feature collection: widget will retrieve download options from dataset for selected products
 *	In case of download options it will use it as it is (used for shopcart for now)
 *	-> MS: second case seems to be not really necessary.. to be checked
 *	
 *	@param options 	Available options:
 *			<ul>
 *				<li>{Object} featureCollection: Feature collection</li>
 *				<li>{Object} downloadOptions: Download options</li>
 *				<li>{Function} callback: Callback function to be called when do has been updated</li>
 *			</ul>
 */
var DownloadOptionsWidget = function( options ) {

	this.featureCollection = options.featureCollection;
	this.datasetId = options.datasetId ? options.datasetId : options.featureCollection.dataset.get("datasetId");
	this.callback = options.callback;

	this.parentElement = $('<div id="downloadOptionsPopup">\
		<div id="downloadOptionsPopupContent"></div>\
	</div>').appendTo('.ui-page-active');

	var self = this;
	this.parentElement.ngeowidget({
		title: "Download Options",
		hide: function() {
			self.parentElement.remove();
		}
	});
};

/**
 *	Open the popup
 */
DownloadOptionsWidget.prototype.open = function() {
	var self = this;
	// Make request to know download options of given dataset
	DataSetPopulation.fetchDataset(this.datasetId, function(dataset) {
		var datasetDownloadOptions = dataset.get("downloadOptions");
		self.widgetDownloadOptions = new DownloadOptions(datasetDownloadOptions);

		var fcDownloadOptions = self.featureCollection.getSelectedDownloadOptions();
		for ( var i=0; i<datasetDownloadOptions.length; i++ ) {
			var key = datasetDownloadOptions[i].argumentName;
			if ( datasetDownloadOptions[i].cropProductSearchArea == "true" ) {
				// Should be true or false & not the real WKT value (to be verified)..
				self.widgetDownloadOptions.attributes[key] = fcDownloadOptions.hasOwnProperty(key) ? fcDownloadOptions.hasOwnProperty(key) : null;
			} else {
				if ( fcDownloadOptions[key] ) {
					self.widgetDownloadOptions.attributes[key] = fcDownloadOptions[key];
				} else {
					self.widgetDownloadOptions.attributes[key] = "@conflict";
				}
			}
		}
		self.spawnPopup();
	});
};

/**
 *	Close popup
 */
DownloadOptionsWidget.prototype.close = function() {
	this.parentElement.ngeowidget("hide");
};

/**
 *	When widgetDownloadOptions property is ready, spawn popup
 */
DownloadOptionsWidget.prototype.spawnPopup = function() {
	var self = this;
	var downloadOptionsView = new DownloadOptionsView({
		model: self.widgetDownloadOptions,
		el: this.parentElement.find('#downloadOptionsPopupContent'),
		updateCallback: function() {
			return $.when(self.callback(self.widgetDownloadOptions));
		}
	});
	downloadOptionsView.render();

	// Trigger jqm styling
	this.parentElement.ngeowidget("show");
};

module.exports = DownloadOptionsWidget;