/**
  * Download managers model 
  * The DownloadManagers is a singleton to be used for DAR and Download managers 
  * assignment and monitoring 
  */

define( ['jquery', 'backbone', 'configuration'], function($, Backbone, Configuration) {

var DownloadManagers = Backbone.Model.extend({
	
	defaults:{
		downloadmanagers : []
	},

	initialize : function(){
		// The base url to retreive the download managers list
		this.url = Configuration.baseServerUrl + '/downloadManagers';
	},
	
	/** get a download manager user friendly name given its id */
	getDownloadManagerName : function (id) {
	
		var name = Configuration.data.downloadManager.undefinedDownloadManagerId;
		
		_.each(this.get("downloadmanagers"), function(dm) {
			if (dm.downloadmanagerid == id){
				name =  dm.downloadmanagerfriendlyname;
			} 
		 });
		
		return name;
	},

	/** get a download manager status given its id */
	getDownloadManagerStatus : function (id) {
	
		var status = null;
		
		_.each(this.get("downloadmanagers"), function(dm) {
			if (dm.downloadmanagerid == id){
				status =  dm.status;
			} 
		 });
		
		return status;
	},
	
	/** get a download manager given its id */
	getDownloadManagerIndex : function (id) {
	
		var index = null;
		
		_.each(this.get("downloadmanagers"), function(dm, i) {
			if (dm.downloadmanagerid == id){
				index =  i;
			} 
		 });
		
		return index;
	},
	
	/** Submit the DM change status request to the server.
	 * triggers a notification event with these arguments ['SUCCESS'|'ERROR', dmI', newStatus, 'message']
	 */
	requestChangeStatus : function(dmID, newStatus){
	
		console.log ("DM change Status request");
		var self = this;
		var dmChangeStatusURL = self.url + '/' + dmID + '/changeStatus?new_status=' + newStatus;
		console.log ("dmChangeStatusURL : ");
		console.log (dmChangeStatusURL);
		
		return $.ajax({
		  url: dmChangeStatusURL,
		  type : 'GET',
		  dataType: 'json',
		  success: function(data) {
			  //console.log(self.getDownloadManagerIndex(dmID));
			  self.get("downloadmanagers")[self.getDownloadManagerIndex(dmID)] = data;
			  //notify that the download manager status has been successfully changed
			  self.trigger('DownloadManagerStatusChanged', ['SUCCESS', dmID, newStatus, 'Status changed Successfully to : ' + newStatus]);  
		  },
		  
		  error: function(jqXHR, textStatus, errorThrown) {
		
			  console.log("ERROR when posting Change status Request :" + textStatus + ' ' + errorThrown);
			  //notify that the download manager status change has Failed
			  self.trigger('DownloadManagerStatusChanged', ['ERROR', dmID, newStatus,  "ERROR when posting Change status Request : " + textStatus + ' ' + errorThrown]);  
		  }
		});	
	}

});

return new DownloadManagers();

});