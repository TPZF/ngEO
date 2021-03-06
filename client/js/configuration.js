/**
 * Configuration module
 */

/**
 * Helper function to remove comments from the JSON file
 */
var removeComments = function (string) {
	var starCommentRe = new RegExp("/\\\*(.|[\r\n])*?\\\*/", "g");
	var slashCommentRe = new RegExp("(^[\/]|[^:]\/)\/.*[\r|\n]", "g");
	string = string.replace(slashCommentRe, "");
	string = string.replace(starCommentRe, "");

	return string;
};

/**
 * Helper recursive function to get a parameter from the configuration data
 */
var _getValue = function (object, property, defaultValue) {
	if (object) {
		var value = null;
		var kv = property.split("="); // Split by "=" to handle arrays
		if (kv.length == 2) {
			// Array
			if (object[kv[0]] == kv[1]) {
				return object;
			}
		} else {
			// Object
			value = object[property];
		}

		if (typeof value != 'undefined') {
			return value;
		}
	}

	return defaultValue;
};

/**
 * Buil base server url with window.location.pathname
 */
var _builBaseServerUrl = function () {
	// from pathname like /proxy-path/sec/ get /proxy-path
	// and set baseServerUrl to /proxy-path/ngeo
	var pathItems = window.location.pathname.split('/');
	var baseProxyPath = '';
	if (pathItems.length > 0) {
		for (var i = 0; i < pathItems.length; i++) {
			if (pathItems[i] !== 'sec' && pathItems[i] !== '' && pathItems[i] !== 'index.html' && pathItems[i] !== 'help.html') {
				baseProxyPath = baseProxyPath + '/' + pathItems[i];
			}
		}
	}
	return baseProxyPath + '/ngeo';
};

