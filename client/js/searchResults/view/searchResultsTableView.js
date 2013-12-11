define(
		[ 'jquery', 'logger', 'ui/tableView', 'configuration', 'searchResults/model/searchResults',
		  'dataAccess/model/simpleDataAccessRequest','dataAccess/widget/downloadManagersWidget',
		  'dataAccess/widget/directDownloadWidget', 'searchResults/widget/downloadOptionsWidget', 'searchResults/widget/exportWidget' ],
	function($, Logger, TableView, Configuration, SearchResults, SimpleDataAccessRequest, DownloadManagersWidget,
			DirectDownloadWidget, DownloadOptionsWidget, ExportWidget ) {

			
/**
 * The model is the backbone model SearchResults 
 */
var SearchResultsTableView = TableView.extend({

	/**
	 * Constructor
	 */
	initialize : function(options) {
		TableView.prototype.initialize.apply(this, arguments);
		
		this.events = _.extend({},TableView.prototype.events,this.events);
		
		this.model.on("selectFeatures", this.onSelectionChanged, this );
		this.model.on("unselectFeatures", this.onSelectionChanged, this );
		
		this.columnDefs = Configuration.data.resultsTable.columnsDef;
		
		// Set specific class for direct download of product
		var ddIndex = Configuration.localConfig.directDownload.productColumnIndex;
		if ( ddIndex >= 0 && ddIndex < this.columnDefs.length ) {
			this.columnDefs[  ddIndex ].getClasses = function(feature) {
				return SearchResults.isBrowserSupportedUrl(feature) ? "ui-direct-download" : "";
			};
		}
	},

	/**
	 * Manage events on the view
	 */
	events : {
		
		//Called when the user clicks on the product id of an item
		'click .ui-direct-download' : function(event){
			if ( this.model.downloadAccess ) {
				var feature = $(event.currentTarget).closest('tr').data('internal').feature;
				//The urls to uses for the direct download are those in the eop_filename property and not in feature.properties.productUrl.
				var directDownloadWidget = new DirectDownloadWidget(  SearchResults.getDirectDownloadProductUrl(feature) );
				directDownloadWidget.open(event);
			} else {
				Logger.inform("Cannot download the product : missing permissions.");
			}
		}
	},
	
	
	/**
	 * Call when selection has changed
	 */
	onSelectionChanged: function(features) {
		
		// Disable export if no product selected
		if ( this.model.selection.length > 0 ) {
			this.exportButton.button('enable');
		} else {
			this.exportButton.button('disable');
		}
		
		//Disable the retrieve Product and download options button if no product item is selected 
		//and/or if the products checked do not have a product url
		if ( this.model.getSelectedProductUrls().length == 0 ) {
			this.retrieveProduct.button('disable');
			this.downloadOptionsButton.button('disable');
		} else {
			this.retrieveProduct.button('enable');
			this.downloadOptionsButton.button('enable');
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

			if ( self.model.downloadAccess ) {
				SimpleDataAccessRequest.initialize();
				SimpleDataAccessRequest.setProducts( self.model.selection );
				
				var downloadManagersWidget = new DownloadManagersWidget(SimpleDataAccessRequest);
				downloadManagersWidget.open();
			} else {
				Logger.inform("Cannot download the product : missing permissions.");
			}

		});
		
		//add button to the widget footer in order to download products
		this.downloadOptionsButton = $('<button data-role="button" data-inline="true" data-mini="true">Download Options</button>').appendTo($buttonContainer);
		this.downloadOptionsButton.button();
		this.downloadOptionsButton.button('disable');
		
		//Displays the download options of the selected products in order to be changed in one shot
		//for the moment all product belong to the unique selected dataset 
		this.downloadOptionsButton.click(function() {
			
			var downloadOptionsWidget = new DownloadOptionsWidget();
			downloadOptionsWidget.open();

		});
		
		//add button to the widget footer in order to download products		
		this.exportButton = $('<button data-role="button" data-inline="true" data-mini="true">Export</button>').appendTo($buttonContainer);
		this.exportButton.button();
		this.exportButton.button('disable');
		
		//Displays the download options of the selected products in order tobe changed in one shot
		//for the moment all product belong to the unique selected dataset 
		this.exportButton.click(function() {
			
			var exportWidget = new ExportWidget();
			exportWidget.open();
		});
	}
});

return SearchResultsTableView;

});