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
	var slashCommentRe = new RegExp("(^[\/]|[^:]\/)\/.*[\r|\n]", "g");
	string = string.replace(slashCommentRe, "");
	string = string.replace(starCommentRe, "");

	return string;
};

/**
 * Helper recursive function to get a parameter from the configuration data
 */
// var _get = function(object,path,defaultValue) {
// 	var dotIndex = path.indexOf('.');
// 	if ( dotIndex >= 0 ) {
// 		var key = path.substr(0,dotIndex);
// 		if ( object[key] ) {
// 			return _get( object[key], path.substr(dotIndex+1), defaultValue );
// 		}
// 	} else {
// 		var value = object[path];
// 		if (typeof value != 'undefined') {
// 			return value;
// 		}
// 	}
	
// 	return defaultValue;
// };

var _getValue = function(object, property, defaultValue) {
	if ( object ) {
		var value = null;
		var kv = property.split("="); // Split by "=" to handle arrays
		if ( kv.length == 2 ) {
			// Array
			value = _.find(object, function(item) {
				return item[kv[0]] == kv[1];
			});
		} else {
			// Object
			value = object[property];
		}

		if ( typeof value != 'undefined' ) {
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
		return this.data ? this.getFromPath(this.data,path,defaultValue) : defaultValue;
	},

	/**
	 *	Get mapped property for the given object
	 *	Ex: with "propertyId": "path.in.the.object" defined in configuration.json
	 *	and object = { path: { in: { the: { object: "someValue" } } } }
	 *	By calling:
	 *	>Configuration.getMappedProperty(object, "propertyId");
	 *	You will get:
	 *	>"someValue"
	 *
	 *	@param object
	 *		Object from which you need to extract the property
	 *	@param propertyId
	 *		The property id which is defined in configuration.json in serverPropertyMapper object
	 *	@param defaultValue
	 *		The default value if the path wasn't found
	 */
	getMappedProperty: function(object, propertyId, defaultValue) {
		//var propertyPath = this.get("serverPropertyMapper."+propertyId);
		var propertyPath = this.getFromPath(this.localConfig, "serverPropertyMapper."+propertyId);
		if ( propertyPath )
			return this.getFromPath(object, propertyPath, defaultValue);
		else
			return defaultValue;
	},

	/**
	 *	Set mapped property
	 *	@see getMappedProperty for more
	 */
	setMappedProperty: function(object, propertyId, value) {
		//var propertyPath = this.get("serverPropertyMapper."+propertyId);
		var propertyPath = this.getFromPath(this.localConfig, "serverPropertyMapper."+propertyId);
		if ( propertyPath ) {
			var parentPath = propertyPath.substr(propertyPath, propertyPath.lastIndexOf("."));
			var prop = propertyPath.substr(propertyPath.lastIndexOf(".") + 1);
			var parentValue = this.getFromPath(object, parentPath, null)
			if ( parentValue ) {
				parentValue[prop] = value;
			} else {
				console.warn(parentPath + " doesn't exist");
			}
		} else {
			console.warn(propertyId + " wasn't found in serverPropertyMapper");
		}
	},

	/**
	 *	Helper imperative function to get a parameter from the configuration data
	 *	(much faster than recursive one...)
	 */
	getFromPath: function(object, path, defaultValue) {
		var names = path.split('.');
		var obj = object;
		for ( var i = 0; obj && i < names.length-1; i++ ) {
			obj = _getValue( obj, names[i] );
		}

		return _getValue( obj, names[names.length-1], defaultValue );
	}
};

return configuration;

});



