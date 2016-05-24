var DownloadOptionsView = require('search/view/downloadOptionsView');
var DataSetSearch = require('search/model/datasetSearch');
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

	this.widgetDownloadOptions = null;
	if ( options.featureCollection ) {
		this.featureCollection = options.featureCollection;
	} else if ( options.downloadOptions ) {
		this.widgetDownloadOptions = new DownloadOptions(options.downloadOptions);
	}
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
	if ( this.featureCollection ) {
		var featureCollection = this.featureCollection;
		var datasetId = featureCollection.dataset.get("datasetId");
		// Fetch the available download options and then display the widget
		featureCollection.fetchAvailableDownloadOptions(function(datasetDownloadOptions) {
			
			// Stub_server HACK: Nominally, the getSelectedDownloadOptions must extract the ngEO_DO from productUrl, so no need to set downloadOptions
			// Since our stub currently doesn't have ngEO_DO on productUrl, force the the client to set:
			//	Two options:
			//		1) Set as @conflict
			//		2) Same as DataSetSearch : could bring to confusion..
			self.widgetDownloadOptions = new DownloadOptions(datasetDownloadOptions);
			var fcDownloadOptions = featureCollection.getSelectedDownloadOptions();
			for ( var i=0; i<datasetDownloadOptions.length; i++ ){
				var key = datasetDownloadOptions[i].argumentName;
				if ( datasetDownloadOptions[i].cropProductSearchArea == "true" ) {
					self.widgetDownloadOptions.attributes[key] = true; // HACK: Set true by default
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
	} else if ( this.widgetDownloadOptions ) {
		this.spawnPopup();
	}
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