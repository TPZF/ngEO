define( ['jquery', 'backbone', 'configuration'], function($, Backbone, Configuration) {

var Dataset = Backbone.Model.extend({
//	datasetSearchInfo attribute does include {datasetId : "", description : "", keywords : [], downloadOptions : [], attributes : [] }
	defaults :{
		datasetSearchInfo : {},
		datasetId : "" //the datasetId shall correspond to datasetSearchInfo.datasetId received from the server	
	},
	
	// Constructor : initialize the url from the configuration
	initialize : function () {
		// The base url to retreive the dataset Search Info
		this.url = Configuration.baseServerUrl + '/datasetSearchInfo/' + this.get('datasetId');
	},
	
	/** Get the default criterion value according to its type or number of allowed selected elements */
	getDefaultCriterionValue : function(criterionId){
		
		var attribute;
		var criterionValue;
		
		_.each(this.attributes.datasetSearchInfo.attributes, function(criterion){
			if (criterion.id == criterionId) attribute = criterion;
		});

		if (attribute.value == "single"){ //if one value is allowed then set the first one
			criterionValue = attribute.possibleValues[0].possibleValue;
		
		}else if (attribute.value == "multiple"){//if multiple values are allowed then set all of them
			
			criterionValue = attribute.possibleValues[0].possibleValue;
			_.each(attribute.possibleValues, function(value, index){
				if (index != 0) criterionValue = criterionValue  +  ',' + value.possibleValue;
			});
		}else if (attribute.rangeMinValue && attribute.rangeMaxValue){//the criterion is a range so set the range to be [min, max]
			criterionValue = "[" + attribute.rangeMinValue + ',' + attribute.rangeMaxValue + "]";
		}else{
			criterionValue = ""; 
		}
		
		return criterionValue;
	},
	
	/**
	 * Get the default value name of a download option which is the first possible value.
	 */
	getDefaultDownloadOptionValue : function(optionName){
		
		var value;
		
		_.each(this.attributes.datasetSearchInfo.downloadOptions, function(option){
			if (option.argumentName == optionName){
				value = option.values[0].name;
			}
		});
		
		return value;
	}
	
});

return Dataset;

});