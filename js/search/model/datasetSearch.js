  
define( ['jquery', 'backbone', 'configuration', 'search/model/dataset'], 
		function($, Backbone, Configuration, Dataset) {

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
	 */
var DataSetSearch = Backbone.Model.extend({
	
	defaults:{
		datasetId : "",
		startdate : "", //name of the opensearch request parameter
		stopdate: "", //name of the opensearch request parameter
		startTime : "",
		stopTime: "", 
		polygon: null,
		west: "",
		south : "",
		east : "",
		north : "",
		useExtent : true,
		useAdvancedCriteria : false, //flag for including advanced search criteria or not		
		useDownloadOptions : false //flag for including download options or not		
	},
	
	initialize : function() {
		// Initialize date/time with today
		var today = (new Date()).toISOString();
		//set start and stop dates/times to today
		this.setDateAndTime(today, today); 
		//no dataset is selected
		this.dataset = undefined;
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
					//update dates/times from dataset dates/times
					self.setDateAndTime(model.attributes.datasetSearchInfo.startDate, model.attributes.datasetSearchInfo.endDate); 
					self.trigger('datasetLoaded');
				},
				
				error: function(model, xhr, options) {
					console.log(model);
					//model.trigger('datasetLoaded');
				}
			});
	
		}else{
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
			//reset the useAdvancedCriteria flag
			this.set({useAdvancedCriteria : false});
			
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

		var url = Configuration.baseServerUrl + "/catalogueSearch/"+ this.get("datasetId") + "?" +
				 "&count=10";
		
		//add area criteria if set
		url = this.addGeoTemporalParams(url);
		
		//add the advanced criteria values selected and already set to the model
		if (this.get("useAdvancedCriteria")){
			url = this.addAdvancedCriteria(url);
		}
		//add the download options values selected and already set to the model
		if (this.get("useDownloadOptions")){
			url = this.addDownloadOptions(url);
		}
		
		console.log("DatasetSearch module : getOpenSearchURL method : " + url);
	
		return url;
	},
	
	/**
	 * Get the shared url given the selected view id 
	 */
	getSharedUrl : function(){

		//var url = Configuration.baseServerUrl + "/" + viewId + "/"+ this.get("datasetId") + "?";
		var url = "#data-services-area/search/" +  this.get("datasetId") + "?";
		//add area criteria if set
		url = this.addGeoTemporalParams(url);
		
		//add use extent
		url =url + "&useExtent=" + this.get("useExtent");
		
		//add the advanced criteria values selected and already set to the model
		if (this.get("useAdvancedCriteria")){
			url = url + "&useAdvancedCriteria=true";
			url = this.addAdvancedCriteria(url);
		}
		//add the download options values selected and already set to the model
		if (this.get("useDownloadOptions")){
			url = url + "&useDownloadOptions=true";
			url = this.addDownloadOptions(url);
		}
		return url;
	},
	
	//Uncomment to set back the time 
	//NOT USED for the moment 
	//add date and time and area parameters
//	addGeoTemporalParams : function (url){
//	
//		url = url + "start="+ this.formatDate(this.get("startdate"), this.get("startTime")) + "&" + 
//		"stop=" + this.formatDate(this.get("stopdate"), this.get("stopTime"));
//
//		//add area criteria if set
//		if (this.get("west") != "" && this.get("south") != ""
//			&& this.get("east") != "" && this.get("north") != ""){
//		
//			var url = url  +  "&" + 
//			"bbox=" + this.get("west") + "," + this.get("south") + "," 
//			+ this.get("east") + "," + this.get("north");
//		}
//		
//		return url;
//	},
	

	//add date WITHOUT cf ngeo 368 time and area parameters
	addGeoTemporalParams : function (url){
	
		url = url + "start=" + this.get("startdate")  + "&" + 
		"stop=" + this.get("stopdate");

		if (this.get("polygon")) {
		
			// See http://www.opensearch.org/Specifications/OpenSearch/Extensions/Geo/1.0/Draft_2#The_.22geometry.22_parameter
			var polygon = this.get("polygon");
			url += "&g=POLYGON(";
			for ( var j = 0; j < polygon.length; j++ ) {
				if ( j != 0 ) {
					url += ",";
				}
				url += "(";
				for ( var i = 0; i < polygon[j].length; i++ ) {
					if ( i != 0 ) {
						url += ",";
					}
					url += polygon[j][i][1] + " " + polygon[j][i][0]
				}
				url += ")";
			}
			
			url += ")";
		
		}else (this.get("west") != "" && this.get("south") != ""
			&& this.get("east") != "" && this.get("north") != ""){
		
			var url = url  +  "&" + 
			"bbox=" + this.get("west") + "," + this.get("south") + "," 
			+ this.get("east") + "," + this.get("north");
		}
		
		return url;
	},
	
	//add advanced criteria to the given url
	addAdvancedCriteria : function(url){
		
		var self = this;
		
		//add the advanced criteria not set in the model ie not changed by the user
		//with their default values from the dataset 
		if (this.dataset.attributes.datasetSearchInfo.attributes){
			
			_.each(this.dataset.attributes.datasetSearchInfo.attributes, function(attribute){
				
				if (_.has(self.attributes, attribute.id)){
					url = url  +  '&' + attribute.id + '=' + self.attributes[attribute.id];
				}else{
					url = url  +  '&' + attribute.id + '=' + self.dataset.getDefaultCriterionValue(attribute.id);
				}
			});
		}
		
		return url;
	},
	
	//add download options to the given url
	addDownloadOptions : function(url){
	
		var self = this;
		//add the selected download options to the opensearch url
			
		if (this.dataset.attributes.datasetSearchInfo.downloadOptions){
			
			_.each(this.dataset.attributes.datasetSearchInfo.downloadOptions, function(option){
				
				if (_.has(self.attributes, option.argumentName)){
					url = url  +  '&' + option.argumentName + '=' + self.attributes[option.argumentName];
				}else{
					url = url  +  '&' + option.argumentName + '=' + self.dataset.getDefaultDownloadOptionValue(option.argumentName);	
				}
			});
		}

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
		console.log("Selected options of dataset : " + this.dataset.attributes.datasetId + " : ");
		console.log(selectedOptions);
		
		return selectedOptions;
	},
	
	/** 
	 * Splits a given date/time into date and time for start and stop dates & times.
	 * Uncomment the code to use back the time
	 */
	setDateAndTime : function(startDate, stopDate){
		
		//set start date and time TO USE IF TIME IS REUSED BACK
		var dateOnly = startDate.substring(0, startDate.indexOf('T'));
		var timeOnly = startDate.substring(startDate.indexOf('T')+1, startDate.lastIndexOf(':'));

		this.set("startdate",dateOnly);
//		this.set("startTime",timeOnly);
//		
		if (startDate != stopDate){
			dateOnly = stopDate.substring(0, stopDate.indexOf('T'));
			timeOnly = stopDate.substring(stopDate.indexOf('T')+1, stopDate.lastIndexOf(':'));
			this.set("stopdate",dateOnly);
//			this.set("stopTime",timeOnly);
		}
//		
//		//set stop date and time
		this.set("stopdate",dateOnly);
//		this.set("stopTime",timeOnly);
		
		
	},
	
	/** Format to openSearch compliant date format : 
	 * the seconds are added manually since not handled by the TimeBox widget
	 * to confirm later whether to use another widget...
	 * TODO CONFIRM TIME FORMAT
	 */
	formatDate : function(date, time){
		return date + "T" + time + ":00.00Z"; 
	}
	
});

return new DataSetSearch();

});