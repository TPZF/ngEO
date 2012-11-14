define( ['jquery', 'backbone', 'configuration'], function($, Backbone, Configuration) {

var Dataset = Backbone.Model.extend({
	
	// Constructor : initialize the url from the configuration
	initialize : function () {
		// The base url to retreive the dataset Search Info
		this.url = Configuration.baseServerUrl + '/datasetSearchInfo/' + this.get('id');
	},
});

return Dataset;

});