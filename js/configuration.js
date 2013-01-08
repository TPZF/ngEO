/**
  * Configuration module
  */
  
define( ['jquery', 'module'], function($, module) {

var configuration = {

	// The base url to retreive the configuration
	url : 'conf/configuration.json',
	
	// The base server url
	baseServerUrl : '/ngeo',
	
	// The  server host name
	serverHostName : 'http://localhost:3000',
	
	//the local configuration is got from requirejs.config module config
	//set in main.js
	localConfig : module.config(),
		
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
		_.each(this.localConfig.searchCriteriaToOpenSearchMapping, function(value, key, list){
			if (criterionId == key){
				mappedValue =  value;
			}
		});
		return mappedValue;
	}
};

return configuration;

});



