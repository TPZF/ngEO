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
	}

});

return new DownloadManagers();

});