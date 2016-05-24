var TableView = require('ui/tableView');
var Configuration = require('configuration');
var SimpleDataAccessRequest = require('dataAccess/model/simpleDataAccessRequest');
var DataAccessWidget = require('dataAccess/widget/dataAccessWidget');
var DownloadOptionsWidget = require('searchResults/widget/downloadOptionsWidget');
var ShopcartExportWidget = require('shopcart/widget/shopcartExportWidget');
var DataSetPopulation = require('search/model/dataSetPopulation');

/**
 * The model is the backbone model FeatureCollection 
 */
var ShopcartTableView = TableView.extend({

	initialize: function() {
		TableView.prototype.initialize.apply(this, arguments);

		this.events = _.extend({}, TableView.prototype.events, this.events);
		this.columnDefs = Configuration.data.tableView.columnsDef;
	},

	/**
	 * Update the footer button states
	 */
	toggleSelection: function() {
		TableView.prototype.toggleSelection.apply(this, arguments);

		// The products have to be a part of dataset so we extract dataset ids
		// to be sure that products are viable
		var selectedDatasetIds = this.model.getSelectionDatasetIds();
		if (selectedDatasetIds.length > 0) {
			this.deleteButton.button('enable');
			this.retrieveProduct.button('enable');
		} else {
			this.retrieveProduct.button('disable');
			this.deleteButton.button('disable');
		}

		// Add possibility to update download options only
		// if selected products are coming from the same dataset
		if ( selectedDatasetIds.length == 1 ) {
			this.downloadOptionsButton.attr("title", "Modify download options of selected products");
			this.downloadOptionsButton.button('enable');
		} else {
			this.downloadOptionsButton.attr("title", "You should select products coming from the same dataset");
			this.downloadOptionsButton.button('disable');
		}
	},


	/**
	 * Set the shopcart used by the view
	 */
	setShopcart: function(shopcart) {
		this.shopcart = shopcart;
		this.setModel(shopcart.featureCollection);
	},

	/**
	 * Render buttons
	 */
	renderButtons: function($buttonContainer) {
		var self = this;

		this.retrieveProduct = $('<button data-role="button" data-inline="true" data-mini="true">Retrieve Product</button>').appendTo($buttonContainer);
		this.retrieveProduct.button();
		this.retrieveProduct.button('disable');

		//create a simpleDataAccessRequest and assign a download manager
		var self = this;
		this.retrieveProduct.click(function() {

			if (self.model.downloadAccess) {
				SimpleDataAccessRequest.initialize();
				SimpleDataAccessRequest.setProducts(self.model.selection);

				DataAccessWidget.open(SimpleDataAccessRequest);
			} else {
				Logger.inform("Cannot download the product : missing permissions.");
			}
		});

		//add button to the widget footer in order to download products
		this.downloadOptionsButton = $('<button data-role="button" data-inline="true" data-mini="true">Download Options</button>').appendTo($buttonContainer);
		this.downloadOptionsButton.button();
		this.downloadOptionsButton.button('disable');

		this.downloadOptionsButton.click(function() {
			var datasetId = self.model.getSelectionDatasetIds()[0]; // We are sure that there is only one dataset selected

			// Make request to know download options of given dataset
			DataSetPopulation.fetchDataset(datasetId, function(dataset) {

				var downloadOptions = dataset.get("downloadOptions");

				var downloadOptionsWidget = new DownloadOptionsWidget({
					downloadOptions: downloadOptions,
					callback: function(updatedDownloadOptions) {
						self.shopcart.updateSelection(updatedDownloadOptions.getAttributes()).then(function(response) {
							console.log(response);
							// TODO: handle a real response
							self.model.updateDownloadOptions(updatedDownloadOptions);
						});
					}
				});
				downloadOptionsWidget.open();
			});
		});

		//add button to the widget footer in order to download products		
		this.deleteButton = $('<button data-role="button" data-inline="true" data-mini="true">Delete</button>').appendTo($buttonContainer);
		this.deleteButton.button();
		this.deleteButton.button('disable');

		this.deleteButton.click(function() {
			self.shopcart.deleteSelection();
		});

		//add button to the widget footer in order to export a shopcart
		this.exportButton = $('<button data-role="button" data-inline="true" data-mini="true">Export</button>').appendTo($buttonContainer);
		this.exportButton.button();
		this.exportButton.button('enable');

		this.exportButton.click(function() {
			var shopcartExportWidget = new ShopcartExportWidget();
			shopcartExportWidget.open();
		});

	}
});

module.exports = ShopcartTableView;