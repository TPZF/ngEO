/**
 * Data Access Request Statuses model It is a singleton which retrieves the all
 * DARs statuses : used for DAR monitoring
 */

define( ['jquery', 'backbone', 'configuration', 'dataAccess/model/downloadManagers'], 
		function($, Backbone, Configuration, DownloadManagers) {

var DataAccessRequestStatuses = Backbone.Model.extend({
	
	defaults:{
		dataAccessRequestStatuses : []
	},

	initialize : function(){
		// The base url to retrieve the DARs'statuses list
		this.url = Configuration.baseServerUrl + '/dataAccessRequestStatus';
	},

	
	/**
	 * reorder the statuses in a new object by download manager name 
	 */
	getOrderedStatuses : function (){
	
		var statuses = [];
		var foundDM = [];
		var dars = [];
		var self = this;
			
		 _.each(self.get("dataAccessRequestStatuses"), function(status) {
			 
			 if (foundDM.indexOf(status.DlManagerId) == -1){
				 foundDM.push(status.DlManagerId);
				 dars = [];
				 dars.push({"ID" : status.ID, "type": status.type, "status": status.status, "productStatuses" : status.productStatuses});
				 statuses.push({"downloadManagerName" : DownloadManagers.getDownloadManagerName(status.DlManagerId), "DlManagerId" : status.DlManagerId, "DARs" : dars }); 
			 }else{
				 _.each(statuses, function(newStatus) {
					 if (newStatus.DlManagerId == status.DlManagerId){
						 newStatus.DARs.push({"ID" : status.ID, "type": status.type, "status": status.status, "productStatuses" : status.productStatuses}); 
					 }
				 });
			 }
		 });
		
		 console.log(statuses);
		 return statuses;

	},
	
	
	/** products do have statuses 1, 2 or 3, whereas DARs can have also statuses 4 and 5 */
	getStatus : function (status){
		
		switch (status){ 
	   		 case 0 : 
	   			return {status : "Processing"};
	   			break; 
	   		 case 1 :
	   			return {status : "Paused"};
	   			break;
	   		case 2 :
	   			return {status : "Completed"};
	   			break; 
	   		case 3 : 
	   			return {status : "Cancelled"};
	   			break;
	   		case 4 :
	   			return {status : "Validated"};
	   			break; 
	   		case 3 : 
	   			return {status : "Bulk Order"};
	   			break;
	   		default :
	   			return {status : "Unknown Status"};
	   			break;
   	 }	
	}
});

return new DataAccessRequestStatuses();

});