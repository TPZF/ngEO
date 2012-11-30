  
define( ['jquery', 'backbone', 'configuration'], function($, Backbone, Configuration) {

/**
 * This module deals with the creation and submission of simple data access requests 
 */
var SimpleDataAccessRequest = {		

	url : Configuration.baseServerUrl + "/simpleDataAccessRequest",
	
	firstRequest : {}, //keeps track of the first stage request in order to validate the second stage request 
	
	currentRequest : {},
	
	id : "", //data access request id returned by the server 
	 
	step : 0, //step is a counter of request steps. It is set to 0 when no request has been sent
			  // it is set to 1 when a request has been sent

	serverResponse : "A validation request has been send to the server...",
	
	
	initialize : function(){
		_.extend(this, Backbone.Events);
		this.resetRequest();
	},
	
	
	resetRequest : function (){
		this.step = 0;
		this.id = "";
		this.firstRequest = this.initializeRequest();
		this.currentRequest = this.initializeRequest();
	},
	
	//TODO the DownloadDirectory is optional. Not taken into account for the moment
	initializeRequest : function() {	
		return {
			SimpleDataAccessRequest : {
				requestStage :  Configuration.data.dataAccessRequestStatuses.validationRequestStage,
				downloadLocation : {DownloadManagerId : "" , DownloadDirectory : ""}, 
				productURLs : []
			}
		};
	},
	
	/** Set the list of checked products */
	setProductURLs: function(urls){
		this.currentRequest.SimpleDataAccessRequest.productURLs = urls;
	},
	
	/** Assign the download
	 *  manager to the request */
	setDownloadManager : function(downloadManagerId){
		this.currentRequest.SimpleDataAccessRequest.downloadLocation.DownloadManagerId = downloadManagerId;
	},
	
	
	/** check whether the request is valid or not */
	isValid : function(){
		
		var dataAccessConfig = Configuration.data.dataAccessRequestStatuses;
		
		//Request not valid when no product urls set then display the specific message
		if ( this.currentRequest.SimpleDataAccessRequest.productURLs.length == 0){
			this.serverResponse = Configuration.data.dataAccessRequestStatuses.invalidProductURLsError;
			this.trigger('toggleRequestButton', ['disable']);
			return false;
		}
		
		//if request not valid when no download manager then display the specific message
		//the validate button is not disabled since when the user selects a download manager the request
		if (this.currentRequest.SimpleDataAccessRequest.downloadLocation.DownloadManagerId == ""){
			this.serverResponse = Configuration.data.dataAccessRequestStatuses.invalidDownloadManagersError;
			return false;
		}
		
		//initial request : nominal case
		if (this.step == 0 && 
		    this.id == "" &&
		    this.currentRequest.SimpleDataAccessRequest.requestStage == dataAccessConfig.validationRequestStage) {
			return true;
		}
		
		//second stage submission with and without bulk order
		if (this.step == 1 &&
			this.id != "" &&
			(this.currentRequest.SimpleDataAccessRequest.createBulkOrder == true || 
				 this.currentRequest.SimpleDataAccessRequest.createBulkOrder == undefined) &&
			this.currentRequest.SimpleDataAccessRequest.requestStage == dataAccessConfig.confirmationRequestStage &&
		    this.firstRequest.SimpleDataAccessRequest.downloadLocation === this.currentRequest.SimpleDataAccessRequest.downloadLocation &&
		    this.firstRequest.SimpleDataAccessRequest.productURLs === this.currentRequest.SimpleDataAccessRequest.productURLs
		){
			return true;
		}
		
		//disable the request validation if the request is not valid
		this.trigger('toggleRequestButton', ['disable']);
		
		return false;
	},
	
	/** Submit the request to the server */
	submit : function(){

		//check that the request is valid before sending it to the server
		if (!this.isValid()){
			return;
		}
		
		var self = this;
		
		return $.ajax({
		  url: self.url,
		  type : 'POST',
		  dataType: 'json',
		  contentType: 'application/json',
		  data : JSON.stringify(self.currentRequest),
		  success: function(data) {
			  
			  console.log(" SUCCESS : Received simple DAR validation response from the server :");
			  console.log (data);
			
			  //check the server response status with the configured server response statuses  
			  var statusesConfig = Configuration.data.dataAccessRequestStatuses;
			  var validStatusesConfig = statusesConfig.validStatuses;
			  
				  switch (data.DataAccessRequestStatus.status){
					  
				  	  case validStatusesConfig.validatedStatus.value:
						 
				  		  //initial stage
						  if (self.step == 0 && self.id == "" &&  self.currentRequest.SimpleDataAccessRequest.requestStage == statusesConfig.validationRequestStage) {
							  self.step = 1;
							  self.id = data.DataAccessRequestStatus.ID;
							  self.firstRequest = self.currentRequest;
							  self.currentRequest.SimpleDataAccessRequest.requestStage = statusesConfig.confirmationRequestStage;
							  self.serverResponse = validStatusesConfig.validatedStatus.message;
							  
							 //calculate the total download estimated size  
							  var totalSize = 0;
							  _.each(data.DataAccessRequestStatus.productStatuses, function(productStatus){
								  totalSize += productStatus.expectedSize;
							  });
							  
							  self.serverResponse += "Estimated Size : " + totalSize + "\n";
							  
						  }else{
							  self.trigger('toggleRequestButton', ['disable']);
							 
						  }
						  break;
					 
					  case validStatusesConfig.bulkOrderStatus.value:
						   
						  if (self.step == 0 && currentRequest.SimpleDataAccessRequest.requestStage == statusesConfig.validationRequestStage) {
							  self.step = 1;
							  self.id = data.DataAccessRequestStatus.ID;
							  self.firstRequest = self.currentRequest;
							  //Bulk order is considered add the createBulkOrder
							  self.currentRequest.createBulkOrder = true;
							  self.currentRequest.SimpleDataAccessRequest.requestStage = statusesConfig.confirmationRequestStage;
							  self.serverResponse = validStatusesConfig.bulkOrderStatus.message;
						  }else{
							  self.trigger('toggleRequestButton', ['disable']);
						  }
						  
						  break;
						  
					  case validStatusesConfig.inProgressStatus.value:
						  
						  if (self.step == 1 && self.id == data.DataAccessRequestStatus.ID &&
								self.currentRequest.SimpleDataAccessRequest.requestStage == statusesConfig.confirmationRequestStage) {//2 steps done
							  self.serverResponse = validStatusesConfig.inProgressStatus.message;
						  }  
						  self.trigger('toggleRequestButton', ['disable']);
						  break;
					
					  case validStatusesConfig.pausedStatus.value:
						  self.serverResponse = validStatusesConfig.pausedStatus.message;
						  self.trigger('toggleRequestButton', ['disable']);
						  break;
						  
					  case validStatusesConfig.cancelledStatus.value:
						  self.serverResponse = validStatusesConfig.cancelledStatus.message;
						  self.trigger('toggleRequestButton', ['disable']);
						  break;
					  
					  default: 
						  self.serverResponse = self.serverResponse = Configuration.data.dataAccessRequestStatuses.unExpectedStatusError ;
					  	  self.trigger('toggleRequestButton', ['disable']);
					  	  break;
				  }	  
					   
				  //if the server sends a response message append it to the message to display
				  if (data.DataAccessRequestStatus.message){
					   self.serverResponse =  self.serverResponse + "\n" + data.DataAccessRequestStatus.message;
				  }
				   
		  	  },
		  
			  error: function(jqXHR, textStatus, errorThrown) {
				  //console.log("ERROR when posting DAR :" + textStatus + ' ' + errorThrown);
				  self.serverResponse = Configuration.data.dataAccessRequestStatuses.requestSubmissionError ;
				  self.trigger('toggleRequestButton', ['disable']);
			  }
		});	
	}
	  
}

return SimpleDataAccessRequest;

});