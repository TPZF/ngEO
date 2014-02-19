define( ['jquery', 'backbone', 'configuration'], function($, Backbone, Configuration) {

var _ReservedNames = [ 'start', 'stop', 'geom', 'bbox' ];

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
		this.listenTo(this,"error",this.onError);
	},

	/** Call when the model cannot be fetched from the server */
	onError : function(model,response) {
		if (response.status == 0) {
			location.reload();
		}
	},
	
	/** Parse the response from server */
	parse: function(response,options) {
		var resp = {};
		if ( response.datasetSearchInfo  ) {
			resp.description = response.datasetSearchInfo.description;
			if ( _.isArray(response.datasetSearchInfo.downloadOptions) ) {
				// Remove reserved names
				resp.downloadOptions = _.reject( response.datasetSearchInfo.downloadOptions, function(o) { return _.contains(_ReservedNames,o.argumentName); } );
			}
			if ( _.isArray(response.datasetSearchInfo.attributes) ) {
				// Remove reserved names
				resp.attributes = _.reject( response.datasetSearchInfo.attributes, function(a) { return _.contains(_ReservedNames,a.id); } );
			}
			if ( _.isArray(response.datasetSearchInfo.keywords) ) {
				// TODO : check the keywords?
				resp.keywords = response.datasetSearchInfo.keywords;
			}
			
			// Set the start/end date for the dataset, ensure there is always a valid time extent
			if ( response.datasetSearchInfo.endDate ) {
				resp.endDate = Date.fromISOString( response.datasetSearchInfo.endDate );
			} else {
				resp.endDate =  new Date();
			}
			if (response.datasetSearchInfo.startDate) {
				resp.startDate = Date.fromISOString( response.datasetSearchInfo.startDate );
			} else {
				resp.startDate = new Date( resp.endDate.getTime() );
				resp.startDate.setUTCFullYear( resp.endDate.getUTCFullYear() - 10 );
			}
		}
		return resp;
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
