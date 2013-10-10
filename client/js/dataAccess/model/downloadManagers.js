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
	
	getDownloadManagerById: function(id) {
		return _.findWhere
	},
	
	/** get a download manager user friendly name given its id */
	getDownloadManagerName : function (id) {
		var dm = _.findWhere( this.get("downloadmanagers"), {downloadManagerId: id} );
		return dm ? dm.downloadManagerFriendlyName : id;
	},

	/** get a download manager status given its id */
	getDownloadManagerStatus : function (id) {
		var dm = _.findWhere( this.get("downloadmanagers"), {downloadManagerId: id} );
		return dm ? dm.status : null;
	},
	
	/** 
		Submit the DM change status request to the server.
	 */
	requestChangeStatus : function(dmID, newStatus){
	
		var dm = _.findWhere( this.get("downloadmanagers"), {downloadManagerId: dmID} );
		if (!dm)
			return;
		
		var self = this;
		var dmChangeStatusURL = self.url + '/' + dmID + '/changeStatus?new_status=' + newStatus;
		var prevStatus = dm.status;
		dm.status = "STOPPING";
	
		return $.ajax({
		  url: dmChangeStatusURL,
		  type : 'GET',
		  dataType: 'json'
			})
			.done(function(data) {
				dm.status = "STOPPED";
				self.trigger("status:change");
			 })
			.fail(function(jqXHR, textStatus, errorThrown) {				
				Logger.error("Cannot change downloand manager status request :" + textStatus + ' ' + errorThrown);
				// restore previous status
				dm.status = prevStatus;
			 });
	}

});

return new DownloadManagers();

});