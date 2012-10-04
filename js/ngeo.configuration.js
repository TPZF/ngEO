/**
  * Configuration module
  */
  
define( ['jquery'], function($) {

var configuration = {};

// Public method to get configuration data asynchronously
/*configuration.get = function( callback ) {
	if ( configuration.data )
		callback(configuration.data);
	else
		configuration.on('loaded',callback);
};*/

configuration.load = function() {
	// Load configuration data from the server
	return $.ajax({
	  url: '/server/webClientConfigurationData',
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



