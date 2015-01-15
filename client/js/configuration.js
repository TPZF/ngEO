/**
  * Configuration module
  */
  
define( ['jquery', 'text!../conf/localConfiguration.json'], function($, localConfiguration) {

/**
 * Helper function to remove comments from the JSON file
 */
var removeComments = function(string)
{
	var starCommentRe = new RegExp("/\\\*(.|[\r\n])*?\\\*/", "g");
	var slashCommentRe = new RegExp("[^:]//.*[\r\n]", "g");
	string = string.replace(slashCommentRe, "");
	string = string.replace(starCommentRe, "");

	return string;
}

/**
 * Helper function to get a parameter from the configuration data
 */
var _get = function(object,path,defaultValue) {
	var dotIndex = path.indexOf('.');
	if ( dotIndex >= 0 ) {
		var key = path.substr(0,dotIndex);
		if ( object[key] ) {
			return _get( object[key], path.substr(dotIndex+1), defaultValue );
		}
	} else {
		var value = object[path];
		if (typeof value != 'undefined') {
			return value;
		}
	}
	
	return defaultValue;
};

var configuration = {

	// The base url to retreive the configuration
	url : '../conf/configuration.json',
	
	// The base server url
	baseServerUrl : '/ngeo',
	
	// The  server host name
	serverHostName : window.location.protocol + '//' + window.location.host,
	
	//the local configuration is got from requirejs.config module config
	//set in main.js
	localConfig : JSON.parse(localConfiguration),
		
	// Load configuration data from the server
	load: function() {
	
		var externalData = {};
		
		return $.when(
			$.ajax({
				  url: this.url,
				  dataType: 'json',
				  // Remove comments from JSON file
				  dataFilter: function(data) {
					var dataWoComments = removeComments(data);
					return dataWoComments;
				  },
				  success: function(data) {
					configuration.data = data;
					$.extend(true,configuration.data,externalData);
				  },
				  error: function(jqXHR, textStatus, errorThrown) {
					console.log("Configuration not found " + textStatus + ' ' + errorThrown);
				  }
			}),
			$.ajax({
				  url: this.baseServerUrl + "/webClientConfigurationData",
				  dataType: 'json',
				  success: function(data) {
					externalData = data;
					$.extend(true,configuration.data,externalData);
				  },
				  error: function(jqXHR, textStatus, errorThrown) {
					console.log("Configuration not found " + textStatus + ' ' + errorThrown);
				  }
			})
		);
	},
	
	// Get a configuration parameter
	get: function(path,defaultValue) {
		return this.data ? _get(this.data,path,defaultValue) : defaultValue;
	}
};

return configuration;

});



