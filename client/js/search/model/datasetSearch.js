var Configuration = require('configuration');
var DatasetPopulation = require('search/model/dataSetPopulation');
var SearchCriteria = require('search/model/searchCriteria');


// A constant
var ONE_MONTH = 24 * 30 * 3600 * 1000;

/**
 * This class manages the criteria for search
 */
var DataSetSearch = SearchCriteria.extend({

	// Extend SearchCriteria defaults
	defaults: _.extend({}, SearchCriteria.prototype.defaults.call(this), {
		useTimeSlider: true, //flag for displaying time slider or not
		mode: "Simple",
		// Correlation/Interferometry parameters
		timeCover: [0, 30],
		spatialCover: 25,
		baseline: [0, 5],
		burstSync: [0, 100],
		master: ""
	}),

	name: "Search",

	/**
	 * Constructor
	 */
	initialize: function() {
		SearchCriteria.prototype.initialize.apply(this, arguments);

		// The array of selected dataset Ids
		this.datasetIds = [];

		// The array of slaves
		this.slaves = [];

		// The number of selected datasets
		this.numDatasets = 0;
	},

	/**
	 * Create the openSearch url. 
	 * The url contains spatial, temporal and search criteria parameters.
	 */
	getOpenSearchURL: function(options) {

		var url = Configuration.serverHostName + Configuration.baseServerUrl + "/catalogue/";
		var id = options.id;

		// Correlation/Interferometry
		if (this.get('mode') != "Simple") {

			url += this.get('master') + "/search?";
			url += this.getOpenSearchParameters(id);

			// Add interferometry specific parameters
			url += this.getInterferometryParameters(id);

		} else {
			// TODO !!!!!!
			var id = (options && options.hasOwnProperty('id')) ? options.id : this.datasetIds.join(',');
			url += id + "/search?";
			url += this.getOpenSearchParameters(id);
		}

		var format = (options && options.hasOwnProperty("format")) ? options.format : "json";
		url += "&format=" + format;

		return url;
	},

	/**
	 * @override TODO, think about how to manage this better
	 * Get the shared search URL
	 */
	getSharedSearchURL : function(){

		var url = "#data-services-area/search/" +  this.datasetIds.join(',') + '?';
		var sharedParameters = {};

		// Build shared open search parameters url for each dataset
		// since advanced&download options are independent between datasets
		for ( var i=0; i<this.datasetIds.length; i++ ) {
			var datasetId = this.datasetIds[i];
			//var osUrl = this.getOpenSearchParameters(datasetId);
			var osUrl = this.addAdvancedCriteria("", datasetId);
			osUrl = this.addDownloadOptions(osUrl, datasetId);

			// Remove the first "?" symbol
			osUrl = osUrl.substr(1);

			// Correlation/Interferometry
			if ( this.get('mode') != "Simple" ) {
				// Add interferometry specific parameters
				osUrl += "&dDiff=" + this.get('dDiff') + "&sOverP=" + this.get('sOverP') + "&nBase=" + this.get('nBase') + "&bSync=" + this.get('bSync');
				osUrl += "&mode=" + this.get('mode');
			}
			// Store open search url for the given datasetId
			sharedParameters[datasetId] = osUrl;
		}

		sharedParameters['commonCriteria'] = this.addGeoTemporalParams();
		
		return "#data-services-area/search?osParameters=" + escape(JSON.stringify(sharedParameters));
	},

	/**
	 *	Get interferometry/correlation parameters
	 */
	getInterferometryParameters: function(id) {
		var interferometryParams = "&timeCover=[" + this.get('timeCover') + "]&spatialCover=" + this.get('spatialCover') + "]&baseline=[" + this.get('baseline') + "]&burstSync=[" + this.get('burstSync') + "]";
		// Interferometry : only one dataset, correlation -> more than one(not implemented yet)
		var slaveUrl = Configuration.serverHostName + Configuration.baseServerUrl + "/catalogue/";
		slaveUrl += this.slaves + "/search?";
		slaveUrl += this.getOpenSearchParameters(id);

		// slaveUrl can be just a datasetId(not openSearch url)
		// slaveUrl = this.slaves;
		interferometryParams += "&correlatedTo=" + encodeURIComponent(slaveUrl) + "&corFunction=inteferometry"; // OLD parameter: "with"

		return interferometryParams;
	},


	/**	
	 * Get the dataset path to build URLs
	 */
	getDatasetPath: function() {
		return this.get('mode') == "Simple" ? this.datasetIds.join(',') : this.get('master');
	},

	/**
	 * Compute the available date range from the selected datasets
	 */
	computeDateRange: function() {
		var dateRange = null;
		_.each(DatasetPopulation.selection, function(dataset) {
			if (!dateRange) {
				dateRange = {
					start: dataset.get('startDate'),
					stop: dataset.get('endDate')
					//validityStop: dataset.get('validityEndDate')
				};
			} else {
				if (dataset.get('startDate') < dateRange.start) {
					dateRange.start = dataset.get('startDate');
				}
				if (dataset.get('endDate') > dateRange.stop) {
					dateRange.stop = dataset.get('endDate');
				}
				// NGEO-1919: validityStop never used anymore
				// if (dataset.get('validityEndDate') > dateRange.validityStop) {
				// 	dateRange.validityStop = dataset.get('validityEndDate');
				// }
			}
		});

		this.set('dateRange', dateRange);
	},

	/**
	 * Set the master dataset for correlation/interferoemtry
	 */
	setMaster: function(val) {
		var i = this.datasetIds.indexOf(val);
		if (i >= 0) {
			this.slaves = this.datasetIds.slice(0);
			this.slaves.splice(i, 1);
			this.set('master', val);
		}
	},


	/**
	 * Set the mode for search : Simple, Correlation, Interferometry
	 */
	setMode: function(val) {

		if (val != 'Simple') {

			this.slaves = this.datasetIds.slice(0);
			var master = this.slaves.shift();

			// Take into account the case of interferometry/correlation on a single dataset
			if (this.slaves.length == 0) {
				this.slaves.push(master);
			}

			this.set('master', master);

		} else {

			this.set('master', '');
			this.slaves = "";

		}

		this.set('mode', val);
	},

	/**
	 * Check if interferometry is supported
	 */
	isInterferometrySupported: function() {

		if (this.datasetIds.length == 0) {
			return false;
		}

		if (this.datasetIds.length > 2) {
			return false;
		}

		for (var x in DatasetPopulation.selection) {
			var dataset = DatasetPopulation.selection[x];
			/* Old method to check if a dataset supports interferometry
			if ( !dataset.hasKeyword('interferometry') ) {
				return false;
			}*/

			// New method... use the criteria 'usableForInterferometry'
			if (!DatasetPopulation.usableForInterferometry(x)) {
				return false;
			}
		}

		return true;
	},

	/**
	 * Call when the dataset selection is changed
	 */
	onDatasetSelectionChanged: function(dataset) {

		// Recompute datasetIds parameter which is used in many places
		this.datasetIds = [];
		for (var x in DatasetPopulation.selection) {
			this.datasetIds.push(x);
		}

		// Use parent's onDatasetSelectionChanged implementation
		SearchCriteria.prototype.onDatasetSelectionChanged.call(this, dataset);

		// Recompute the date range
		this.computeDateRange();

		if (!this.get('dateRange'))
			return;

		// Compute a search time range from the dataset extent
		// The stop date is the dataset stop date
		var start = this.get('start');
		var stop = this.get('stop');
		var rangeStart = this.get('dateRange').start;
		var rangeStop = this.get('dateRange').stop;

		if (stop > rangeStop || start < rangeStart) {

			// Stop is current date, or dataset stop
			stop = new Date();
			if (stop < rangeStart) {
				stop = new Date(rangeStart.getTime() + ONE_MONTH);
			}

			if (stop > rangeStop) {
				stop = new Date(rangeStop.getTime());
			}

			// The start date is set to one month before the stop date (or the dataset start date if less than one month before)
			var diff = (rangeStop - rangeStart);
			if (diff > ONE_MONTH) {
				start = new Date(stop.getTime() - ONE_MONTH);
			} else {
				start = new Date(rangeStart.getTime());
			}

			// Reset start time
			start.setUTCHours(0);
			start.setUTCMinutes(0);
			start.setUTCSeconds(0);
			start.setUTCMilliseconds(0);

			// Reset stop time
			stop.setUTCHours(23);
			stop.setUTCMinutes(59);
			stop.setUTCSeconds(59);
			stop.setUTCMilliseconds(999);

			this.set({
				start: start,
				stop: stop
			});
		}

	}

});

module.exports = new DataSetSearch();