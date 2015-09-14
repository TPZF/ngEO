  
define( ['jquery', 'backbone', 'configuration', 'search/model/dataSetPopulation', 'search/model/searchCriteria'], 
		function($, Backbone, Configuration, DatasetPopulation, SearchCriteria) {


/**
 * Manage standing order criteria (except SchedulingOptions!)
 *
 */
var StandingOrder = SearchCriteria.extend({
	
	name: "Subscribe",
	
	/**	
	 * Constructor
	 */
	initialize : function() {
	
		SearchCriteria.prototype.initialize.apply(this, arguments);
		
		this.dataset = undefined;
	
		this.listenTo(DatasetPopulation, 'select', this.onDatasetSelectionChanged );
		this.listenTo(DatasetPopulation, 'unselect', this.onDatasetSelectionChanged );
	},
	
	/**	
	 * Get the dataset path to build URLs
	 */
	getDatasetPath: function() {
		return this.dataset ? this.dataset.get('datasetId') : "";
	},
	
	/**
	 * Create the openSearch url. 
	 * The url contains spatial, temporal and search criteria parameters.
	 */
	getOpenSearchURL : function(options){

		var url = Configuration.serverHostName + Configuration.baseServerUrl + "/catalogue/";
		url += this.getDatasetPath() + "/search?";
		url += this.getOpenSearchParameters();

		var format = (options && options.hasOwnProperty("format")) ? options.format : "json";
		url += "&format="+format;
		
		return url;
	},
	
	/** 
	 * Load the information for the selected dataset from the server
	 * unless if no dataset is selected set the dataset to undefined
	 */
	onDatasetSelectionChanged : function() {
	
		// Clear current attributes and download options
		this.clearAdvancedAttributesAndDownloadOptions();
		
		// Get the dataset : only one for standing order
		var datasets = _.values( DatasetPopulation.selection );
		if ( datasets.length > 0 ) {
			
			this.dataset = datasets[0];
			
			// Recompute advanced attributes
			this.set('advancedAttributes', _.indexBy( this.dataset.get('attributes'), 'id')  );
		
			// Recompute download options
			this.set('downloadOptions',  _.indexBy( this.dataset.get('downloadOptions'), 'argumentName') );

		} else {
		
			this.dataset = undefined;
			
			// Reset advanced attributes
			this.set('advancedAttributes', {} );
		
			// Reset download options
			this.set('downloadOptions',  {} );
		}
		
	}
	
});

return StandingOrder;

});