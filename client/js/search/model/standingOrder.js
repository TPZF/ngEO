var Configuration = require('configuration');
var DatasetPopulation = require('search/model/dataSetPopulation');
var SearchCriteria = require('search/model/searchCriteria');


/**
 * Manage standing order criteria (except SchedulingOptions!)
 *
 */
var StandingOrder = SearchCriteria.extend({

	name: "Subscribe",

	/**	
	 * Constructor
	 */
	initialize: function() {

		SearchCriteria.prototype.initialize.apply(this, arguments);
		this.dataset = undefined;
	},

	/**	
	 * Get the dataset path to build URLs
	 */
	getDatasetPath: function() {
		return this.dataset ? this.dataset.get('datasetId') : "";
	},

	/**
 	 *	Populate model from URL only if dataset is defined
	 *	TODO: use SearchCriteria's method everytime : in other words,
	 *	this method mustn't be called if dataset isn't defined
	 */
	populateModelfromURL : function(query) {
		if ( this.dataset ) {
			SearchCriteria.prototype.populateModelfromURL.call(this, query, this.dataset.get("datasetId"));
		}
	},

	/**
	 * Create the openSearch url. 
	 * The url contains spatial, temporal and search criteria parameters.
	 */
	getOpenSearchURL: function(options) {

		var url = Configuration.serverHostName + Configuration.baseServerUrl + "/catalogue/";
		url += this.getDatasetPath() + "/search?";
		// TODO: should never happen.. check this more deeply
		if ( this.dataset )
			url += this.getOpenSearchParameters(this.dataset.get("datasetId"));

		var format = (options && options.hasOwnProperty("format")) ? options.format : "json";
		url += "&format=" + format;

		return url;
	},

	/**
	 *	Get selected download options for the selected dataset if exists
	 */
	getSelectedDownloadOptions : function() {
		if ( this.dataset ) {
			return SearchCriteria.prototype.getSelectedDownloadOptions.call(this, this.dataset);
		} else {
			return {};
		}
	},

	/** 
	 * Load the information for the selected dataset from the server
	 * unless if no dataset is selected set the dataset to undefined
	 */
	onDatasetSelectionChanged: function(dataset) {

		// Use parent's onDatasetSelectionChanged implementation
		SearchCriteria.prototype.onDatasetSelectionChanged.call(this, dataset);

		// Get the dataset : only one for standing order
		var datasets = _.values(DatasetPopulation.selection);
		if (datasets.length == 1) {
			this.dataset = datasets[0];
		} else {
			this.dataset = undefined;
		}

	}

});

module.exports = StandingOrder;