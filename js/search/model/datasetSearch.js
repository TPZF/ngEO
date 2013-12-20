  
define( ['jquery', 'backbone', 'configuration', 'search/model/dataSetPopulation', 'search/model/searchCriteria'], 
		function($, Backbone, Configuration, DatasetPopulation, SearchCriteria) {

// A constant
var ONE_MONTH = 24 * 30 * 3600 * 1000;

// Helper function
var _mergeAttributes = function( datasets, attrName, id ) {
	var mergedAttributes = {};
	var isFirst = true;
	
	_.each( datasets, function(dataset) {
	
		var attrs = dataset.get(attrName);
		var attrMap = {};
		if (attrs) {
			for ( var i = 0; i < attrs.length; i++ ) {
				attrMap[ attrs[i][id] ] = attrs[i];
			}
		}
		
		if ( isFirst ) {
			mergedAttributes = attrMap;
			isFirst = false;
		} else {
		
			// Exclude attribute not in the map
			for ( var x in mergedAttributes ) {
				if ( !attrMap[x] ) {
					delete mergedAttributes[x];
				} else if ( !_.isEqual( attrMap[x], mergedAttributes[x] ) ) {
					delete mergedAttributes[x];
				}
			}
	
		}
				
	});
	
	return mergedAttributes;
};

/**
 * This class manages the criteria for search
 *
 */
var DataSetSearch = SearchCriteria.extend({
	
	defaults:{
		stop: new Date(),
		start : new Date( new Date().getTime() - ONE_MONTH ),
		useExtent : true,
		advancedAttributes: {},
		downloadOptions: {},
		useTimeSlider : true, //flag for displaying time slider or not
		mode: "Simple",
		// Correlation/Interferometry parameters
		dDiff: 10,
		sOverP: 25,
		nBase: 5,
		bSync: 5,
		master: ""
	},
	
	name: "Search",
	
	/**
	 * Constructor
	 */
	initialize : function() {
		SearchCriteria.prototype.initialize.apply(this, arguments);
		
		// The array of selected dataset Ids
		this.datasetIds = [];
		
		// The array of slaves
		this.slaves = [];
		
		// The number of selected datasets
		this.numDatasets = 0;
		
		// Automatically load the dataset when the datasetId is changed
		this.listenTo(DatasetPopulation, 'select', this.onDatasetSelectionChanged );
		this.listenTo(DatasetPopulation, 'unselect', this.onDatasetSelectionChanged );
	},
	
	/** Create the openSearch url. 
	 * The url contains spatial, temporal and search criteria parameters.
	 */
	getOpenSearchURL : function(id) {

		var baseUrl = Configuration.serverHostName + Configuration.baseServerUrl + "/catalogue/";
		
		var url = baseUrl;
		
		// Correlation/Interferometry
		if ( this.get('mode') != "Simple" ) {
		
			url += this.get('master') + "/search?";
			url += this.getOpenSearchParameters();
		
			// Add interferometry specific parameters
			url += "&dDiff=" + this.get('dDiff') + "&sOverP=" + this.get('sOverP') + "&nBase=" + this.get('nBase') + "&bSync=" + this.get('bSync');
			
			// Interferometry : only one dataset
			var slaveUrl = baseUrl;
			slaveUrl += this.slaves + "/search?";
			slaveUrl += this.getOpenSearchParameters();
			url += "&with=" + encodeURIComponent(slaveUrl);
		} else {
			url += id + "/search?";
			url += this.getOpenSearchParameters();
		}
		
		url += "&format=json";
		
		return url;
	},
	
	/**
	 * Get the shared search URL
	 */
	getSharedSearchURL : function(){

		var url = "#data-services-area/search/" +  this.datasetIds.join(',') + '?';
		url += this.getOpenSearchParameters();
		// Correlation/Interferometry
		if ( this.get('mode') != "Simple" ) {
		
			// Add interferometry specific parameters
			url += "&dDiff=" + this.get('dDiff') + "&sOverP=" + this.get('sOverP') + "&nBase=" + this.get('nBase') + "&bSync=" + this.get('bSync');
			url += "&mode=" + this.get('mode');
		} 
		return url;
	},
	
	/**	
	 * Get the dataset path to build URLs
	 */
	getDatasetPath: function() {
		return this.get('mode') == "Simple" ? this.datasetIds.join(',') : this.get('master');
	},
	
	/** Compute the available date range from the selected datasets */
	computeDateRange: function() {
		var dateRange = null;
		_.each( DatasetPopulation.selection, function(dataset) {
			if (!dateRange) {
				dateRange = {
					start: dataset.get('startDate'),
					stop: dataset.get('endDate'),
				};
			} else {
				if ( dataset.get('startDate') < dateRange.start ) {
					dateRange.start = dataset.get('startDate');
				}
				if ( dataset.get('endDate') > dateRange.stop ) {
					dateRange.stop = dataset.get('endDate');
				}
			}
		});
		
		this.set('dateRange', dateRange);
	},
	
	/** Set the master dataset for correlation/interferoemtry */
	setMaster: function(val) {
		var i = this.datasetIds.indexOf(val);
		if ( i >= 0 ) {
			this.slaves = this.datasetIds.slice(0);
			this.slaves.splice(i,1);
			this.set('master', val );
		}
	},
	
	
	/** Set the mode for search : Simple, Correlation, Interferometry */
	setMode: function(val) {
		this.slaves = this.datasetIds.slice(0);
		var master = this.slaves.shift();
		this.set('master',master);
		
		this.set('mode',val);
	},
	
	/** Call when the dataset selection is changed */
	onDatasetSelectionChanged : function() {
	
		this.datasetIds = [];
		for ( var x in DatasetPopulation.selection ) {
			this.datasetIds.push(x);
		}
		
		//reset all the selected attributes and download options from the old selection
		this.clearAdvancedAttributesAndDownloadOptions();
	
		// Recompute the date range
		this.computeDateRange();
		
		// Recompute advanced attributes
		this.set('advancedAttributes', _mergeAttributes( DatasetPopulation.selection, 'attributes', 'id' ) );
		
		// Recompute download options
		this.set('downloadOptions', _mergeAttributes( DatasetPopulation.selection, 'downloadOptions', 'argumentName' ) );
	
		if (!this.get('dateRange'))
			return;
							
		// Compute a search time range from the dataset extent
		// The stop date is the dataset stop date
		var start = this.get('start');
		var stop = this.get('stop');
		var rangeStart = this.get('dateRange').start;
		var rangeStop = this.get('dateRange').stop;
		
		if ( stop > rangeStop || start < rangeStart ) {
			stop = new Date( rangeStop.getTime() );
			// The start date is set to one month before the stop date (or the dataset start date if less than one month before)
			var diff = (rangeStop - rangeStart);
			if ( diff > ONE_MONTH ) {
				start = new Date( stop.getTime() - ONE_MONTH );
			} else {
				start = new Date(rangeStart.getTime() );
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
			
			this.set({ start: start,
					stop: stop
				}); 
		} 
	
	}
	
});

return new DataSetSearch();

});