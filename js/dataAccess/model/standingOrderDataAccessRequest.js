  
define( ['jquery', 'backbone', 'configuration', 'dataAccess/model/dataAccessRequest', 'search/model/dataSetSearch'], 
		function($, Backbone, Configuration, DataAccessRequest, DataSetSearch) {

/**
 * This module deals with the creation and submission of a Standing order data access request
 * It extends DataAccessRequest module.
 */
var StandingOrderDataAccessRequest = {		

	url : Configuration.baseServerUrl + "/standingOrderDataAccessRequest",

	OpenSearchURL : "",
	
	startDate : "", //TODO keep or remove according to clarification ngeo-314
	
	startTime : "", //TODO keep or remove according to clarification ngeo-314
	
	endDate : "",
	
	endTime : "",
	
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
		
		this.startTime = timeOnly;
		this.endTime = timeOnly;
	},
	
	/** build the request to submit */
	getRequest : function() {	
		//if createBulkOrder is set to true after a validation request
		//take into account the createBulkOrder for the confirmation request
		if (self.createBulkOrder){
			
			return {
				StandingOrderDataAccessRequest : {
					requestStage :  this.requestStage,
					createBulkOrder: true,
					OpenSearchURL : this.OpenSearchURL,
					DownloadOptions : this.DownloadOptions,
					SchedulingOptions : this.getSchedulingOptions(),
					downloadLocation : this.downloadLocation 
				}
			};
		}
		
		return {
			StandingOrderDataAccessRequest : {
				requestStage :  this.requestStage,
				OpenSearchURL : this.OpenSearchURL,
				DownloadOptions : this.DownloadOptions,
				SchedulingOptions : this.getSchedulingOptions(),
				downloadLocation : this.downloadLocation 
			}
		};
		
	},
	
	/** build the Scheduling option property depending on the STO type */
	getSchedulingOptions : function (){
		
		if (this.timeDriven){
			
			return { TimeDriven : { 
				startDate : DataSetSearch.formatDate(this.startDate, this.startTime),
				endDate : DataSetSearch.formatDate(this.endDate, this.endTime),
				repeatPeriod : this.repeatPeriod, 
				slideAcquisitionTime : this.slideAcquisitionTime 
				} 
			};

		}else{
			return { DataDriven : { 
				startDate : DataSetSearch.formatDate(this.startDate, this.startTime),
				endDate : DataSetSearch.formatDate(this.endDate, this.endTime)
				} };
		}
	},
	
	/** message to display as information */
	getSpecificMessage : function(){
		
		var collapsibleContent = "<h5> Standing Order info <h5>";
		
		collapsibleContent += "<p> OpenSearchURL: " + this.OpenSearchURL + "<p>";
		
		if (this.DownloadOptions === {} ){
			collapsibleContent += "<p> There are no download Options <p>";
		
		}else{	

			_.each(this.DownloadOptions, function(value, key){
				collapsibleContent += "<p>" + value + " : " + key + "<p>";
			});
		}
		
		return collapsibleContent; 
	},
	
	
	/** check whether the request is valid or not */
	isValid : function(){
		
		var dataAccessConfig = Configuration.data.dataAccessRequestStatuses;
		var standingOrderConfig = Configuration.data.standingOrder;
		
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

		//second stage submission with and without bulk order if the user changes the download manager 
		//between validation and confirmation
		if (this.step == 1 &&
			this.id != "" &&
			this.requestStage == dataAccessConfig.confirmationRequestStage &&
		    (this.firstRequest.StandingOrderDataAccessRequest.downloadLocation.DownloadManagerId != 
		    	this.downloadLocation.DownloadManagerId)) {
			
				this.serverResponse = dataAccessConfig.invalidConfirmationRequest;
				this.trigger('toggleRequestButton', ['disable']);
				
				return false;
		}	
		
		var computedShedulingOptions = this.getSchedulingOptions();		
		console.log(computedShedulingOptions);
		
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
			this.requestStage == dataAccessConfig.confirmationRequestStage &&
		    (this.firstRequest.StandingOrderDataAccessRequest.downloadLocation.DownloadManagerId ==
		    	this.downloadLocation.DownloadManagerId)
		 ){
			return true;
		}

		//disable the request validation if the request is not valid
		this.trigger('toggleRequestButton', ['disable']);
		
		return false;
	},
	
	/** store the standing order validation request */ 
	keepFirstRequestMembers: function(){
		 this.firstRequest.StandingOrderDataAccessRequest.requestStage = this.requestStage;
		 this.firstRequest.StandingOrderDataAccessRequest.downloadLocation.DownloadManagerId = this.downloadLocation.DownloadManagerId;
		 this.firstRequest.StandingOrderDataAccessRequest.downloadLocation.DownloadDirectory = this.downloadLocation.DownloadDirectory;
		 this.firstRequest.StandingOrderDataAccessRequest.OpenSearchURL = this.OpenSearchURL;
		 this.firstRequest.StandingOrderDataAccessRequest.DownloadOptions = this.DownloadOptions;
		 this.firstRequest.StandingOrderDataAccessRequest.SchedulingOptions = this.SchedulingOptions;
		 
	},
	
	/** specific Standing order additional processing after validation request */
	validationProcessing : function (dataAccessRequestStatus){
		//there is nothing specific for standing orders
	}
	
}

//add DataAccessRequest methods to SimpleDataAccessRequest
_.extend(StandingOrderDataAccessRequest, DataAccessRequest);

return StandingOrderDataAccessRequest;

});