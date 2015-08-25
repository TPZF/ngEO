/**
 *	Use local configuration for the same purpose as on client side
 *	i.e. to map properties from file
 */
var data = require('./localConfiguration.json');
var find = require('lodash.find');

var _getValue = function(object, property, defaultValue) {
	if ( object ) {
		var value = null;
		var kv = property.split("="); // Split by "=" to handle arrays
		if ( kv.length == 2 ) {
			// Array
			value = find(object, function(item) {
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
}

/**
 *	Helper imperative function to get a parameter from the configuration data
 *	(much faster than recursive one...)
 */
var _get = function(object, path, defaultValue) {
	var names = path.split('.');
	var obj = object;
	for ( var i = 0; obj && i < names.length-1; i++ ) {
		obj = _getValue( obj, names[i] );
	}

	return _getValue( obj, names[names.length-1], defaultValue );
};

/**
 *	Helper function to set a paramater on object
 *	Even if one parameter of the path doesn't exists, all the tree of objects
 *	will be created
 */
var _set = function(object, path, value) {
	var kvs = path.split(".");

	var temp = object;
	for ( var i = 0; i<kvs.length - 1; i++ ) {
		var kv = kvs[i];
		var fieldValue = _get(temp, kv, null);
		if ( !fieldValue ) {
			// Field doesn't exists -> create one
			var nObject = {};

			// Check if next kv is an array element
			if ( kvs[i+1].indexOf("=") > 0 ) {
				nObject = [];
			}

			if ( kv.indexOf("=") > 0 ) {
				// Array containing the object
				nObject[kv.split("=")[0]] = kv.split("=")[1];
				temp.push(nObject);
			} else {
				// Object
				temp[kv] = nObject;
			}
			temp = nObject;
		} else {
			// Field already exists pass to the new one
			temp = fieldValue;
		}
	}

	// Finally set the value
	temp[kvs[ kvs.length-1 ]] = value;
}

module.exports = {

	// Get a configuration parameter
	get: function(path,defaultValue) {
		return data ? _get(data,path,defaultValue) : defaultValue;
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
		var propertyPath = this.get("serverPropertyMapper."+propertyId);
		if ( propertyPath )
			return _get(object, propertyPath, defaultValue);
		else
			return defaultValue;
	},

	/**
	 *	Set mapped property
	 *	@see getMappedProperty for more details
	 */
	setMappedProperty: function(object, propertyId, value) {
		var propertyPath = this.get("serverPropertyMapper."+propertyId);
		if ( propertyPath ) {
			var parentPath = propertyPath.substr(propertyPath, propertyPath.lastIndexOf("."));
			var prop = propertyPath.substr(propertyPath.lastIndexOf(".") + 1);
			var parentValue = _get(object, parentPath, null);
			if ( parentValue ) {
				parentValue[prop] = value;
			} else {
				//console.warn(parentPath + " doesn't exist");
				_set(object, propertyPath, value);
			}
		} else {
			//console.warn(propertyId + " wasn't found in serverPropertyMapper");
		}
	},

	/**
	* Transform the old featurecollection json data format to the new one according to the Work Order 
	*/
	toNewJsonFormat: function(featureCollection){


		for (var i = 0 ; i < featureCollection.features.length ; i++){
			var feature = featureCollection.features[i];

			this.setMappedProperty(feature, "start", feature.properties.EarthObservation.gml_beginPosition);
			this.setMappedProperty(feature, "stop", feature.properties.EarthObservation.gml_endPosition);
			this.setMappedProperty(feature, "browseInformation", feature.properties.EarthObservation.EarthObservationResult.eop_BrowseInformation);
			this.setMappedProperty(feature, "mission", feature.properties.EarthObservation.EarthObservationEquipment.eop_platformShortName);
			this.setMappedProperty(feature, "sensor", feature.properties.EarthObservation.EarthObservationEquipment.eop_instrumentShortName);
			this.setMappedProperty(feature, "swath", feature.properties.EarthObservation.EarthObservationEquipment.eop_swathIdentifier);
			this.setMappedProperty(feature, "orbit", feature.properties.EarthObservation.EarthObservationEquipment.Acquisition.eop_orbitNumber);
			this.setMappedProperty(feature, "pass", feature.properties.EarthObservation.EarthObservationEquipment.Acquisition.eop_orbitDirection);
			this.setMappedProperty(feature, "status", feature.properties.EarthObservation.EarthObservationMetaData.eop_status);
			this.setMappedProperty(feature, "productType", feature.properties.EarthObservation.EarthObservationMetaData.eop_productType);
			this.setMappedProperty(feature, "imageQualityReportURL", feature.properties.EarthObservation.EarthObservationMetaData.eop_imageQualityReportURL);
		}

		return featureCollection;
	}
};



