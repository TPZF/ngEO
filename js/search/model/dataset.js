define( ['jquery', 'backbone', 'configuration'], function($, Backbone, Configuration) {

var Dataset = Backbone.Model.extend({
	
	defaults :{
		datasetId : "",
		description : "",
		keywords : [],
		downloadOptions : [],
		attributes : [],
		startDate : "",
		endDate : ""		
		
	},
	
	// Constructor : initialize the url from the configuration
	initialize : function () {
		// The base url to retreive the dataset Search Info
		this.url = Configuration.baseServerUrl + '/datasetSearchInfo/' + this.get('datasetId');
	},
});

return Dataset;

});