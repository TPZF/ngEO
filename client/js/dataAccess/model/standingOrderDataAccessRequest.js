  
define( ['jquery', 'backbone', 'configuration'], function($, Backbone, Configuration) {

/**
 * This module deals with the creation and submission of a Standing order data access request
 * It extends DataAccessRequest module.
 */
var StandingOrderDataAccessRequest = {		

	url : Configuration.baseServerUrl + "/standingOrderDataAccessRequest",

	OpenSearchURL : "",
	
	endDate : "";
	
	DownloadOptions: "",
	
	//TODO handle scheduling options
	SchedulingOptions : {},
	
	resetRequest : function (){
		
		this.openSearchURL = "";
		this.endDate = "";
		this.DownloadOptions = "";
		this.SchedulingOptions : {};
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
					SchedulingOptions : this.SchedulingOptions,
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
	
	getSpecificMessage : function(){
		
		var collapsibleContent = "TODO STANDING ORDER MESSAGE";
		return collapsibleContent; 
	},
	
	
	/** check whether the request is valid or not */
	isValid : function(){
		
		var standingOrderConfig = Configuration.data.dataAccessRequestStatuses;
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
		
		//TODO validate scheduling options

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
	validationProcessing(dataAccessRequestStatus){
		//TODO SPECIFIC PROCESSING IF ANY WHEN STANDING ORDERS VALIDATION OK	
	}
	
	});

//add DataAccessRequest methods to SimpleDataAccessRequest
_.extend(StandingOrderDataAccessRequest, DataAccessRequest);

return StandingOrderDataAccessRequest;

});