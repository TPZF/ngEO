/**
 * results table model as received from the server
 */
define( ['jquery', 'backbone'], function($, Backbone) {

var SearchResults = Backbone.Model.extend({
	
	defaults : {
		// Geojson feature's table as returned by the server
		features: [],
	},
	
	// Construtor : intialize the selection as an empty array
	initialize: function() {
		this.selection = [];
	},
	
	// Set the selection, replace the previous one
	setSelection: function(features) {
		this.trigger( "unselectFeatures", _.difference(this.selection, features) );
		this.trigger( "selectFeatures", _.difference(features, this.selection) );
		this.selection = features;
	},
	
	// Select a feature
	select: function(feature) {
		this.selection.push(feature);
		this.trigger( "selectFeatures", [feature] );
	},
	
	// Unselect a feature
	unselect: function(feature) {
		this.selection.splice( this.selection.indexOf(feature), 1 );
		this.trigger( "unselectFeatures", [feature] );
	},

	/** Get the list of products URLs from a list of features
	 * if the file name is empty the product is rejected
	 */
	getProductUrls: function(features) {
		
		var productUrls = [];
		var eor;
		
		for ( var i = 0; i < features.length; i++ ) {
			eor = features[i].properties.EarthObservation.EarthObservationResult;
			if ( eor && eor.eop_ProductInformation && eor.eop_ProductInformation.eop_filename!= "" ) {
				productUrls.push(eor.eop_ProductInformation.eop_filename);
			} 
		}
		return productUrls;
	},
	
	/** After a download options selection change update the product urls with the new selected 
	 * downloadOptions is a json object containing the selected download options.
	 */
	updateProductUrls: function(selectedDownloadOptions) {
		var eor;
		
		_.each(this.selection, function(feature){
			eor = feature.properties.EarthObservation.EarthObservationResult;
			if ( eor && eor.eop_ProductInformation && eor.eop_ProductInformation.eop_filename!= "" ) {
				
				_.each(selectedDownloadOptions, function(optionValue, optionKey, list){
					//the download option is not set in the url
					if (eor.eop_ProductInformation.eop_filename.indexOf(optionKey) == -1){
						if (eor.eop_ProductInformation.eop_filename.indexOf("?") == -1){
							eor.eop_ProductInformation.eop_filename = eor.eop_ProductInformation.eop_filename + "?" + optionKey + "=" + optionValue;
						} else{
							eor.eop_ProductInformation.eop_filename = eor.eop_ProductInformation.eop_filename + "&" + optionKey + "=" + optionValue;
						}
					}else{
						//TODO CONTINUE TO HANDLE THE OTHER CASES : replace the existent value
					}
				});
					
			} 
		});
	},
	
	/**  Check whether the given feature has a url supported by a browser */
	isBrowserSupportedUrl : function(feature) {

		var eor = feature.properties.EarthObservation.EarthObservationResult;
		if ( eor && eor.eop_ProductInformation && eor.eop_ProductInformation.eop_filename!= "" &&
				(eor.eop_ProductInformation.eop_filename.indexOf("http") != -1 ||
						eor.eop_ProductInformation.eop_filename.indexOf("https") != -1)) {
			return true;
		}	
		return false;
	},
	
});

return new SearchResults();

});