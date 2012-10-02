/**
  * Configuration module
  */
  
define( ['backbone'], function(Backbone) {

var configuration = {};
_.extend(configuration, Backbone.Events);

// Load configuration data from the server
$.ajax({
  url: '/server/webClientConfigurationData',
  success: function(data) {
	configuration.data = data;
	configuration.trigger('loaded',data);
  },
  error: function(jqXHR, textStatus, errorThrown) {
	alert(textStatus + ' ' + errorThrown);
  }
});

// Public method to get configuration data asynchronously
configuration.get = function( callback ) {
	if ( configuration.data )
		callback(configuration.data);
	else
		configuration.on('loaded',callback);
};

return configuration;

});



