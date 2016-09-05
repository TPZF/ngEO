/**
 *	Download option model contained by <DownloadOptions>
 *	
 *	@param parent
 *			Parent DownloadOptions model
 *	@param options
 *			Options initializing current download option
 *			Mandatory: argumentName, value
 *			Optionnal: caption, description, minOccurs, maxOccurs, preConditions, cropProductSearchArea
 */
var DownloadOption = function(parent, options) {
	this.parent = parent;

	this.argumentName = options.argumentName;
	this.caption = options.caption || "";
	this.description = options.description || "";
	this.minOccurs = options.hasOwnProperty("minOccurs") ? parseInt(options.minOccurs) : 1;
	this.maxOccurs = options.hasOwnProperty("maxOccurs") ? parseInt(options.maxOccurs) : 1;
	this.value = _.clone(options.value);
	this.preConditions = options.preConditions || null;

	// Special "crop" property
	this.cropProductSearchArea = options.hasOwnProperty("cropProductSearchArea") ? options.cropProductSearchArea : false;

	// Define the type of download option depending on minOccurs/maxOccurs
	this.type = (this.minOccurs == 1 && this.maxOccurs == 1) ? "select" :
				(this.minOccurs == 0 && this.maxOccurs == 1) ? "select-with-none" : "checkbox"

	// NGEO-2165: Add None value according to minOccurs & maxOccurs parameters
	if ( this.type == "select-with-none" ) {
		this.value.unshift({
			"humanReadable": "None",
			"name": "@none",
			"sizeFactor": 1
		});
	}
};

/**
 *   Get first valid value for the given option respecting the preconditions(coming from DownlaodOptions object)
 *
 *   @see NGEOD-729: Download options with pre-conditions
 */
DownloadOption.prototype.getValidValue = function() {
	var selectedValue = _.filter(this.value, {selected: "true"} );
	if ( this.type == "checkbox" ) {
		// Checkbox : return an array
		if ( selectedValue.length ) {
			// Multiple value has been selected take only it names
			return _.map(selectedValue, function(value) { return value.name });
		}
		// TODO: no precondition handler for checkboxes for now..
		
		// No value selected by default
		return [];
	} else {
		// Select : return a value
		if ( selectedValue.length == 1 && this.parent.hasValidPreconditions(selectedValue[0]) ) {
			return selectedValue[0].name;
		}
		
		// If selected isn't defined, get the first valid one
		for (var i = 0; i < this.value.length; i++) {
			var value = this.value[i];
			if (this.parent.hasValidPreconditions(value)) {
				return value.name;
			}
		}
	}

	return null;
}

module.exports = DownloadOption;