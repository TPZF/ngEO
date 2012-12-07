  
define( ['jquery', 'backbone', 'configuration'], function($, Backbone, Configuration) {

/**
 * This module deals with the creation and submission of a generic data access request
 */
var DataAccessRequest = {			
	
	id : "", //data access request id returned by the server 
	 
	step : 0, //step is a counter of request steps. It is set to 0 when no request has been sent
			  // it is set to 1 when a request has been sent
	
	requestStage :  "",
	
	downloadLocation : {DownloadManagerId : "" , DownloadDirectory : ""}, 

	createBulkOrder : false,
	
	serverResponse : "A validation request has been send to the server...",
	
	firstRequest : {}, //keeps track of the first stage request in order to validate the second stage request 


	initialize : function(){
		
		this.step = 0;
		this.id = "";
		this.requestStage =  Configuration.data.dataAccessRequestStatuses.validationRequestStage;
		this.downloadLocation = {DownloadManagerId : "" , DownloadDirectory : ""};
		
		this.resetRequest();
	},

	/** Assign the download manager to the request */
	setDownloadManager : function(downloadManagerId){
		this.downloadLocation.DownloadManagerId = downloadManagerId;
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
		  data : JSON.stringify(self.getRequest()),
		  success: function(data) {
			  
			  console.log(" SUCCESS : Received Validation Response from the server :");
			  console.log (data);
			
			  //check the server response status with the configured server response statuses  
			  var statusesConfig = Configuration.data.dataAccessRequestStatuses;
			  var validStatusesConfig = statusesConfig.validStatuses;
			  
				  switch (data.DataAccessRequestStatus.status){
					  
				  	  case validStatusesConfig.validatedStatus.value:
						 
				  		  //initial stage
						  if (self.step == 0 && self.id == "" &&  self.requestStage == statusesConfig.validationRequestStage) {
							  self.step = 1;
							  self.id = data.DataAccessRequestStatus.ID;
							  //store the first request 
							  self.keepFirstRequestMembers();
							  self.requestStage = statusesConfig.confirmationRequestStage;
							  self.serverResponse = "<p>" + validStatusesConfig.validatedStatus.message + "<p>";
							  
							  self.validationProcessing(data.DataAccessRequestStatus);
							  
							  self.trigger('requestButtonTextChange');
							  
						  }else{
							  self.trigger('toggleRequestButton', ['disable']);
							 
						  }
						  break;
					 
					  case validStatusesConfig.bulkOrderStatus.value:
						   
						  if (self.step == 0 && self.requestStage == statusesConfig.validationRequestStage) {
							  self.step = 1;
							  self.id = data.DataAccessRequestStatus.ID;
							  //store the first request 
							  self.keepFirstRequestMembers();
							  //Bulk order is considered add the createBulkOrder
							  self.createBulkOrder = true;
							  self.requestStage = statusesConfig.confirmationRequestStage;
							  self.serverResponse = validStatusesConfig.bulkOrderStatus.message;
							  self.trigger('requestButtonTextChange');
						  }else{
							  self.trigger('toggleRequestButton', ['disable']);
						  }
						  
						  break;
						  
					  case validStatusesConfig.inProgressStatus.value:
						  
						  if (self.step == 1 && self.id == data.DataAccessRequestStatus.ID &&
								self.requestStage == statusesConfig.confirmationRequestStage) {//2 steps done
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
					   self.serverResponse =  self.serverResponse + "<p>" + data.DataAccessRequestStatus.message + "<p>";
				  }
				  
				  console.log("serverResponse");
				  console.log(self.serverResponse);
				   
		  	  },
		  
			  error: function(jqXHR, textStatus, errorThrown) {
				  //console.log("ERROR when posting DAR :" + textStatus + ' ' + errorThrown);
				  self.serverResponse = Configuration.data.dataAccessRequestStatuses.requestSubmissionError ;
				  self.trigger('toggleRequestButton', ['disable']);
			  }
		});	
	}
	  
}

//add events method to object
_.extend(DataAccessRequest, Backbone.Events);

return DataAccessRequest;

});