  
define( ['jquery', 'backbone', 'configuration', 'search/model/dataset', 'search/model/searchArea'], 
		function($, Backbone, Configuration, Dataset, SearchArea) {

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
		useExtent : true,
		useDownloadOptions : false, //flag for including download options or not		
		useTimeSlider : false //flag for displaying time slider or not
	},
	
	initialize : function() {
		// Initialize date/time with today
		var today = (new Date()).toISOString();
		//set start and stop dates/times to today
		this.setDateAndTime(today, today); 
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

		var url = Configuration.baseServerUrl + "/catalogueSearch/"+ this.getCoreURL() + "&count=10&format=json";
		
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
			
		// Force useExtent to false to avoid bug when setting the geometry
		this.set('useExtent',false);
	
		var vars = query.split("&");
	    var attributes = {};
		
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
					this.set({startdate: pair[1]});
					break;
				case "stop" : 
					this.set({stopdate: pair[1]});
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
		
		url += "&" + this.searchArea.getOpenSearchParameter();
		
		//console.log("DatasetSearch module : addGeoTemporalParams : " + url);
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
					url += '&' + attribute.id + '=' + self.attributes[attribute.id];
				}
				//default values are not included in the Url
//				else{
//					url += '&' + attribute.id + '=' + self.dataset.getDefaultCriterionValue(attribute.id);
//				}
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
		this.set("stopdate", dateOnly);
//		this.set("stopTime",timeOnly);
		
	},
	
	/** get startdate as a Date object */
	getStartDate : function(){
		var dmy = this.get("startdate").split('-');
		return new Date(dmy[2], dmy[1]-1, dmy[0]);
	},
	
	/** get stop date as a Date object */
	getStopDate : function(){
		var dmy = this.get("stopdate").split('-');
		return new Date(dmy[2], dmy[1]-1, dmy[0]);
	},
	
	/** Method called from dateRangeSlider 
	 * set the start date from a Date object */
	setStartDate : function(date){
		var dateString = date.getDate() +  '-' + (date.getMonth()+1) + '-' + date.getFullYear();
		this.set("startdate", dateString);
	},
	
	/** Method called from dateRangeSlider  
	 * set the stop date from a Date object */
	setStopDate : function(date){
		var dateString = date.getDate() +  '-' + (date.getMonth()+1) + '-' + date.getFullYear();
		this.set("stopdate", dateString);
	},
	
	getSliderBoundStartDate :function(){
//		/var scaleStartString = Configuration.localConfig.timeSlider.defautBoundStart;
		var dmy = this.get("stopdate").split('-');
		return new Date(dmy[2]-2, dmy[1]-2, dmy[0]);
	},
	
	/** Get the slider scale start date. 
	 * Use a configurable scale width rather a fixed start date 
	 * in order optimize time slider creation performance 
	 * */
	getSliderScaleDate : function(){
//		var scaleStartString = Configuration.localConfig.timeSlider.defautScaleStart;
//		var dmy = scaleStartString.split('-');
		var width = Configuration.localConfig.timeSlider.scaleYearsWidth; 
		var dmy = this.get("stopdate").split('-');	
		return new Date(dmy[2]-width, dmy[1]-1, dmy[0]);
	},
	
	/** substract 2 from the month because the months for a Date object
	 * are between 0 and 11 and that the slider date is a month before the stop date*/
	getSliderStartDate : function(){
		var dmy = this.get("stopdate").split('-');
		return new Date(dmy[2], dmy[1]-2, dmy[0]);
	},
	
	
	/** add the time slider to the bottom of the map view  and
	 * move the dataset message up */
	
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