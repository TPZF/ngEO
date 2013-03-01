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
		  // Remove comments from JSON file
		  dataFilter: function(data) {
			var dataWoComments = removeComments(data);
			return dataWoComments;
		  },
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



