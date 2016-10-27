var DownloadOption = require('search/model/downloadOption');

/**
 *  Download options model
 */
var DownloadOptions = function(downloadOptions, options) {

	// TODO : refactor collection property, try to use Backbone.Collection object ?
	this.collection = [];
	this.attributes = {}; // Simplified form of currently chosen options

	for (var i = 0; i < downloadOptions.length; i++) {
		var option = new DownloadOption(this, downloadOptions[i]);
		this.collection.push(option);

		if (options && options.init) {
			// Fill with valid values
			if (!option.cropProductSearchArea) {
				var selectedValue = option.getValidValue();
				this.setValue(option.argumentName, selectedValue);
			} else {
				this.setValue(option.argumentName, Boolean(option.cropProductSearchArea));
			}
		}
	}
};

/**
 * Static method allowing to extract download options from the given url
 */
DownloadOptions.extractParamsFromUrl = function(url) {

	var idx = url.indexOf("ngEO_DO={");
	if (idx >= 0) {
		// Case when ngEO_DO is present in url --> remove it
		url = url.substring(idx + 9, url.length - 1);
	}

	var res = {};
	// Extract keys/values from parameters
	var keys = url.match(/([\b\s\w]+):/gm);
	var parameters = [];
	for ( var j=0; j<keys.length-1; j++ ) {
		var current = url.substring(url.indexOf(keys[j]), url.indexOf(keys[j+1]) - 1);
		parameters.push(current);
	}
	parameters.push(url.substring(url.indexOf(keys[keys.length-1])))

	for ( var n = 0; n < parameters.length; n++ ) {
		var p = parameters[n].split(':');
		if (p.length != 2) 
			throw "Invalid OpenSearch URL : download option parameter " + parameters[n] + "not correctly defined."

		if ( p[1].indexOf("[") >= 0 ) {
			// Surround every item in array with '"' to be able to parse as JSON
			// WEBS spec rocks !
			p[1] = JSON.parse(p[1].replace(/([^,\[\]]*)/g, function(r, $1) { if (r){
				return '"'+$1+'"';
			} else {
				return "";
			} } ));
		}
		res[p[0]] = (p[0] == "cropProduct") ? true : p[1];
	}
	return res;
};


/**
 *	Populate download options object from the given url parameters
 *	@param urlParams Url parameters for ngEO_DO or the entire url containing ngEO_DO
 *		ex: {processing:RAW,Otherwise option:[val2,val3]}
 *		ex: http://ngeo?advancedProperties={}&ngEO_DO={key1:val1,key2:[val1,val2]}
 */
DownloadOptions.prototype.populateFromUrl = function(url) {

	// // Doesn't work !
	// // Use this regex to avoid splitting crop product
	// // which has multiple "," in it OR multiple values between  []
	// var commaNotBetweenParenthesisRe = new RegExp(/,(?!\(?[^\(\)]*\))(?!\[?[^,]*\])/g);
	// parameters = url.split(commaNotBetweenParenthesisRe);

	this.attributes = DownloadOptions.extractParamsFromUrl(url);
	// HACK: Set crop to false if doesn't exist in URL
	var cropDo = _.findWhere(this.collection, {cropProductSearchArea: "true"});
	if ( cropDo ) {
		this.attributes[cropDo.argumentName] = _.find(_.keys(this.attributes), function(p) { return p.indexOf("crop") >= 0 }) ? "true" : false;
	}
};

/**
 *  Update download options with the given options
 *	TODO: improve it
 */
DownloadOptions.prototype.updateFrom = function(downloadOptions) {
	this.collection = _.clone(downloadOptions.collection);
	this.attributes = _.clone(downloadOptions.attributes);
};

/**
 *  Set the attribute to the given value
 *  When null, delete the attribute from attributes
 */
DownloadOptions.prototype.setValue = function(attribute, value) {

	if (!value) {
		delete this.attributes[attribute]
	} else {
		this.attributes[attribute] = value;
	}
	this.updatePreconditions();
};

/**
 *  Get attributes filtering the null and conflict values
 */
DownloadOptions.prototype.getAttributes = function() {
	return _.omit(this.attributes, function(attr) {
		return attr == null || attr == "@conflict" || attr == "@none";
	});
};

