define( ['jquery', 'backbone', 'configuration'], function($, Backbone, Configuration) {

/**
  *	Hosted process list
  */
var HostedProcessList = Backbone.Model.extend({
	
	defaults:{
		hostedProcesses : []
	},
	
	// Constructor : initialize the url from the configuration
	initialize : function () {
		// The base url to retreive the hosted process list
		this.url = Configuration.baseServerUrl + '/hostedProcesses';
	}
});

return HostedProcessList;

});