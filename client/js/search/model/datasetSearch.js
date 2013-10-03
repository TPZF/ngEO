  
define( ['jquery', 'backbone', 'configuration', 'search/model/dataset', 'search/model/searchArea'], 
		function($, Backbone, Configuration, Dataset, SearchArea) {

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
		datasetId : "",
		start : new Date(), //name of the opensearch request parameter
		stop: new Date(), //name of the opensearch request parameter
		useExtent : true,
		useTimeSlider : true //flag for displaying time slider or not
	},
	
	initialize : function() {
		//no dataset is selected
		this.dataset = undefined;
		// The search area
		this.searchArea = new SearchArea();
		
		// Automatically load the dataset when the datasetId is changed
		this.on('change:datasetId', this.loadDataset, this );
	},
	
	/** load the information for the selected dataset from the server 
	 * unless if no dataset is selected set the dataset to undefined */
	loadDataset : function(){

		//reset all the selected attributes and download options from the old dataset if any
		this.clearSelectedAttributesAndOptions();
		
		//Retrieve the dataset information from the server
		if ( this.get("datasetId")) {
			
			var dataset = new Dataset({datasetId : this.get("datasetId")});			
			var self = this;
			dataset.fetch({
				
				success: function(model, response, options) {
					
					// Compute a search time range from the dataset extent
					// The stop date is the dataset stop date
					var start;
					var stop = new Date( model.get('endDate').getTime() );
					
					// The start date is set to one month before the stop date (or the dataset start date if less than one month before)
					var diff = (model.get('endDate') - model.get('startDate'));
					if ( diff > 24 * 30 * 3600 * 1000 ) {
						start = new Date( stop.getTime() - 24 * 30 * 3600 * 1000 );
					} else {
						start = new Date(model.get('startDate').getTime() );
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
					
					self.set({ start: start,
							stop: stop
						}); 
						
					self.dataset = dataset;
					self.trigger('change:dataset',self.dataset);
					
				},
				
				error: function(model, xhr, options) {
					// Invalid dataset, reset datasetIds
					self.set('datasetId','');					
				}
			});
	
		} else {
			this.dataset = undefined;
			this.trigger('change:dataset',this.dataset);
		}
	},
	 
	/** 
	 * Remove all the selected criteria and  selected download options of the old selected dataset 
	 * The option silent is set to true to avoid firing unused events.
	 */ 
	clearSelectedAttributesAndOptions : function(){
		
		var self = this;
		
		if (this.dataset){
			
			//remove selected search criteria
			if (this.dataset.get('attributes')){			
				_.each(this.dataset.get('attributes'), function(attribute){
					if (_.has(self.attributes, attribute.id)){
						self.unset(attribute.id, {silent: true});
					}				
				});
			}
			//remove selected download options
			if (this.dataset.get('downloadOptions')){			
				
				_.each(this.dataset.get('downloadOptions'), function(option){
					if (_.has(self.attributes, option.argumentName)){
						self.unset(option.argumentName, {silent: true});
					}				
				});
			}
		}
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
	getCoreURL : function(){
		
		var url =  this.get("datasetId") + "/search?";

		//add area criteria if set
		url = this.addGeoTemporalParams(url);
		
		//always add the advanced criteria values selected and already set to the model
		url = this.addAdvancedCriteria(url);

		//add the download options values selected and already set to the model
		url = this.addDownloadOptionsWithProductURIConvention(url);
		
		//console.log("DatasetSearch module : getCoreURL method : " + url);
		
		return url;
	},
	
	/**
	 * Get the shared search URL
	 */
	getSharedSearchURL : function(){

		var url = "#data-services-area/search/" +  this.get("datasetId") + '?';
		
		//add area criteria if set
		url = this.addGeoTemporalParams(url);
		
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
					
					if (_.has(this.attributes, pair[0])){
						attributes[pair[0]] = pair[1];
					
					} else {
						//set the parameters if there are advanced attributes, download options or attributes of the model
						//skip any other parameter
						_.each(this.dataset.get('attributes'), function(criterion){
							if (criterion.id == pair[0]){
								//console.log("set criterion " + criterion.id + "====" + pair[1]);
								attributes[pair[0]] = pair[1];
							}
						});
					
						_.each(this.dataset.get('downloadOptions'), function(option){
							if (option.argumentName == pair[0]){
								//console.log("set option " + option.argumentName + "====" + pair[1]);
								attributes[pair[0]] = option.cropProductSearchArea ? true : pair[1];
							}
						});
					}
					break;
			}
					
	   	}
				
	    this.set(attributes);
		
		// Manual trigger of a change:searchArea event because SearchArea is not (yet?) a Backbone model
		this.trigger('change:searchArea');

	},

	//add date WITHOUT cf ngeo 368 time and area parameters
	addGeoTemporalParams : function (url){
	
		url = url + "start=" + this.get("start").toISOString()  + "&" + 
		"stop=" + this.get("stop").toISOString();
		
		url += "&" + this.searchArea.getOpenSearchParameter();
		
		//console.log("DatasetSearch module : addGeoTemporalParams : " + url);
		return url;
	},
	
	//add advanced criteria to the given url
	addAdvancedCriteria : function(url){
		
		var self = this;
		
		//add the advanced criteria not set in the model ie not changed by the user
		//with their default values from the dataset 
		var advancedAttributes = this.dataset.get('attributes');
		if (advancedAttributes) {
					
			_.each(advancedAttributes, function(attribute){

				// Check if the avanced attribute has a value in the DatasetSearch
				if ( _.has(self.attributes, attribute.id) ) {
					// Remove defaults attribute from advanced
					if ( _.has(DataSetSearch.prototype.defaults, attribute.id) ) {
						console.log("Advanced criteria warning : " + attribute.id + " is a base attribute.");
					} else {
						url += '&' + attribute.id + '=' + self.attributes[attribute.id];
					}
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
	addDownloadOptions : function(url){
	
		var self = this;
		//add the selected download options to the opensearch url
			
		if (this.dataset.get('downloadOptions')) {
			
			_.each(this.dataset.get('downloadOptions'), function(option){
				
				if (_.has(self.attributes, option.argumentName)) {
					if ( !option.cropProductSearchArea ) {
						url += '&' + option.argumentName + '=' + self.attributes[option.argumentName];
					} else if (self.attributes[option.argumentName]) {
						url += '&' + option.argumentName + '=' + self.searchArea.toWKT(); 
					}
					
				}
			});
		}

		//console.log("DatasetSearch module : addDownloadOptions : " + url);
		return url;
	},
	
	/**
	 * In case there are selected download options : 
	 * 		add download options to the given url by appending "&ngEO_DO={param_1:value_1,...,param_n:value_n} 
	 * 		to the url and returns the modified url.
	 * unless : do not append "&ngEO_DO={} to the url 
	 */
	addDownloadOptionsWithProductURIConvention : function(url){
	
		var self = this;
		//add the selected download options to the opensearch url
			
		if (this.dataset.get('downloadOptions')) {
			
			var downloadOptionsStr = null;
			var addedOption = false;
			
			_.each(this.dataset.get('downloadOptions'), function(option, index){
				
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
			
			if (downloadOptionsStr){
				downloadOptionsStr += "}";
				url += downloadOptionsStr;
			}
			
		}

		console.log("DatasetSearch module : addDownloadOptionsWithProductURIConvention : " + url);
		return url;
	},

	
	/** Get the selected download options as a json object.
	 * If the download options have been changed by the user, their are set as an attribute to the DatasetSearch
	 * unless the default value is got from the dataset.
	 */
	getSelectedDownloadOptions : function(){
		
		var selectedOptions = {};
		var self = this;
		
		//add the options set to the model ie changed by the user with the selected value
		//add options not set in the model ie not changed by the user with their default values from the dataset 
		if ( this.dataset.get('downloadOptions') ){
			
			_.each( this.dataset.get('downloadOptions'), function(option){
				
				if (_.has(self.attributes, option.argumentName)){
					selectedOptions[option.argumentName] = self.attributes[option.argumentName] ;
				}
			});
		}
		//console.log("Selected download options of dataset : " + this.dataset.attributes.datasetId + " : ");
		//console.log(selectedOptions);
		
		return selectedOptions;
	},
	
});

return new DataSetSearch();

});