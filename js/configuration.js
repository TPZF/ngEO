/**
  * Configuration module
  */
  
define( ['jquery'], function($) {

var configuration = {

	// The base url to retreive the configuration
	url : 'conf/configuration.json',
	
	// The base server url
	baseServerUrl : '/ngeo',
	
	// The  server host name
	serverHostName : 'http://localhost:3000',
		
	// Load configuration data from the server
	load: function() {
		return $.ajax({
		  url: this.url,
		  dataType: 'json',
		  success: function(data) {
			configuration.data = data;
		  },
		  error: function(jqXHR, textStatus, errorThrown) {
			console.log("Configuration not found " + textStatus + ' ' + errorThrown);
		  }
		});
	},
	
	/** get the open search mapping of a search criterion */
	getCriterionOpenSearchMapping : function(criterionId){
		var mappedValue = null;
		_.each(this.data.searchCriteriaToOpenSearchMapping, function(value, key, list){
			if (criterionId == key){
				mappedValue =  value;
			}
		});
		return mappedValue;
	}
};

return configuration;

});



