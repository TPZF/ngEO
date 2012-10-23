/**
  * Datasets population model
  */
  
define( ['jquery', 'backbone'], function($, Backbone) {

var DataSetPopulation = Backbone.Model.extend({
	
	// The base url to retreive the datasets population matrix
	url : '../server/datasetPopulationMatrix',

	// Load configuration data from the server
	load: function() {
		
		var self = this;
		
		return $.ajax({
		  url: self.url,
		  dataType: 'json',
		  success: function(data) {
			  console.log(" Success received dataset population matrix from the server...");
			  console.log(" Service url : " + self.url);
			  self.data = data;
			  console.log(" Received dataset population matrix from the server : ");
			  console.log (self.data);
			  self.trigger("loadedDatasets");
		  },
		  
		  error: function(jqXHR, textStatus, errorThrown) {
			console.log("no data to populate datasets list " + textStatus + ' ' + errorThrown);
		  }
		});
	}
});

return DataSetPopulation;

});