var configuration = {

	// The base url to retreive the configurations
	url: '../conf',

	// The base server url
	baseServerUrl: _builBaseServerUrl(),

	// The server host name
	serverHostName: window.location.protocol + '//' + window.location.host,

	// Local configuration
	localConfig: null,

	// Configuration
	data: {},

	// Load configurations
	load: function () {
		var externalData = {};
		return $.when(
			// Local configuration
			$.ajax({
				//url: this.serverHostName + "/client-dev/conf/localConfiguration.json",
				url: this.url + "/localConfiguration.json",
				dataType: 'json',
				success: function (data) {
					configuration.localConfig = data;
				},
				error: function (jqXHR, textStatus, errorThrown) {
					console.log("Local configuration not found " + textStatus + ' ' + errorThrown);
				}
			}),
			// Server configuration
			$.when(
				$.ajax({
					url: this.url + "/configuration.json",
					dataType: 'text',
					success: function (data) {
						configuration.setConfigurationData(data);
					},
					error: function (jqXHR, textStatus, errorThrown) {
						console.log("Configuration not found " + textStatus + ' ' + errorThrown);
					}
				}),
				$.ajax({
					url: this.serverHostName + this.baseServerUrl + "/webClientConfigurationData",
					dataType: 'text',
					success: function (data) {
						externalData = data;
					},
					error: function (jqXHR, textStatus, errorThrown) {
						console.log("Configuration not found " + textStatus + ' ' + errorThrown);
					}
				})
			).then(function () {
				// Override our's server configuration with one coming from WEBS
				configuration.buildServerConfiguration(externalData);
			})
		);
	},

	setConfigurationData: function (configurationData) {
		// checkBehindSso could be retrieved before so this one, so we merge configuration.data
		// here as well
		// http://cdsv3.cs.telespazio.it/jira/browse/NGEOL-54
		$.extend(true, configuration.data, JSON.parse(removeComments(configurationData)));
	},

	/**
	 *	Build server configuration
	 */
	buildServerConfiguration: function (externalData) {
		// Remove comments 
		externalData = JSON.parse(removeComments(externalData));

		// Merge configurations with priority to configuration coming from server
		$.extend(true, configuration.data, externalData);
	},

	// Get a configuration parameter
	get: function (path, defaultValue) {
		return this.data ? this.getFromPath(this.data, path, defaultValue) : defaultValue;
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
	getMappedProperty: function (object, propertyId, defaultValue) {
		var _this = this;
		//var propertyPath = this.get("serverPropertyMapper."+propertyId);
		var propertyPath = this.getFromPath(this.localConfig, "serverPropertyMapper." + propertyId);
		if (propertyPath) {
			var value = defaultValue;
			propertyPath.forEach(function (_propertyPath) {
				var _value = _this.getFromPath(object, _propertyPath, defaultValue);
				if (_value !== defaultValue) {
					if (propertyId === 'browses') {
						if (!_.isArray(_value)) {
							// HACK: since WEBS sends browses as an Object when there is only one browse
							// we don't want to change all the logic in WEBC so convert it to array here for now
							// For more details see NGEO-2182 (in comments)
							value = [_value];
						} else {
							value = _value;
						}
					} else if (typeof _value !== 'object') {
						value = _value;
					}
				}
			});
			return value;
		} else {
			return defaultValue;
		}
	},

	/**
	 * Set mapped property
	 * @see getMappedProperty for more
	 * @param {object} object
	 * @param {string} propertyId
	 * @param {string}
	 */
	setMappedProperty: function (object, propertyId, value) {

		//var propertyPath = this.get("serverPropertyMapper."+propertyId);
		var propertyPath = this.getFromPath(this.localConfig, "serverPropertyMapper." + propertyId);
		if (propertyPath) {
			var parentPath = propertyPath.substr(propertyPath, propertyPath.lastIndexOf("."));
			var prop = propertyPath.substr(propertyPath.lastIndexOf(".") + 1);
			var parentValue = this.getFromPath(object, parentPath, null)
			if (parentValue) {
				parentValue[prop] = value;
			} else {
				console.warn(parentPath + " doesn't exist");
			}
		} else {
			console.warn(propertyId + " wasn't found in serverPropertyMapper");
		}
	},

	/**
	 * Get property from an array of paths
	 *
	 * @function getPropertyFromPaths
	 * @param object - Object from which you need to extract the property
	 * @param propertyPaths - Array of paths 
	 * @param defaultValue - The default value if none path was found
	 * @returns {string}
	 */
	getPropertyFromPaths: function (object, propertyPaths, defaultValue) {
		var _this = this;
		if (propertyPaths && _.isArray(propertyPaths) && propertyPaths.length > 0) {
			var value = defaultValue;
			propertyPaths.forEach(function (_propertyPath) {
				var _value = _this.getFromPath(object, _propertyPath, defaultValue);
				if (_value !== defaultValue && typeof _value !== 'object') {
					value = _value;
				}
			});
			return value;
		} else {
			return defaultValue;
		}
	},

	/**
	 * Helper imperative function to get a parameter from the configuration data
	 * (much faster than recursive one...)
	 * @param {object} object
	 * @param {string} path
	 * @param {string} defaultValue
	 * @returns {object | string} 
	 */
	getFromPath: function (object, path, defaultValue) {
		var names = path.split('.');
		var obj = object;
		for (var i = 0; obj && i < names.length - 1; i++) {
			var nameKV = names[i].split('[]');
			if (nameKV.length === 2) {
				var obj2 = null;
				for (var j = 0; j < obj[nameKV[0]].length; j++) {
					var obj2 = obj[nameKV[0]][j];
					for (var k = i + 1; obj2 && k < names.length - 1; k++) {
						obj2 = _getValue(obj2, names[k]);
					}
					if (obj2) { i = k; break; }
				}
				obj = obj2;
			} else {
				obj = _getValue(obj, names[i]);
			}
		}

		return _getValue(obj, names[names.length - 1], defaultValue);
	},

	/**
	 * Check if webc is behind SSO
	 * To check this, request on shopcarts REST service
	 * If 401 or error > no SSO enable
	 * 
	 * @returns {Promise}
	 */
	checkBehindSso: function () {
		return $.when(
			$.ajax({
				url: this.serverHostName + this.baseServerUrl + "/userId",
				dataType: 'text',
				success: function (data) {
					configuration.data.behindSSO = false;
					var repToJson = JSON.parse(data);
					if (repToJson.userInformation) {
						configuration.data.behindSSO = true;
						configuration.data.userIdentification = repToJson.userInformation.userId;
						console.info("behind SSO");
					} else {
						console.info("Not behind SSO");
					}
				},
				error: function (jqXHR, textStatus, errorThrown) {
					configuration.data.behindSSO = false;
					console.info("Not behind SSO");
				}
			})
		).then(
			function (success) {
				return $.when();
			},
			function (error) {
				return $.when();
			});
	}
};

module.exports = configuration;