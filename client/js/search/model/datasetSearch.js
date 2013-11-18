  
define( ['jquery', 'backbone', 'configuration', 'search/model/dataSetPopulation', 'search/model/searchArea', 'search/model/datasetAuthorizations'], 
		function($, Backbone, Configuration, DatasetPopulation, SearchArea, DatasetAuthorizations) {

function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}

// Helper function to convert a string in ISO format to date
Date.fromISOString = function(str) {

	var reDate = /(\d+)-(\d+)-(\d+)(?:T(\d+):(\d+)(?::(\d+)(?:.(\d+))?)?Z)?/;
	var match = reDate.exec(str);
	if ( match ) {
		// Hack to support bad date
		if ( match[1].length < match[3].length ) {
			var tmp = match[1];
			match[1] = match[3];
			match[3] = tmp;
		}
		var date = new Date();
		date.setUTCFullYear(match[1]);
		date.setUTCMonth(match[2]-1);
		date.setUTCDate(match[3]);
		date.setUTCHours(match[4] || 0);
		date.setUTCMinutes(match[5] || 0);
		date.setUTCSeconds(match[6] || 0);
		date.setUTCMilliseconds(match[7] || 0);
		return date;
	} else {
		throw "Invalid ISO date";
	}
};

// Helper function to convert a date to an iso string, only the date part
Date.prototype.toISODateString = function() {
	return this.getUTCFullYear() + "-" + pad(this.getUTCMonth()+1,2) + "-" + pad(this.getUTCDate(),2);
};

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

// A constant
var ONE_MONTH = 24 * 30 * 3600 * 1000;

	/**
	 * This backbone model holds in its attributes :
	 * 
	 * 1- the selection dataset id
	 * 2- the selected dates/times
	 * 3- the selected  area coordinates
	 * 4- all the selected search parameters and download options
	 * 
	 * the dataset property is a nested backbone model loaded through the datasetSearchInfo interface.
	 * the DataSetSearch is a singleton used throughout the application.
	 *
	 */
var DataSetSearch = Backbone.Model.extend({
	
	defaults:{
		stop: new Date(),
		start : new Date( new Date().getTime() - ONE_MONTH ),
		useExtent : true,
		useTimeSlider : true, //flag for displaying time slider or not
		dateRange: null,
		advancedAttributes: {},
		downloadOptions: {},
		mode: "Simple",
		// Correlation/Interferometry parameters
		dDiff: 10,
		sOverP: 25,
		nBase: 5,
		bSync: 5
		//viewAccess : true,
		//downloadAccess : true
	},
	
	name: "Search",
	
	initialize : function() {
		// A string representing the datasets selected
		this.datasets = "";
		
		// The number of selected datasets
		this.numDatasets = 0;
		
		// The search area
		this.searchArea = new SearchArea();
		
		// Automatically load the dataset when the datasetId is changed
		this.listenTo(DatasetPopulation, 'select', this.onDatasetSelectionChanged );
		this.listenTo(DatasetPopulation, 'unselect', this.onDatasetSelectionChanged );
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
	
	
	/** Call when the dataset selection is changed */
	onDatasetSelectionChanged : function() {
	
		this.datasets = "";
		this.numDatasets = 0;
		for ( var x in DatasetPopulation.selection ) {
			if ( this.datasets.length > 0 ) {
				this.datasets += ',';
			}
			this.datasets += x;
			this.numDatasets++;
		}
		
		this.trigger('change:numDatasets');
		
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
	
	},
		 
	/** 
	 * Remove all advanced attributes and download options
	 * The option silent is set to true to avoid firing unused events.
	 */ 
	clearAdvancedAttributesAndDownloadOptions : function(){
		
		var self = this;			
	
		//remove selected search criteria
		_.each(this.get('advancedAttributes'), function(attribute){
			if (self.has(attribute.id)) {
				self.unset(attribute.id, {silent: true});
			}
		});			

		_.each(this.get('downloadOptions'), function(option){
			if (self.has(option.argumentName)){
				self.unset(option.argumentName, {silent: true});
			}				
		});
			
	},
	
	/** Create the openSearch url. 
	 * The url contains spatial, temporal and search criteria parameters.
	 */
	getOpenSearchURL : function(){

		var url = Configuration.serverHostName + Configuration.baseServerUrl + "/catalogue/"+ this.getCoreURL() + "&format=json";
		
		//console.log("DatasetSearch module : getOpenSearchURL method : " + url);
		
		return url;
	},
	
	/** get the url without base url with all search criteria */
	getCoreURL : function() {
		
		var url =  this.datasets + "/search?";

		//add area criteria if set
		url += this.addGeoTemporalParams();
		
		//always add the advanced criteria values selected and already set to the model
		url = this.addAdvancedCriteria(url);

		//add the download options values selected and already set to the model
		url = this.addDownloadOptionsWithProductURIConvention(url);
		
		//console.log("DatasetSearch module : getCoreURL method : " + url);
		
		return url;
	},
		
	/** get the url without base url with all search criteria */
	getOpenSearchParameters : function(){
		
		//add area criteria if set
		var params = this.addGeoTemporalParams();
		
		//always add the advanced criteria values selected and already set to the model
		params = this.addAdvancedCriteria(params);

		//add the download options values selected and already set to the model
		params = this.addDownloadOptionsWithProductURIConvention(params);
		
		//console.log("DatasetSearch module : getCoreURL method : " + url);
		
		return params;
	},
	
	/**
	 * Get the shared search URL
	 */
	getSharedSearchURL : function(){

		var url = "#data-services-area/search/" +  this.datasets + '?';
		
		//add area criteria if set
		url += this.addGeoTemporalParams();
		
		//always add the advanced criteria values selected and already set to the model
		url = this.addAdvancedCriteria(url);

		//add the download options values selected and already set to the model
		url = this.addDownloadOptions(url);
		
		return url;
	},
	
	/**
	 * Populate the model with the parameters retrieved from the Shared URL
	 */
	populateModelfromURL : function(query){
			
		var vars = query.split("&");
		
		// Force useExtent to false to avoid bug when setting the geometry
	    var attributes = { 'useExtent': false };
		
	    for (var i = 0; i < vars.length; i++) {
	        
	    	var pair = vars[i].split("=");
			if (pair.length != 2) 
				throw "Invalid OpenSearch URL : parameter " + vars[i] + "not correctly defined."
	    		
			switch (pair[0]) {
				case "bbox": 
					var coords = pair[1].split(",");
					if ( coords.length != 4 )
						throw "Invalid OpenSearch URL : bbox parameter is not correct."
					this.searchArea.setBBox({west : coords[0],south : coords[1],east : coords[2],north: coords[3]});
					break;
				case "geom":
					// TODO : check polygon is correct
					this.searchArea.setFromWKT(pair[1]);
					break;
				case "start" : 
					try {
						attributes['start'] = Date.fromISOString(pair[1]);
					} catch (err) {
						throw "Invalid OpenSearch URL : start parameter is not correct."
					}
					break;
				case "stop" : 
					try {
					attributes['stop'] = Date.fromISOString(pair[1]);
					} catch (err) {
						throw "Invalid OpenSearch URL : stop parameter is not correct."
					}
					break;
					
				default :
					
					if ( _.has(pair[0]) ) {
						attributes[pair[0]] = pair[1];
					} else {
						//set the parameters if there are advanced attributes, download options or attributes of the model
						//skip any other parameter
						if ( this.get('advancedAttributes').hasOwnProperty(pair[0]) ) {
							attributes[pair[0]] = pair[1];
						}
						else if ( this.get('downloadOptions').hasOwnProperty(pair[0]) ) {
							attributes[pair[0]] = this.get('downloadOptions')[pair[0]].cropProductSearchArea ? true : pair[1];
						}
					}
					break;
			}
					
	   	}
				
	    this.set(attributes);
		
		// Manual trigger of a change:searchArea event because SearchArea is not (yet?) a Backbone model
		this.trigger('change:searchArea');

	},

	//add date WITHOUT cf ngeo 368 time and area parameters
	addGeoTemporalParams : function () {
	
		var params = "start=" + this.get("start").toISOString()  + "&" + 
		"stop=" + this.get("stop").toISOString();
		
		params += "&" + this.searchArea.getOpenSearchParameter();
		
		//console.log("DatasetSearch module : addGeoTemporalParams : " + url);
		return params;
	},
	
	//add advanced criteria to the given url
	addAdvancedCriteria : function(url) {
		
		var self = this;
		
		//add the advanced criteria not set in the model ie not changed by the user
		//with their default values from the dataset 
		var advancedAttributes = this.get('advancedAttributes');
		if (advancedAttributes) {
					
			_.each(advancedAttributes, function(attribute){

				// Check if the avanced attribute has a value in the DatasetSearch
				if ( self.has(attribute.id) ) {
					url += '&' + attribute.id + '=' + self.get(attribute.id);
				}
				
			});
		}
		
		//console.log("DatasetSearch module : addAdvancedCriteria : " + url);
		return url;
	},
	
	/**
	 * add download options to the given url by appending "&param_1=value_1&...&param_n=value_n" to the url
	 * returns the modified url
	 */
	addDownloadOptions : function(url) {
	
		var self = this;
		//add the selected download options to the opensearch url					
		_.each(this.get('downloadOptions'), function(option){
			
			if ( self.has(option.argumentName) ) {
				if ( !option.cropProductSearchArea ) {
					url += '&' + option.argumentName + '=' + self.get(option.argumentName);
				} else if ( self.get(option.argumentName) ) {
					url += '&' + option.argumentName + '=' + self.searchArea.toWKT(); 
				}
				
			}
		});

		//console.log("DatasetSearch module : addDownloadOptions : " + url);
		return url;
	},
	
	/**
	 * In case there are selected download options : 
	 * 		add download options to the given url by appending "&ngEO_DO={param_1:value_1,...,param_n:value_n} 
	 * 		to the url and returns the modified url.
	 * otherwise : do not append "&ngEO_DO={} to the url 
	 */
	addDownloadOptionsWithProductURIConvention : function(url){
	
		var self = this;
		//add the selected download options to the opensearch url		
				
		var downloadOptionsStr = null;
		var addedOption = false;
		
		_.each(this.get('downloadOptions'), function(option, index){
			
			if (_.has(self.attributes, option.argumentName)) {
				
				if (!addedOption){
					downloadOptionsStr = "&ngEO_DO={";
				}else{
					downloadOptionsStr += ",";
				}
				
				if ( !option.cropProductSearchArea ) {
					
					downloadOptionsStr += option.argumentName + ':' + self.attributes[option.argumentName];
					
				} else if (self.attributes[option.argumentName]) {
					
					downloadOptionsStr += option.argumentName + ':' + self.searchArea.toWKT(); 
				}

				if (!addedOption){
					addedOption = true;
				}
			}
		});
		
		if (downloadOptionsStr) {
			downloadOptionsStr += "}";
			url += downloadOptionsStr;
		}
			

		//console.log("DatasetSearch module : addDownloadOptionsWithProductURIConvention : " + url);
		return url;
	},

	
	/** Get the selected download options as a json object.
	 * If the download options have been changed by the user, their are set as an attribute to the DatasetSearch
	 * otherwise the default value is got from the dataset.
	 */
	getSelectedDownloadOptions : function() {
		
		var selectedOptions = {};
		var self = this;
		
		//add the options set to the model ie changed by the user with the selected value
		//add options not set in the model ie not changed by the user with their default values from the dataset 
		_.each( this.get('downloadOptions'), function(option){
			
			if (_.has(self.attributes, option.argumentName)){
				selectedOptions[option.argumentName] = self.attributes[option.argumentName] ;
			}
			});
		//console.log("Selected download options of dataset : " + this.dataset.attributes.datasetId + " : ");
		//console.log(selectedOptions);
		
		return selectedOptions;
	},
	
});

return new DataSetSearch();

});