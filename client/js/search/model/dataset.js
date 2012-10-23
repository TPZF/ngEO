define( ['jquery', 'backbone'], function($, Backbone) {

var Dataset = Backbone.Model.extend({
	
	// The base url to retreive the datasets population matrix
	url : '../server/datasetSearchInfo/', //+ this.datasetId,

	// Load configuration data from the server
	load: function() {
		
		var self = this;
		
		return $.ajax({
 
		  url: self.url,
		  
		  success: function(data) {
			  console.log(" Received dataset info from the server : " + data);
			  self.data = data;
			  console.log (self.data);
		  },
		  
		  error: function(jqXHR, textStatus, errorThrown) {
			console.log("no data for dataset  "  + this.datasetId + textStatus + ' ' + errorThrown);
		  }
		});
	}
});

return Dataset;

});