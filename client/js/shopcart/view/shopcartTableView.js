var TableView = require('ui/tableView');
var Configuration = require('configuration');
var SimpleDataAccessRequest = require('dataAccess/model/simpleDataAccessRequest');
var DataAccessWidget = require('dataAccess/widget/dataAccessWidget');
var DownloadOptionsWidget = require('searchResults/widget/downloadOptionsWidget');
var ShopcartExportWidget = require('shopcart/widget/shopcartExportWidget');

/**
 * The model is the backbone model shopcart 
 */
var ShopcartTableView = TableView.extend({

	initialize: function() {
		TableView.prototype.initialize.apply(this, arguments);

		this.events = _.extend({}, TableView.prototype.events, this.events);

		this.columnDefs = Configuration.data.tableView.columnsDef;
	},

	/** update the button statuses **/
	toggleSelection: function() {
		TableView.prototype.toggleSelection.apply(this, arguments);

		if (this.model.selection.length > 0) {
			this.deleteButton.button('enable');
			if (this.model.getSelectionDatasetIds().length == 1) {
				this.retrieveProduct.button('enable');
				this.downloadOptionsButton.button('enable');
			} else {
				this.retrieveProduct.button('disable');
				this.downloadOptionsButton.button('disable');
			}
		} else {
			this.retrieveProduct.button('disable');
			this.deleteButton.button('disable');
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

			var downloadOptionsWidget = new DownloadOptionsWidget();
			downloadOptionsWidget.open(self.shopcart.featureCollection);

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