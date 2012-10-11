/**
  * Configuration module
  */
  
define( ['jquery'], function($) {

var configuration = {};

configuration.load = function() {
	// Load configuration data from the server
	return $.ajax({
	  url: 'conf/configuration.json',
	  dataType: 'json',
	  success: function(data) {
		configuration.data = data;
		//configuration.trigger('loaded',data);
	  },
	  error: function(jqXHR, textStatus, errorThrown) {
		alert(textStatus + ' ' + errorThrown);
	  }
	});
};

return configuration;

});



