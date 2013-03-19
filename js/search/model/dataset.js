define( ['jquery', 'backbone', 'configuration'], function($, Backbone, Configuration) {

var Dataset = Backbone.Model.extend({

	//	Dataset attributes
	defaults :{
		description : "",
		keywords: null,
		downloadOptions: null,
		attributes: null,
		datasetId : "",
		startDate: null,
		endDate: null
	},
	
	/** Constructor : initialize the url from the configuration */
	initialize : function () {
		// The base url to retreive the dataset Search Info
		this.url = Configuration.baseServerUrl + '/datasetSearchInfo/' + this.get('datasetId');
	},
	
	/** Parse the response from server */
	parse: function(response,options) {
		var resp = {};
		if ( response.datasetSearchInfo  ) {
			resp.description = response.datasetSearchInfo.description;
			if ( _.isArray(response.datasetSearchInfo.downloadOptions) ) {
				// TODO : check the content?
				resp.downloadOptions = response.datasetSearchInfo.downloadOptions;
			}
			if ( _.isArray(response.datasetSearchInfo.attributes) ) {
				// TODO : check the content?
				resp.attributes = response.datasetSearchInfo.attributes;
			}
			if ( _.isArray(response.datasetSearchInfo.keywords) ) {
				// TODO : check the keywords?
				resp.keywords = response.datasetSearchInfo.keywords;
			}
			
			resp.startDate = response.datasetSearchInfo.startDate;
			resp.endDate = response.datasetSearchInfo.endDate;
		}
		return resp;
	},
	
	/** Get the default criterion value according to its type or number of allowed selected elements */
	getDefaultCriterionValue : function(criterionId){
		
		var attribute;
		var criterionValue;
		
		_.each(this.get('attributes'), function(criterion){
			if (criterion.id == criterionId) attribute = criterion;
		});


		if (attribute.rangeMinValue && attribute.rangeMaxValue){//the criterion is a range so set the range to be [min, max]
			criterionValue = "[" + attribute.rangeMinValue + ',' + attribute.rangeMaxValue + "]";
		}else{//all the criteria are by default searched with multiple values
			criterionValue = attribute.possibleValues[0].possibleValue;
			_.each(attribute.possibleValues, function(value, index){
				if (index != 0) criterionValue = criterionValue  +  ',' + value.possibleValue;
			});
		}
		
		return criterionValue;
	},
	
	/**
	 * Get the default value name of a download option which is the first possible value.
	 */
	getDefaultDownloadOptionValue : function(optionName){
		
		var value;
		
		_.each(this.get('downloadOptions'), function(option){
			if (option.argumentName == optionName){
				value = option.values[0].name;
			}
		});
		
		return value;
	}
	
});

return Dataset;

});