/**
 *  Download option model
 */
var DownloadOptions = function(downloadOptions, options) {

	// TODO : refactor collection property, try to use Backbone.Collection object ?
	this.collection = downloadOptions || [];
	this.attributes = {}; // Simplified form of currently chosen options

	// Fill with valid options
	if (options && options.init) {
		for (var i = 0; i < this.collection.length; i++) {
			var option = this.collection[i];

			// NGEO-2165: Add None value according to minOccurs & maxOccurs parameters
			var hasNone = _.findWhere(option.value, { "humanReadable": "None" }); // Standing order passes here as well...
			if ( parseInt(option.minOccurs) == 0 && parseInt(option.maxOccurs) == 1 && !hasNone ) {
				option.value.unshift({
					"humanReadable": "None",
					"name": "@none",
					"sizeFactor": 1
				});
			}

			if (!option.cropProductSearchArea) {
				this.setValue(option.argumentName, this.getValidValue(this.collection[i]).name);
			} else {
				this.setValue(option.argumentName, Boolean(option.cropProductSearchArea));
			}
		}
	}
};

/**
 * Init download options from url
 */
DownloadOptions.prototype.initFromUrl = function(url) {
	this.collection = [];
	this.attributes = {};
	var doIndex = url.indexOf("ngEO_DO");
	if ( doIndex >= 0 ) {
		var don = url.substr(doIndex + 8);
		don = don.replace(/\{|\}/g,"");
		var commaNotBetweenParenthesisRe = new RegExp(/,(?!\(?[^()]*\))/);
		var parameters = don.split(commaNotBetweenParenthesisRe);

		for (var n = 0; n < parameters.length; n++) {
			var p = parameters[n].split(':');
			if (p.length != 2)
				throw "Invalid OpenSearch URL : download option parameter " + parameters[n] + "not correctly defined."

			this.setValue(p[0], (p[0] == "cropProduct" ? true : p[1]));

			// Update collection with current values
			var colDo = {
				argumentName: p[0],
				value: [ {
					"name" : p[1]
				}]
			};
			// No other way to know if the area is cropped or not
			if ( p[0].indexOf("crop") >= 0 ) {
				colDo.cropProductSearchArea = "true";
			}
			this.collection.push(colDo);
		}
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

	if (value == null) {
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
					// Check that set value respects it own preconditions
					var valueObject = _.findWhere(option.value, {
						name: selectedValue
					});
					// Set valid value only in case when selected value is not in conflict and preconditions aren't respected
					if (selectedValue != "@conflict" && !self.hasValidPreconditions(valueObject)) {
						self.attributes[option.argumentName] = self.getValidValue(option).name;
					}
				} else {
					// Option respects the preconditions, update model with a valid value
					self.attributes[option.argumentName] = self.getValidValue(option).name;
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
 *   Get first valid value for the given option respecting the preconditions
 *
 *   @see NGEOD-729: Download options with pre-conditions
 */
DownloadOptions.prototype.getValidValue = function(option) {

	var selectedValue = _.findWhere(option.value, {selected: "true"} );
	if ( selectedValue )
		return selectedValue;

	// If selected isn't defined, get the first valid one
	for (var i = 0; i < option.value.length; i++) {
		var value = option.value[i];
		if (this.hasValidPreconditions(value)) {
			return value;
		}
	}
	return null;
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