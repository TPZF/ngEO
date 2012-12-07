/**
  * Download managers model 
  * The DownloadManagers is a singleton to be used for DAR and Download managers 
  * assignement and monitoring 
  */

define( ['jquery', 'backbone', 'configuration'], function($, Backbone, Configuration) {

var DownloadManagers = Backbone.Model.extend({
	
	defaults:{
		downloadmanagers : []
	},

	initialize : function(){
		// The base url to retreive the download managers list
		this.url = Configuration.baseServerUrl + '/downloadManagers';
	}
});

return new DownloadManagers();

});