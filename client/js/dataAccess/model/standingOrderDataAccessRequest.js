  
define( ['jquery', 'backbone', 'configuration', 'dataAccess/model/dataAccessRequest', 'search/model/datasetSearch'], 
		function($, Backbone, Configuration, DataAccessRequest, DatasetSearch) {
	
/**
 * This module deals with the creation and submission of a Standing order data access request
 * It extends DataAccessRequest module.
 */
var StandingOrderDataAccessRequest = {		

	url : Configuration.baseServerUrl + "/standingOrderDataAccessRequest",

	OpenSearchURL : "",
	
	startDate : "", //TODO keep or remove according to clarification ngeo-314
	
//	startTime : "", //TODO keep or remove according to clarification ngeo-314
	
	endDate : "",
	
//	endTime : "",
	
	timeDriven : false,
	
	repeatPeriod : 0,
	
	slideAcquisitionTime : false,
	
	DownloadOptions: {}, 
	
	SchedulingOptions : {},
	
	resetRequest : function (){
		
		this.OpenSearchURL = "";
		this.DownloadOptions = {};
		this.SchedulingOptions = {};
		this.timeDriven = false;
		this.repeatPeriod = 0;
		this.slideAcquisitionTime = false;
		
		//set date to the current date
		var today = (new Date()).toISOString();
		var dateOnly = today.substring(0, today.indexOf('T'));
		var timeOnly = today.substring(today.indexOf('T')+1, today.lastIndexOf(':'));
		
		this.startDate = dateOnly;
		this.endDate = dateOnly;
//		UNCOMMENT TO REUSE THE TIME	
//		this.startTime = timeOnly;
//		this.endTime = timeOnly;
	},
	
	/** build the request to submit */
	getRequest : function() {

		var request = {
				StandingOrderDataAccessRequest : {
					requestStage :  this.requestStage,
					OpenSearchURL : this.OpenSearchURL,
					DownloadOptions : this.DownloadOptions,
					SchedulingOptions : this.getSchedulingOptions(),
					downloadLocation : this.downloadLocation 
				}
			};
			
		//if createBulkOrder is set to true after a validation request
		//take into account the createBulkOrder for the confirmation request
		if (self.createBulkOrder){
			request.StandingOrderDataAccessRequest.createBulkOrder = true;
		}
		
		return  request;
		
	},
	
	/** the shared standing order url contains :
	 * 	1- all the search parameters as for as for a shared  search url. 
	 *  2- scheduling options parameters relative to a standing order request
	 */
	getSharedURL : function(){

		var url = "#data-services-area/sto/" +  DatasetSearch.get("datasetId") + '?';
		
		// Extract parameters from the OpenSearchURL
		var openSearchParameters = this.OpenSearchURL.split('?');
		if ( openSearchParameters.length > 1 ) {
			url += openSearchParameters[1];
		}
		
		//add area and date criteria 
		//url = DatasetSearch.addGeoTemporalParams(url);

		//always add the advanced criteria values selected and already set to the model
		//url = DatasetSearch.addAdvancedCriteria(url);

		//add the download options values selected and already set to the model
		//url = DatasetSearch.addDownloadOptions(url);
		
		//get the scheduling object either the STO is TimeDriven or Data-Driven
		var options = this.timeDriven ? this.getSchedulingOptions().TimeDriven : this.getSchedulingOptions().DataDriven;
		url += "&" + $.param(options);
		
		return url;
	},
	
	/** Method used in the case of a shared standing order url.
	 * It fill in the STO request with the given values.
	 */
	populateModelfromURL : function(query){
		
		this.initialize();
		
		var vars = query.split("&");
				
	    for (var i = 0; i < vars.length; i++) {
	        
	    	var pair = vars[i].split("=");
	    		
			switch (pair[0]) {
				
			case "startDate": 
//				this.startDate = pair[1].substring(0, pair[1].indexOf('T'));
				this.startDate = pair[1];
				//console.log(this.startDate);
				break;
//			UNCOMMENT TO REUSE THE TIME	
//			case "startTime" : 
//				this.startTime = pair[1].substring(pair[1].indexOf('T')+1, pair[1].lastIndexOf(':'));
//				break;
//			case "endTime": 
//				this.endTime = pair[1].substring(pair[1].indexOf('T')+1, pair[1].lastIndexOf(':'));
//				break;
			case "endDate" : 
//				this.endDate = pair[1].substring(0, pair[1].indexOf('T'));
				this.endDate = pair[1];
				//console.log(this.endDate);
				break;
			case "repeatPeriod": 
				this.repeatPeriod = pair[1];
				this.timeDriven = true;
				break;
			case "slideAcquisitionTime" : 
				this.slideAcquisitionTime = (pair[1]=="true"); //set boolean value not the string !
				this.timeDriven = true;
				break;
				
			default :
				break;
	    	}
	    }
	    
		//set open search url
	    //console.log("DatasetSearch.getOpenSearchURL()");
	   // console.log(DatasetSearch.getOpenSearchURL());
	    this.OpenSearchURL = DatasetSearch.getOpenSearchURL();
		//set selected download options
	    this.DownloadOptions = DatasetSearch.getSelectedDownloadOptions();
	},
	
	/** build the Scheduling option property depending on the STO type */
	getSchedulingOptions : function (){
		
		if (this.timeDriven){
			
			return { TimeDriven : { 
//				UNCOMMENT TO REUSE THE TIME				
//				startDate : DatasetSearch.formatDate(this.startDate, this.startTime),
//				endDate : DatasetSearch.formatDate(this.endDate, this.endTime),
				startDate : this.startDate,
				endDate : this.endDate,
				repeatPeriod : this.repeatPeriod, 
				slideAcquisitionTime : this.slideAcquisitionTime 
				} 
			};

		}else{
			return { DataDriven : { 
//				UNCOMMENT TO REUSE THE TIME	
//				startDate : DatasetSearch.formatDate(this.startDate, this.startTime),
//				endDate : DatasetSearch.formatDate(this.endDate, this.endTime)			
				startDate : this.startDate,
				endDate : this.endDate
			} };
		}
	},
	
	/** message to display as information 
	 * Display nothing for STO */
	getSpecificMessage : function(){
		
//		var collapsibleContent = "<h5> Standing Order info <h5>";
//		
//		collapsibleContent += "<p> OpenSearchURL: " + this.OpenSearchURL + "<p>";
//		
//		if (this.DownloadOptions === {} ){
//			collapsibleContent += "<p> There are no download Options <p>";
//		
//		}else{	
//
//			_.each(this.DownloadOptions, function(value, key){
//				collapsibleContent += "<p>" + value + " : " + key + "<p>";
//			});
//		}
//		
//		return collapsibleContent; 
	},
	
	
	/** check whether the request is valid or not */
	isValid : function(){
		
		var dataAccessConfig = Configuration.localConfig.dataAccessRequestStatuses;
		var standingOrderConfig = Configuration.localConfig.standingOrder;
		
		//if request not valid when no download manager then display the specific message
		//the validate button is not disabled since when the user selects a download manager the request
		if (this.downloadLocation.DownloadManagerId == ""){
			this.serverResponse = dataAccessConfig.invalidDownloadManagersError;
			return false;
		}
		
		if (this.OpenSearchURL == "" || !this.OpenSearchURL){
			this.serverResponse = standingOrderConfig.invalidOpenSearchURLError;
			return false;
		}

		if (!this.DownloadOptions){
			this.serverResponse = standingOrderConfig.invalidDownloadOptionsError;
			return false;
		}
	
		var computedShedulingOptions = this.getSchedulingOptions();		
		
		//initial request : nominal case
		//slideAcquisitionTime is a boolean and repeatPeriod is number so compare with undefined
		//to avoid 0/boolean false tests 
		if (this.step == 0 && 
		    this.id == "" &&
		    this.requestStage == dataAccessConfig.validationRequestStage && 
		    this.OpenSearchURL && this.DownloadOptions && 
		    this.SchedulingOptions && 
		    ((computedShedulingOptions.DataDriven && computedShedulingOptions.DataDriven.endDate) ||
		     (computedShedulingOptions.TimeDriven && computedShedulingOptions.TimeDriven.endDate &&
		    		 computedShedulingOptions.TimeDriven.repeatPeriod != undefined &&  
		    		 computedShedulingOptions.TimeDriven.slideAcquisitionTime != undefined))) {
			return true;
		}
	
		//second stage submission with and without bulk order
		//no need to test the other properties because they cannot be changed in the meantime
		if (this.step == 1 &&
			this.id != "" &&
			this.requestStage == dataAccessConfig.confirmationRequestStage
		 ){
			return true;
		}

		//disable the request validation if the request is not valid
		this.trigger('RequestNotValidEvent');
		
		return false;
	},
		
	/** specific Standing order additional processing after validation request */
	validationProcessing : function (dataAccessRequestStatus){
		//there is nothing specific for standing orders
	}
	
}

//add DataAccessRequest methods to StandingOrderDataAccessRequest
_.extend(StandingOrderDataAccessRequest, DataAccessRequest);

return StandingOrderDataAccessRequest;

});