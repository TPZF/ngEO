define(
		[ 'jquery', 'ui/tableView', 'configuration', 'search/model/datasetSearch', 
		  'dataAccess/model/simpleDataAccessRequest','dataAccess/widget/downloadManagersWidget',
		  'dataAccess/widget/directDownloadWidget', 'searchResults/widget/downloadOptionsWidget', 'searchResults/widget/exportWidget' ],
	function($, TableView, Configuration, DatasetSearch, SimpleDataAccessRequest, DownloadManagersWidget,
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
		
		this.columnDefs = Configuration.data.resultsTable.columnsDef
	},

	/**
	 * Manage events on the view
	 */
	events : {
		
		//Called when the user clicks on the product id of an item
		'click .ui-direct-download' : function(event){
			var feature = this.getFeatureFromRow( $(event.currentTarget).closest('tr').get(0) );
			var featureArray = [];
			featureArray.push(feature);
			//The urls to uses for the direct download are those in the eop_filename property and not in feature.properties.productUrl.
			var directDownloadWidget = new DirectDownloadWidget(this.model.getDirectDownloadProductUrls(featureArray)[0]);
			directDownloadWidget.open(event);
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
		this.retrieveProduct.click(function() {

			SimpleDataAccessRequest.initialize();
			SimpleDataAccessRequest.setProducts( self.model.selection );
			
			var downloadManagersWidget = new DownloadManagersWidget(SimpleDataAccessRequest);
			downloadManagersWidget.open();

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