/**
 *  Update model depending on its preconditions
 */
DownloadOptions.prototype.updatePreconditions = function() {
	var self = this;
	// Update model according to preconditions of each download option
	_.each(this.collection, function(option) {
		if (self.hasValidPreconditions(option)) {
			//var attributeToUpdate = _.findWhere( this.downloadOptions, { "argumentName": option.argumentName } );
			// cropProductSearchArea doesn't have any value
			if (!option.cropProductSearchArea) {
				var selectedValue = self.attributes[option.argumentName];
				if (selectedValue) {
					// Option has already the value set

					// Set valid value only in case when selected value is not in conflict and preconditions aren't respected
					// @see IICD-WC-WS 
					if (option.type == "checkbox") {
						// Checkboxes
						// Remove every invalid value
						var validOptions = _.filter(option.value, function(v) { return (selectedValue.indexOf(v.name) != -1 && self.hasValidPreconditions(v)) })
						var newAttributes = validOptions.map(function(value) { return value.name });
						// TODO: refactor all this stuff from scratch...
						if ( newAttributes.length == 0 ) {
							delete self.attributes[option.argumentName];
						} else {
							self.attributes[option.argumentName] = newAttributes;
						}

					} else {
						// Check that set value respects it own preconditions
						var valueObject = _.findWhere(option.value, {
							name: selectedValue
						});
						// Get the new random valid value
						if (selectedValue != "@conflict" && valueObject && !self.hasValidPreconditions(valueObject)) {
							self.attributes[option.argumentName] = option.getValidValue();
						}
					}

				} else {
					if ( option.type == "checkbox" ) {
						// Nothing to do
					} else {
						// Option respects the preconditions, update model with a valid value
						self.attributes[option.argumentName] = option.getValidValue();
					}
				}
			}
		} else {
			// Precondition isn't respected anymore, so we unset it from model
			delete self.attributes[option.argumentName];
		}
	});
};

/**
 *  Check if option/value has valid preconditions
 *  i.e. exist on object with the same value
 *
 *  @param param
 *      Could be value in "value" array, or option in downloadOptions
 *
 *  @see NGEOD-729: Download options with pre-conditions
 */
DownloadOptions.prototype.hasValidPreconditions = function(param) {
	if (!param.preConditions)
		return true;

	var self = this;
	var res = false;
	_.each(param.preConditions, function(precondition) {
		//console.log(model.get(precondition.parentDownloadOption) + " = " + precondition.parentDownloadValue);
		//var preconditionValue = _.findWhere(self.downloadOptions, {argumentName: precondition.parentDownloadOption})._userSelectedValue;
		res |= (self.attributes[precondition.parentDownloadOption] == precondition.parentDownloadValue);
	});
	return res;
};

/**
 *	Get parameters as a string {do1:value1,do2:value2,cropDo:searchArea-in-WKT}
 */
DownloadOptions.prototype.getParameters = function() {

	// CropProduct must be a WKT and not a boolean
	// NB: Use cropProductSearchArea to spot the argumentName of cropProduct
	var cropProductKey = _.find(this.collection, function(downloadOption) {
		return Boolean(downloadOption.cropProductSearchArea)
	});
	// TODO: resolve circular dependency
	var DataSetSearch = require('search/model/datasetSearch');
	var buildCropProduct = function(key, value) {
		if (cropProductKey && key == cropProductKey.argumentName && value === true) {
			value = DataSetSearch.searchArea.toWKT();
		}
		return value;
	};
	return JSON.stringify(this.getAttributes(), buildCropProduct).replace(/\"/g, ""); // No "" by spec;
};

/**
 * In case there are selected download options : 
 *      add download options to the given url by appending "&ngEO_DO={param_1:value_1,...,param_n:value_n} 
 *      to the url and returns the modified url.
 * otherwise : do not append "&ngEO_DO={} to the url 
 */
DownloadOptions.prototype.getAsUrlParameters = function() {
	var res = "";
	var values = this.getParameters();
	if (values != "{}") {
		res = "ngEO_DO="+values;
	}
	return res;
}

module.exports = DownloadOptions;