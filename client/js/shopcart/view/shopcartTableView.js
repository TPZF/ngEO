var Configuration = require('configuration');
var Logger = require('logger');

var TableView = require('ui/tableView');

// WIDGETS
var DataAccessWidget = require('dataAccess/widget/dataAccessWidget');
var DirectDownloadWidget = require('dataAccess/widget/directDownloadWidget');
var DownloadOptionsWidget = require('searchResults/widget/downloadOptionsWidget');
var ShopcartExportWidget = require('shopcart/widget/shopcartExportWidget');

// MODELS
var DataSetAuthorizations = require('search/model/datasetAuthorizations');
var DataSetPopulation = require('search/model/dataSetPopulation');
var SimpleDataAccessRequest = require('dataAccess/model/simpleDataAccessRequest');

/**
 * The model is the backbone model FeatureCollection 
 */
var ShopcartTableView = TableView.extend({

	initialize: function () {

		let _this = this;

		TableView.prototype.initialize.apply(this, arguments);

		this.events = _.extend({}, TableView.prototype.events, this.events);
		this.columnDefs = Configuration.data.tableView.columnsDef;

		// Set specific class for direct download of product
		var ddIndex = Configuration.get("tableView.directDownloadColumn", -1);
		if (ddIndex >= 0 && ddIndex < this.columnDefs.length && _this.model) {
			this.columnDefs[ddIndex].getClasses = function (feature) {
				return _this.model.isBrowserSupportedUrl(feature) ? "ui-direct-download" : "";
			};
		}

	},

	/**
	 * Manage events on the view
	 */
	events: {

		//Called when the user clicks on the product id of an item
		'click .directDownload': function (event) {
			event.stopPropagation();
			if (this.model.downloadAccess) {
				var feature = $(event.currentTarget).closest('tr').data('internal').feature;
				//The urls to uses for the direct download are those in the eop_filename property and not in feature.properties.productUrl.
				var directDownloadWidget = new DirectDownloadWidget(feature, this.model.getDirectDownloadProductUrl(feature));
				directDownloadWidget.open(event);
			} else {
				Logger.inform("Cannot download the product : missing permissions.");
			}
		}
	},

	/**
	 * Update the footer button states
	 */
	updateHighlights: function () {
		TableView.prototype.updateHighlights.apply(this, arguments);

		// Disable export if no product highlighted
		if (this.model.highlights.length > 0) {
			this.exportButton.button('enable');
		} else {
			this.exportButton.button('disable');
		}

		// The products have to be a part of dataset so we extract dataset ids
		// to be sure that products are viable
		var highlightedDatasetIds = this.model.getDatasetIdsFromHighlights();
		if (highlightedDatasetIds.length > 0) {
			this.deleteButton.button('enable');
			this.retrieveProduct.button('enable');
		} else {
			this.retrieveProduct.button('disable');
			this.deleteButton.button('disable');
		}

		// Add possibility to update download options only
		// if selected products are coming from the same dataset
		/*
		
		**** Inactive downloadOptions for the moment ****

		if ( selectedDatasetIds.length == 1 ) {
			this.downloadOptionsButton.attr("title", "Modify download options of selected products");
			this.downloadOptionsButton.button('enable');
		} else {
			this.downloadOptionsButton.attr("title", "You should select products coming from the same dataset");
			this.downloadOptionsButton.button('disable');
		}
		*/
	},


	/**
	 * Set the shopcart used by the view
	 */
	setShopcart: function (shopcart) {
		this.shopcart = shopcart;
		this.setModel(shopcart.featureCollection);
	},

	/**
	 * Render buttons
	 */
	renderButtons: function ($buttonContainer) {
		var self = this;

		this.retrieveProduct = $('<button data-role="button" data-inline="true" data-mini="true" title="Retrieve highlighted products with download manager">Retrieve</button>').appendTo($buttonContainer);
		this.retrieveProduct.button();
		this.retrieveProduct.button('disable');

		//create a simpleDataAccessRequest and assign a download manager
		var self = this;
		this.retrieveProduct.click(function () {

			var hasDownloadAccess = true;
			_.each(self.model.highlights, function (feature) {
				hasDownloadAccess &= DataSetAuthorizations.hasDownloadAccess(self.model.getDatasetId(feature));
			});

			if (hasDownloadAccess) {
				SimpleDataAccessRequest.initialize();
				SimpleDataAccessRequest.setProducts(self.model.highlights);

				DataAccessWidget.open(SimpleDataAccessRequest);
			} else {
				Logger.inform("Cannot download the product : missing permissions.");
			}
		});

		//add button to the widget footer in order to download products
		//do not display this button -> this.downloadOptionsButton = $('<button data-role="button" data-inline="true" data-mini="true">Download Options</button>').appendTo($buttonContainer);
		this.downloadOptionsButton = $('<button data-role="button" data-inline="true" data-mini="true" title="Define download options">Download Options</button>');
		this.downloadOptionsButton.button();
		this.downloadOptionsButton.button('disable').hide();

		this.downloadOptionsButton.click(function () {
			var datasetId = self.model.getDatasetIdsFromHighlights()[0]; // We are sure that there is only one dataset selected
			var downloadOptionsWidget = new DownloadOptionsWidget({
				datasetId: datasetId,
				featureCollection: self.model,
				callback: function (updatedDownloadOptions) {
					self.shopcart.updateHighlights(updatedDownloadOptions.getAttributes()).then(function (response) {
						console.log(response);
						// TODO: handle a real response
						self.model.updateDownloadOptions(updatedDownloadOptions);
					});
				}
			});
			downloadOptionsWidget.open();
		});

		//add button to the widget footer in order to download products		
		this.deleteButton = $('<button data-role="button" data-inline="true" data-mini="true" title="Delete highlighted products from this shopcart">Delete</button>').appendTo($buttonContainer);
		this.deleteButton.button();
		this.deleteButton.button('disable');

		this.deleteButton.click(function () {
			self.shopcart.deleteHighlights();
		});

		//add button to the widget footer in order to export a shopcart
		this.exportButton = $('<button data-role="button" data-inline="true" data-mini="true" title="Export highlighted products (KML, GeoJson)">Export</button>').appendTo($buttonContainer);
		this.exportButton.button();
		this.exportButton.button('disable');

		this.exportButton.click(function () {
			var shopcartExportWidget = new ShopcartExportWidget(self.model);
			shopcartExportWidget.open();
		});

	}
});

module.exports = ShopcartTableView;