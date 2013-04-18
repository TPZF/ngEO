/**
  * Download managers model 
  * The DownloadManagers is a singleton to be used for DAR and Download managers 
  * assignment and monitoring 
  */

define( ['jquery', 'backbone', 'configuration'], function($, Backbone, Configuration) {

var DownloadManagers = Backbone.Model.extend({
	
	defaults:{
		downloadmanagers : [],
		commands : []
	},

	initialize : function(){
		// The base url to retreive the download managers list
		this.url = Configuration.baseServerUrl + '/downloadManagers';
	},
	
	/** get a download manager user friendly name given its id */
	getDownloadManagerName : function (id) {
	
		var name = id;
		
		_.each(this.get("downloadmanagers"), function(dm) {
			if (dm.downloadManagerId == id){
				name =  dm.downloadManagerFriendlyName;
			} 
		 });
		
		return name;
	},

	/** get a download manager status given its id */
	getDownloadManagerStatus : function (id) {
	
		var status = null;
		
		_.each(this.get("downloadmanagers"), function(dm) {
			if (dm.downloadManagerId == id){
				status =  dm.status;
			} 
		 });
		
		return status;
	},
	
	/** get a download manager given its id */
	getDownloadManagerIndex : function (id) {
	
		var index = null;
		
		_.each(this.get("downloadmanagers"), function(dm, i) {
			if (dm.downloadManagerId == id){
				index =  i;
			} 
		 });
		
		return index;
	},
	
	/** get the last command submitted to the server */
	getRecentCommand : function (id) {
		
		var index = this.getDownloadManagerIndex(id);
		if (index == null) {
			return undefined;
		}
		return this.get("commands")[index];
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
		  dataType: 'json'
			})
			.done(function(data) {
				  //self.get("downloadmanagers")[self.getDownloadManagerIndex(dmID)].status = data;
				  self.get("commands")[self.getDownloadManagerIndex(dmID)] = newStatus;
				 
				  //notify that the download manager change status request has been received by the server
				  if (newStatus == Configuration.localConfig.downloadManager.stopCommand.value){
					  self.trigger('DownloadManagerStatusChanged', ['SUCCESS', dmID, newStatus, Configuration.localConfig.downloadManager.stopCommand.message]);  
				  }else if (newStatus == Configuration.localConfig.downloadManager.stopImmediatelyCommand.value){
					  self.trigger('DownloadManagerStatusChanged', ['SUCCESS', dmID, newStatus, Configuration.localConfig.downloadManager.stopImmediatelyCommand.message]);
				  }else{
					  //Should not happen
					  self.trigger('DownloadManagerStatusChanged', ['ERROR', dmID, newStatus, "Un supported Command " + newStatus]);
				  }
			 })
			.fail(function(jqXHR, textStatus, errorThrown) {
				
				  console.log("ERROR when posting Change status Request :" + textStatus + ' ' + errorThrown);
				  //notify that the download manager status change has Failed
				  self.trigger('DownloadManagerStatusChanged', ['ERROR', dmID, newStatus,  "ERROR when posting Change status Request : " + textStatus + ' ' + errorThrown]);  
			 });
	}

});

return new DownloadManagers();

});