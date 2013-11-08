  
define( ['jquery', 'backbone', 'configuration', 'search/model/dataset', 'search/model/searchArea', 'search/model/datasetSearch'], 
		function($, Backbone, Configuration, Dataset, SearchArea, DataSetSearch) {

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
	 * The StandingOrder dataset property is depending on the dataset of singleton DataSetSearch.
	 *
	 */
var StandingOrder = Backbone.Model.extend({
	
	defaults:{
		datasetId : "",
		stop: new Date(),
		start : new Date( new Date().getTime() - ONE_MONTH ),
		useExtent : true,
		useTimeSlider : false //flag for displaying time slider or not
	},
	
	name: "Subscribe",
	
	initialize : function() {
		//no dataset is selected
		this.dataset = undefined;
		// The search area
		this.searchArea = new SearchArea();

		// Automatically load the dataset when the datasetId of DataSetSearch changed
		DataSetSearch.on('change:dataset', this.loadDataset, this );
	},
	
	/** load the information for the selected dataset from the server 
	 * unless if no dataset is selected set the dataset to undefined */
	loadDataset : function(){
		this.set({ 'datasetId' : DataSetSearch.get('datasetId') });
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
					var start = self.get('start');
					var stop = self.get('stop'); 
					var datasetStart = model.get('startDate');
					var datasetStop = model.get('endDate');
					
					if ( stop > datasetStop || start < datasetStart ) {
						stop = new Date( datasetStop.getTime() );
						// The start date is set to one month before the stop date (or the dataset start date if less than one month before)
						var diff = (datasetStop - datasetStart);
						if ( diff > ONE_MONTH ) {
							start = new Date( stop.getTime() - ONE_MONTH );
						} else {
							start = new Date(datasetStart.getTime() );
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
					} 
					
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
		
		if (this.dataset) {
		
			var protectedAttributes = [ "start", "stop" ];
			
			//remove selected search criteria
			if (this.dataset.get('attributes')){			
				_.each(this.dataset.get('attributes'), function(attribute){
					if (!_.contains(protectedAttributes, attribute.id) && _.has(self.attributes, attribute.id)){
						self.unset(attribute.id, {silent: true});
					}				
				});
			}
			//remove selected download options
			if (this.dataset.get('downloadOptions')){			
				
				_.each(this.dataset.get('downloadOptions'), function(option){
					if (!_.contains(protectedAttributes, option.argumentName) && _.has(self.attributes, option.argumentName)){
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
				case "startDate" : 
					try {
						attributes['start'] = Date.fromISOString(pair[1]);
					} catch (err) {
						throw "Invalid OpenSearch URL : start parameter is not correct."
					}
					break;
				case "endDate" : 
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
		
		// Add temporal parameters coming from DataSetSearch
		url = url + "start=" + this.get("start").toISOString()  + "&" + "stop=" + this.get("stop").toISOString();		
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
					if ( _.has(self.defaults, attribute.id) ) {
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
	}
	
});

return StandingOrder;

});