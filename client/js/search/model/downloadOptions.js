/**
 *  Download option model
 */
var DownloadOptions = function(downloadOptions, options) {
    
    // TODO : refactor collection property, try to use Backbone.Collection object ?
    this.collection = downloadOptions || [];
    this.attributes = {}; // Simplified form of currently chosen options

    // Fill with valid options
    if ( options && options.init ) {
        for ( var i=0; i<this.collection.length; i++ ) {
            var option = this.collection[i];
            if ( !option.cropProductSearchArea ) {
                this.setValue(option.argumentName, this.getValidValue(this.collection[i]).name);
            } else {
                this.setValue(option.argumentName, Boolean(option.cropProductSearchArea));
            }
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
    
    if ( value == null ) {
        delete this.attributes[attribute]
    } else {
        this.attributes[attribute] = value;
    }
    this.updatePreconditions();
}

/**
 *  Get attributes filtering the null and conflict values
 */
DownloadOptions.prototype.getAttributes = function() {
    return _.omit(this.attributes, function(attr){ return attr == null || attr == "@conflict" });
}

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
                    if ( selectedValue != "@conflict" && !self.hasValidPreconditions(valueObject) ) {
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
}

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
}

/**
 *   Get first valid value for the given option respecting the preconditions
 *
 *   @see NGEOD-729: Download options with pre-conditions
 */
DownloadOptions.prototype.getValidValue = function(option) {
    
    for (var i = 0; i < option.value.length; i++) {
        var value = option.value[i];
        if (this.hasValidPreconditions(value)) {
            return value;
        }
    }
    return null;
}

/**
 * In case there are selected download options : 
 *      add download options to the given url by appending "&ngEO_DO={param_1:value_1,...,param_n:value_n} 
 *      to the url and returns the modified url.
 * otherwise : do not append "&ngEO_DO={} to the url 
 */
DownloadOptions.prototype.getAsUrlParameters = function() {
    var res = "";
    var values = [];
    for ( var key in this.attributes ) {
        var value = this.attributes[key];

        if ( value ) {

            var isCropProduct = ( _.find(this.collection, function(downloadOption){ return downloadOption.argumentName == key && Boolean(downloadOption.cropProductSearchArea) }) );
            if ( isCropProduct && value == true ) {
                // TODO: resolve circular dependency
                var DataSetSearch = require('search/model/datasetSearch');
                values.push(key + ":" + DataSetSearch.searchArea.toWKT());
            } else {
                values.push(key + ":" + value);
            }
        }
    }

    if ( values.length ) {
        res = "ngEO_DO={" + values.join(",") + "}";
    }
    return res;
}

module.exports = DownloadOptions;