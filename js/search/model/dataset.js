define( ['jquery', 'backbone', 'configuration'], function($, Backbone, Configuration) {

var Dataset = Backbone.Model.extend({
//	datasetSearchInfo attribute do include {datasetId : "", description : "", keywords : [], downloadOptions : [], attributes : [] }
	defaults :{
		datasetSearchInfo : {},
		datasetId : "" //the datasetId shall correspond to datasetSearchInfo.datasetId received from the server
		
	},
	
	// Constructor : initialize the url from the configuration
	initialize : function () {
		// The base url to retreive the dataset Search Info
		this.url = Configuration.baseServerUrl + '/datasetSearchInfo/' + this.get('datasetId');
	},
});

return Dataset;

});