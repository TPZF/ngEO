/**
  * Configuration module
  */
  
define( ['jquery'], function($) {

var configuration = { 
	// The base url to retreive the configuration
	url : 'conf/configuration.json',
	
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



