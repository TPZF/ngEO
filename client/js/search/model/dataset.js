define( ['jquery', 'backbone'], function($, Backbone) {

var Dataset = Backbone.Model.extend({
	
	// The base url to retreive the datasets population matrix
	url : '../server/datasetSearchInfo/', //+ this.datasetId,
});

return Dataset;

});