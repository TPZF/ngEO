  
define( ['jquery', 'backbone', 'configuration', 'search/model/dataset', 'search/model/searchArea'], 
		function($, Backbone, Configuration, Dataset, SearchArea) {

function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}

// Helper function to convert a string in ISO format to date
Date.fromISOString = function(str) {
	var ct = str.split(/\D/);
	var date = new Date();
	// Hack to support bad date
	if ( ct[0].length < ct[2].length ) {
		var tmp = ct[0];
		ct[0] = ct[2];
		ct[2] = tmp;
	}
	date.setUTCFullYear(ct[0]);
	date.setUTCMonth(ct[1]-1);
	date.setUTCDate(ct[2]);
	if ( ct.length > 3 ) {
		date.setUTCHours(ct[3]);
		date.setUTCMinutes(ct[4]);
		date.setUTCSeconds(ct[5]);
		date.setUTCMilliseconds(ct[6]);
	}
	return date;
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
		useDownloadOptions : false, //flag for including download options or not		
		useTimeSlider : false //flag for displaying time slider or not
	},
	
	initialize : function() {
		//no dataset is selected
		this.dataset = undefined;
		// The search area
		this.searchArea = new SearchArea();
	},
	
	/** load the information for the selected dataset from the server 
	 * unless if no dataset is selected set the dataset to undefined */
	updateDatasetModel : function(){

		//reset all the selected attributes and download options from the old dataset if any
		this.clearSelectedAttributesAndOptions();
		
		//Retrieve the dataset information from the server
		if (this.get("datasetId")){
			
			this.dataset = new Dataset({datasetId : this.get("datasetId")});			
			var self = this;
			this.dataset.fetch({
				
				success: function(model, response, options) {
					
					var startDate = model.attributes.datasetSearchInfo.startDate;
					var endDate = model.attributes.datasetSearchInfo.endDate;
					
					if (!startDate || !endDate) {
						self.set({start: new Date(),
							stop: new Date() }); 
					} else {
						//update dates/times from dataset dates/times
						self.set({start: Date.fromISOString(startDate),
							stop: Date.fromISOString(endDate) }); 
					}
					
					self.trigger('datasetLoaded');
					
				},
				
				error: function(model, xhr, options) {
					//console.log(model);
					//fire datasetNotLoadError event with the datasetId to notify the failure when loading the dataset
					self.trigger('datasetNotLoadError', self.get("datasetId"));
					
					self.dataset = undefined;
					self.set('datasetId','');
				}
			});
	
		} else {
			this.dataset = undefined;
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
			if (this.dataset.attributes.datasetSearchInfo.attributes){			
				_.each(this.dataset.attributes.datasetSearchInfo.attributes, function(attribute){
					if (_.has(self.attributes, attribute.id)){
						self.unset(attribute.id, {silent: true});
					}				
				});
			}
			//remove selected download options
			if (this.dataset.attributes.datasetSearchInfo.downloadOptions){			
				//reset the useDownloadOptions flag
				this.set({useDownloadOptions : false});
				
				_.each(this.dataset.attributes.datasetSearchInfo.downloadOptions, function(option){
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

		var url = Configuration.baseServerUrl + "/catalogueSearch/"+ this.getCoreURL() + "&format=json";
		
		console.log("DatasetSearch module : getOpenSearchURL method : " + url);
		
		return url;
	},
	
	/** get the url without base url with all search criteria */
	getCoreURL : function(){
		
		var url =  this.get("datasetId") + "?";

		//add area criteria if set
		url = this.addGeoTemporalParams(url);
		
		//always add the advanced criteria values selected and already set to the model
		url = this.addAdvancedCriteria(url);

		//add the download options values selected and already set to the model
		if (this.get("useDownloadOptions")){
			url = this.addDownloadOptions(url);
		}
		
		//console.log("DatasetSearch module : getCoreURL method : " + url);
		
		return url;
	},
	
	/**
	 * Get the shared search URL
	 */
	getSharedSearchURL : function(){

		//var url = Configuration.baseServerUrl + "/" + viewId + "/"+ this.get("datasetId") + "?";
		var url = "#data-services-area/search/" +  this.getCoreURL();
		
		// add use extent
		// FL : for now never set useExtent can introduce bugs when dealing with polygon
		// url +=  "&useExtent=" + this.get("useExtent");
		
		//add the download options values selected and already set to the model
		if (this.get("useDownloadOptions")){
			url += "&useDownloadOptions=true";
		}
		
		//console.log("DatasetSearch module : getSharedSearchURL method : " + url);
		
		return url;
	},
	
	/**
	 * Populate the model with the parameters retrieved from the Shared URL
	 */
	populateModelfromURL : function(query){
		
		// Check if url is complete
		if ( query.match(/^http/) ) {
			var sep = query.indexOf('?');
			var datasetId = query.slice( query.lastIndexOf('/')+1, sep );
			this.set('datasetId',datasetId);
			query = query.substr( sep+1 );
		}
	
		var vars = query.split("&");
		
		// Force useExtent to false to avoid bug when setting the geometry
	    var attributes = { 'useExtent': false };
		
	    for (var i = 0; i < vars.length; i++) {
	        
	    	var pair = vars[i].split("=");
	    		
			switch (pair[0]) {
				case "bbox": 
					var coords = pair[1].split(",");
					this.searchArea.setBBox({west : coords[0],south : coords[1],east : coords[2],north: coords[3]});
					break;
				case "g":
					this.searchArea.setFromWKT(pair[1]);
					break;
				case "start" : 
					attributes['start'] = Date.fromISOString(pair[1]);
					break;
				case "stop" : 
					attributes['stop'] = Date.fromISOString(pair[1]);
					break;
					
				default :
					
					if (_.has(this.attributes, pair[0])){
						attributes[pair[0]] = pair[1];
					
					} else {
						//set the parameters if there are advanced attributes, download options or attributes of the model
						//skip any other parameter
						_.each(this.dataset.attributes.datasetSearchInfo.attributes, function(criterion){
							if (criterion.id == pair[0]){
								console.log("set criterion " + criterion.id + "====" + pair[1]);
								attributes[pair[0]] = pair[1];
							}
						});
					
						_.each(this.dataset.attributes.datasetSearchInfo.downloadOptions, function(option){
							if (option.argumentName == pair[0]){
								console.log("set option " + option.argumentName + "====" + pair[1]);
								attributes[pair[0]] = pair[1];
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
		var advancedAttributes = this.dataset.attributes.datasetSearchInfo.attributes;
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
	
	//add download options to the given url
	addDownloadOptions : function(url){
	
		var self = this;
		//add the selected download options to the opensearch url
			
		if (this.dataset.attributes.datasetSearchInfo.downloadOptions){
			
			_.each(this.dataset.attributes.datasetSearchInfo.downloadOptions, function(option){
				
				if (_.has(self.attributes, option.argumentName)){
					url += '&' + option.argumentName + '=' + self.attributes[option.argumentName];
				}else{
					url += '&' + option.argumentName + '=' + self.dataset.getDefaultDownloadOptionValue(option.argumentName);	
				}
			});
		}

		//console.log("DatasetSearch module : addDownloadOptions : " + url);
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
		if (this.dataset.attributes.datasetSearchInfo.downloadOptions){
			
			_.each(this.dataset.attributes.datasetSearchInfo.downloadOptions, function(option){
				console.log("option" + option);
				console.log("option.argumentName : " + option.argumentName);
				
				if (_.has(self.attributes, option.argumentName)){
					selectedOptions[option.argumentName] = self.attributes[option.argumentName] ;
				}else{
					selectedOptions[option.argumentName] = self.dataset.getDefaultDownloadOptionValue(option.argumentName);	
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