var Logger = require('logger');
var GlobalEvents = require('globalEvents');
var TableView = require('ui/tableView');
var Configuration = require('configuration');
var SearchResults = require('searchResults/model/searchResults');
var SimpleDataAccessRequest = require('dataAccess/model/simpleDataAccessRequest');
var DataAccessWidget = require('dataAccess/widget/dataAccessWidget');
var DirectDownloadWidget = require('dataAccess/widget/directDownloadWidget');
var DownloadOptionsWidget = require('searchResults/widget/downloadOptionsWidget');
var ExportWidget = require('searchResults/widget/exportWidget');

/**
 * The model is the backbone model SearchResults 
 */
var SearchResultsTableView = TableView.extend({

	/**
	 * Constructor
	 */
	initialize: function(options) {
		TableView.prototype.initialize.apply(this, arguments);

		this.events = _.extend({}, TableView.prototype.events, this.events);

		this.columnDefs = Configuration.data.tableView.columnsDef;

		// Set specific class for direct download of product
		var ddIndex = Configuration.get("tableView.directDownloadColumn", -1);
		if (ddIndex >= 0 && ddIndex < this.columnDefs.length) {
			this.columnDefs[ddIndex].getClasses = function(feature) {
				return SearchResults.isBrowserSupportedUrl(feature) ? "ui-direct-download" : "";
			};
		}
		
		// NGEO-1972: Class used to show download options in a user-friendly way
		var downloadOptionsColumn = _.findWhere(this.columnDefs, {sTitle: "Download options"});
		if (downloadOptionsColumn) {
			downloadOptionsColumn.getClasses = function(feature) {
				return "downloadOptions";
			};
		}

	},

	/**
	 * Manage events on the view
	 */
	events: {

		//Called when the user clicks on the product id of an item
		'click .ui-direct-download': function(event) {
			if (this.model.downloadAccess) {
				var feature = $(event.currentTarget).closest('tr').data('internal').feature;
				//The urls to uses for the direct download are those in the eop_filename property and not in feature.properties.productUrl.
				var directDownloadWidget = new DirectDownloadWidget(SearchResults.getDirectDownloadProductUrl(feature));
				directDownloadWidget.open(event);
			} else {
				Logger.inform("Cannot download the product : missing permissions.");
			}
		}
	},


	/**
	 * Call when selection has changed
	 */
	toggleSelection: function(features) {

		TableView.prototype.toggleSelection.apply(this, arguments);

		// Disable export if no product selected
		if (this.model.selection.length > 0) {
			this.exportButton.button('enable');
		} else {
			this.exportButton.button('disable');
		}

		//Disable the retrieve Product and download options button if no product item is selected 
		//and/or if the products checked do not have a product url
		if (this.model.getSelectedProductUrls().length == 0) {
			this.retrieveProduct.button('disable');
			this.downloadOptionsButton.button('disable');
			this.addToShopcart.button('disable');
		} else {

			// NGEO-1770: No retrieve button if selection contains at least one planned product
			var hasPlanned = _.find(this.model.selection, function(feature) {
				return Configuration.getMappedProperty(feature, "status", null) == "PLANNED";
			});
			this.retrieveProduct.button(hasPlanned ? 'disable' : 'enable');

			var hasDownloadOptions = (this.model.dataset && this.model.dataset.get('downloadOptions') && this.model.dataset.get('downloadOptions').length != 0);
			this.downloadOptionsButton.button(hasDownloadOptions ? 'enable' : 'disable');
			this.addToShopcart.button('enable');

			/*var nonPlannedSelectProducts = this.model.getSelectedNonPlannedFeatures();
			if ( nonPlannedSelectProducts.length == 0 ) {
				this.addToShopcart.button('disable');
			} else {
				this.addToShopcart.button('enable');
			}*/
		}
	},

	/**
	 * Render buttons
	 */
	renderButtons: function($buttonContainer) {

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
		//add selected items to the current or to a new shopcart
		this.addToShopcart = $('<button data-role="button" data-inline="true" data-mini="true">Add to Shopcart</button>').appendTo($buttonContainer);
		this.addToShopcart.button();
		this.addToShopcart.button('disable');
		this.addToShopcart.click(function() {
			GlobalEvents.trigger('addToShopcart', self.model.selection);
		});

		//add button to the widget footer in order to download products
		this.downloadOptionsButton = $('<button data-role="button" data-inline="true" data-mini="true">Download Options</button>').appendTo($buttonContainer);
		this.downloadOptionsButton.button();
		this.downloadOptionsButton.button('disable');

		//Displays the download options of the selected products in order to be changed in one shot
		//for the moment all product belong to the unique selected dataset 
		this.downloadOptionsButton.click(function() {

			var downloadOptionsWidget = new DownloadOptionsWidget({
				featureCollection: self.model,
				callback: function(updatedDownloadOptions) {
					// Update the product url of the selected products with the selected download options
					return $.when(self.model.updateDownloadOptions(updatedDownloadOptions));
				}
			});
			downloadOptionsWidget.open();
		});

		//add button to the widget footer in order to download products		
		this.exportButton = $('<button title="Export" data-role="button" data-inline="true" data-icon="forward" data-iconpos="notext" data-mini="true">Export</button>').appendTo($buttonContainer);
		this.exportButton.button();
		this.exportButton.button('disable');

		//Displays the download options of the selected products in order tobe changed in one shot
		//for the moment all product belong to the unique selected dataset 
		this.exportButton.click(function() {

			var exportWidget = new ExportWidget(self.model);
			exportWidget.open();
		});
	}
});

module.exports = SearchResultsTableView;