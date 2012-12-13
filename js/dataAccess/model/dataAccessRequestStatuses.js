/**
 * Data Access Request Statuses model It is a singleton which retrieves the all
 * DARs statuses : used for DAR monitoring
 */

define( ['jquery', 'backbone', 'configuration', 'dataAccess/model/downloadManagers'], 
		function($, Backbone, Configuration, DownloadManagers) {

var DataAccessRequestStatuses = Backbone.Model.extend({
	
	defaults:{
		dataAccessRequestStatuses : [],
		collapseDAR : Configuration.data.dataAccessRequestStatuses.collapseDAR,
		collapseProducts : Configuration.data.dataAccessRequestStatuses.collapseProducts,
	},

	initialize : function(){
		// The base url to retrieve the DARs'statuses list
		this.url = Configuration.baseServerUrl + '/dataAccessRequestStatus';
	},

	
	/**
	 * reorder all the DARs'statuses in a new object by download manager name 
	 */
	getOrderedStatuses : function (){
	
		var statuses = [];
		var foundDM = [];
		var dars = [];
		var self = this;
			
		 _.each(self.get("dataAccessRequestStatuses"), function(status) {
			 
			 if (foundDM.indexOf(status.dlManagerId) == -1){
				 foundDM.push(status.dlManagerId);
				 dars = [];
				 dars.push({"ID" : status.ID, "type": status.type, "status": status.status, "productStatuses" : status.productStatuses });
				 statuses.push({"downloadManagerName" : DownloadManagers.getDownloadManagerName(status.dlManagerId), "dlManagerId" : status.dlManagerId, "DARs" : dars }); 
			 }else{
				 _.each(statuses, function(newStatus) {
					 if (newStatus.dlManagerId == status.dlManagerId){
						 newStatus.DARs.push({"ID" : status.ID, "type": status.type, "status": status.status, "productStatuses" : status.productStatuses}); 
					 }
				 });
			 }
		 });
		
		 console.log(statuses);
		 return statuses;

	},
	
	/**
	 * reorder all the DARs'statuses in a new object by download manager name 
	 */
	getStatusesByDMId : function (dmId){
	
		var statuses = [];
		var foundDM = [];
		var dars = [];
		var self = this;
			
		 _.each(self.get("dataAccessRequestStatuses"), function(status) {
			 
			 if (foundDM.indexOf(status.dlManagerId) == -1){
				 foundDM.push(status.dlManagerId);
				 dars = [];
				 dars.push({"ID" : status.ID, "type": status.type, "status": status.status, "productStatuses" : status.productStatuses });
				 statuses.push({"downloadManagerName" : DownloadManagers.getDownloadManagerName(status.dlManagerId), "dlManagerId" : status.dlManagerId, "DARs" : dars }); 
			 }else{
				 _.each(statuses, function(newStatus) {
					 if (newStatus.dlManagerId == status.dlManagerId){
						 newStatus.DARs.push({"ID" : status.ID, "type": status.type, "status": status.status, "productStatuses" : status.productStatuses}); 
					 }
				 });
			 }
		 });
		
		 console.log(statuses);
		 return statuses;

	},
	
	/** products do have statuses 1, 2 or 3, however DARs can have also statuses 4 and 5
	 * this method returns the friendly readable status string from the configuration */
	getStatusReadableString : function (status){
		  
		  var validStatusesConfig = Configuration.data.dataAccessRequestStatuses.validStatuses;
		  
		  switch (status){
		  
		  	  case validStatusesConfig.validatedStatus.value:
		  		 return validStatusesConfig.validatedStatus;
				 break;
			 
			  case validStatusesConfig.bulkOrderStatus.value:
				  return validStatusesConfig.bulkOrderStatus;
				  break;
				  
			  case validStatusesConfig.inProgressStatus.value:
				  return validStatusesConfig.inProgressStatus;
				  break;
			
			  case validStatusesConfig.pausedStatus.value:
				  return validStatusesConfig.pausedStatus;
				  break;
				  
			  case validStatusesConfig.cancelledStatus.value:
				  return validStatusesConfig.cancelledStatus;
				  break;

		   		default :
		   		  return {status : "Unknown Status"};
		   		  break;
		  }	
	},
	
	/** Find the dataAccessRequestStatus json object given the DAR id (simple DAR or STO) */
	getDARStatusById : function(id){
		
		var foundStatus = null;
		
		 _.each(this.get("dataAccessRequestStatuses"), function(status) {
		 
			 if (status.ID == id){
				 foundStatus = status;
			 }
		 });
		
		 return foundStatus;
	},
	
	/** Submit the change status request to the server */
	//TODO THE REQUEST IS SUBMITTED BUT Waiting for Garin Response :
	//handle multiple requests synchronization!!
	requestChangeStatus : function(darID, newStatus){
		
		var darStatus = this.getDARStatusById(darID);
		
		if (darStatus == null) {//should not happen!
			return;
		}
		
		var request = { DataAccessRequestStatus : { 
			                ID : darID,
			                type : darStatus.type,
			                status : newStatus, 
			                dlManagerId : darStatus.dlManagerId}
					};
		console.log ("change Status request");
		console.log (request);
		var self = this;
		var changeStatusURL = self.url + '/' + darID;
		console.log ("changeStatusURL : ");
		console.log (changeStatusURL);
		
		return $.ajax({
		  url: changeStatusURL,
		  type : 'POST',
		  dataType: 'json',
		  contentType: 'application/json',
		  data : JSON.stringify(request),
		  success: function(data) {
			//TODO WAITING CLARIFICATION FROM GARIN	FOR SERVER RESPONSE FORMAT  
		  },
		  
		  error: function(jqXHR, textStatus, errorThrown) {
			  console.log("ERROR when posting Change status Request :" + textStatus + ' ' + errorThrown);
			  self.serverResponse = Configuration.data.dataAccessRequestStatuses.requestSubmissionError ;
			  self.trigger('toggleRequestButton', ['disable']);
		  }
		});	
	}

});

return new DataAccessRequestStatuses();

});