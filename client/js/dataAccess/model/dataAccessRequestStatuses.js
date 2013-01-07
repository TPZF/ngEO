/**
 * Data Access Request Statuses model It is a singleton which :
 * 1-retrieves all DARs statuses.
 * 2-orders the DARs statuses by order download manager to insure filtering DARs by DM.
 * Theses functionalities are used for DAR monitoring.
 */

define( ['jquery', 'backbone', 'configuration', 'dataAccess/model/downloadManagers'], 
		function($, Backbone, Configuration, DownloadManagers) {

var DataAccessRequestStatuses = Backbone.Model.extend({
	
	defaults:{
		dataAccessRequestStatuses : [],
		collapseDAR : false,
		collapseProducts : false
	},

	initialize : function(){
		// The base url to retrieve the DARs'statuses list or submit DAR status changes
		this.url = Configuration.baseServerUrl + '/dataAccessRequestStatus';
	},
	
	/**
	 * reorder all the DARs'statuses in an array of objects each object has the following properties:
	 * "downloadManagerName" : download manager name
	 * "dlManagerId" : download manager id
	 * "DARs" : array of assignment data access request statuses to the DM.
	 * each DAR is a json as returned by the server.
	 * {"ID" : ID, "type":type, "status": status, "productStatuses" : product statuses}
	 * for Standing orders the productStatuses has the value undefined.
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
		
		 return statuses;

	},
	
	/** get the json object containing all the DARs relative to one download manager 
	 * the result is returned as an array to still be compliant with the getOrderedStatuses
	 * result which is an array */
	getFilterOrderedStatuses : function (dmID){
		
		var foundStatus = null;

		_.each(this.getOrderedStatuses(), function(orderedStatus) {
			 
			 if (orderedStatus.dlManagerId == dmID){

				 foundStatus = orderedStatus
			 }
		 });

		 var resultArray = [];
	
		 resultArray.push(foundStatus);
		 
		 return resultArray;
	},
	
	/** get a DAR status index in the model array given its id 
	 * used by requestChangeStatus to update the DAR status after a successful DAR
	 * status change request submission*/
	getDARStatusIndex : function (id) {
	
		var index = null;
		
		_.each(this.get("dataAccessRequestStatuses"), function(dar, i) {
			if (dar.ID == id){
				index =  i;
			} 
		 });
		
		return index;
	},
	
	/** 
	 * products do have statuses 0, 1, 2 or 3, however DARs can have also statuses 4 and 5
	 * this method returns the friendly readable status string from the configuration 
	 */
	getStatusReadableString : function (status){
		  
		  var validStatusesConfig = Configuration.data.dataAccessRequestStatuses.validStatuses;
		  
		  switch (status){
		  
		  	  case validStatusesConfig.validatedStatus.value:
		  		 return validStatusesConfig.validatedStatus.status;
				 break;
			 
			  case validStatusesConfig.bulkOrderStatus.value:
				  return validStatusesConfig.bulkOrderStatus.status;
				  break;
				  
			  case validStatusesConfig.inProgressStatus.value:
				  return validStatusesConfig.inProgressStatus.status;;
				  break;
			
			  case validStatusesConfig.pausedStatus.value:
				  return validStatusesConfig.pausedStatus.status;;
				  break;
				  
			  case validStatusesConfig.completedStatus.value:
				  return validStatusesConfig.completedStatus.status;;
				  break;	 
				  
			  case validStatusesConfig.cancelledStatus.value:
				  return validStatusesConfig.cancelledStatus.status;
				  break;

		   		default :
		   		  return "Unknown Status";
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
		//console.log ("change Status request");
		//console.log (request);
		var self = this;
		var changeStatusURL = self.url + '/' + darID;
		//console.log ("changeStatusURL : ");
		//console.log (changeStatusURL);
		var message = "";
		
		return $.ajax({
		  url: changeStatusURL,
		  type : 'POST',
		  dataType: 'json',
		  contentType: 'application/json',
		  data : JSON.stringify(request),
		  success: function(data) {
			 
			  //If the server sends back a message get it in order to be displayed
			  if (data.DataAccessRequestStatus.message){
				  message = data.DataAccessRequestStatus.message;
			  }
			  
			  if (data.DataAccessRequestStatus.status == newStatus){
				  self.get("dataAccessRequestStatuses")[self.getDARStatusIndex(darID)].status = newStatus;
				  //notify that the DAR status has been successfully changed
				  self.trigger('DARStatusChanged', ['SUCCESS', darID, newStatus, 'SUCCESS Status changed to : ' + self.getStatusReadableString(newStatus) + ' ' + message]);  
 
			  }else{
				  self.trigger('DARStatusChanged', ['ERROR', darID, newStatus, 'ERROR : ' + message]);  
				  
			  }
		  },
		  
		  error: function(jqXHR, textStatus, errorThrown) {
			  console.log("ERROR when posting Change status Request :" + textStatus + ' ' + errorThrown);
			  //notify that the download manager status change has Failed
			  self.trigger('DARStatusChanged', ['ERROR', darID, newStatus,  "ERROR when posting Change status Request : " + textStatus + ' ' + errorThrown]);  

		  }
		});	
	}

});

return new DataAccessRequestStatuses();

});