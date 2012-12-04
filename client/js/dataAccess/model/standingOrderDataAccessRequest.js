  
define( ['jquery', 'backbone', 'configuration', 'dataAccess/model/dataAccessRequest'], 
		function($, Backbone, Configuration, DataAccessRequest) {

/**
 * This module deals with the creation and submission of a Standing order data access request
 * It extends DataAccessRequest module.
 */
var StandingOrderDataAccessRequest = {		

	url : Configuration.baseServerUrl + "/standingOrderDataAccessRequest",

	OpenSearchURL : "",
	
	startDate : "", //TODO keep or remove according to clarification ngeo-314
	
	endDate : "",
	
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
		//TODO add time widgets
		this.startDate = dateOnly;
		this.endDate = dateOnly;
	},
	
	getRequest : function() {	
		//if createBulkOrder is set to true after a validation request
		//take into account the createBulkOrder for the confiramtion request
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
				SchedulingOptions : this.SchedulingOptions,
				downloadLocation : this.downloadLocation 
			}
		};
		
	},
	
	getSchedulingOptions : function (){
		
		if (this.timeDriven){
			
			return { TimeDriven : { 
				startDate : this.startDate,
				endDate : this.endDate,
				repeatPeriod : this.repeatPeriod, 
				slideAcquisitionTime : this.slideAcquisitionTime 
				} 
			};

		}else{
			return { DataDriven : { 
				startDate : this.startDate,
				endDate : this.endDate } };
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
		
		if (this.openSearchURL == ""){
			this.serverResponse = standingOrderConfig.invalidOpenSearchURLError;
			return false;
		}

		if (this.DownloadOptions == ""){
			this.serverResponse = standingOrderConfig.invalidDownloadOptionsError;
			return false;
		}

		//initial request : nominal case
		if (this.step == 0 && 
		    this.id == "" &&
		    this.requestStage == dataAccessConfig.validationRequestStage) {
			return true;
		}
	
		//second stage submission with and without bulk order
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