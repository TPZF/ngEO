/**
  * Configuration module
  */
  
define( ['jquery', 'text!../conf/localConfiguration.json'], function($, localConfiguration) {

var configuration = {

	// The base url to retreive the configuration
	url : 'conf/configuration.json',
	
	// The base server url
	baseServerUrl : '/ngeo',
	
	// The  server host name
	serverHostName : window.location.protocol + '//' + window.location.host,
	
	//the local configuration is got from requirejs.config module config
	//set in main.js
	localConfig : JSON.parse(localConfiguration),
		
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
	}
};

return configuration;

});



