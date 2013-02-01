/**
 * results table model as received from the server
 */
define( ['jquery', 'backbone', 'configuration'], function($, Backbone, Configuration) {

// Store the count per page
var _countPerPage = Configuration.data.searchResults.countPerPage || 10;

var SearchResults = {
	
	// Array of features
	features: [],
		
	// The current selection
	selection: [],
	
	// The URL for search results
	url: "",
	
	// fetch the results using the given start index
	fetch: function(startIndex,currentUrl) {
		var self = this;
		var searchUrl = this.url + "&startIndex=" + startIndex;
		
		$.ajax({
			url: searchUrl,
			dataType: 'json'
				
		}).done(function(data) {
			// Update data if a new launch has not been done, the launch is new if the url has changed
			// TODO : improve the mechanism?
			if ( self.url == currentUrl ) {
			
				// Add the features to the results
				for ( var i = 0; i < data.features.length; i++ ) {
					self.features.push( data.features[i] );
				}
				self.trigger('add:features',data.features);
				
				// Relaunch a search on next page if there is still some results
				if ( data.features.length == _countPerPage ) {
					self.fetch(startIndex + _countPerPage, currentUrl);
				}
			}		
		}).fail(function(jqXHR, textStatus, errorThrown) {		
			  console.log("ERROR when retrieving the products :" + textStatus + ' ' + errorThrown);
			  //notify that the product search has Failed
			  self.trigger('error:features', searchUrl);  
		});
	},
	
	// launch a search
	launch: function(url) {
		this.url = url + "&count=" + _countPerPage;
		this.features.length = 0;
		this.trigger('reset:features');
		this.fetch(1,this.url);
	},
	
	// Set the selection, replace the previous one
	setSelection: function(features) {
		var unselected = _.difference(this.selection, features);
		var selected = _.difference(features, this.selection);
		this.selection = features;
		this.trigger( "unselectFeatures", unselected );
		this.trigger( "selectFeatures", selected );
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
	
	/** After a download options selection change on results table, update the selected(checked) product urls 
	 * with the new selected downloadOptions. The selectedDownloadOptions argument is a json object 
	 * containing the selected download options.
	 */
	updateProductUrls: function(selectedDownloadOptions) {
		var eor;
		
		_.each(this.selection, function(feature){
			eor = feature.properties.EarthObservation.EarthObservationResult;
			if ( eor && eor.eop_ProductInformation && eor.eop_ProductInformation.eop_filename!= "" ) {
				var url;
				_.each(selectedDownloadOptions, function(optionValue, optionKey, list){
					//the download option is not set in the url
					if (eor.eop_ProductInformation.eop_filename.indexOf(optionKey) == -1){
						//no parameters set in the url
						if (eor.eop_ProductInformation.eop_filename.indexOf("?") == -1){
							url = eor.eop_ProductInformation.eop_filename + "?" + optionKey + "=" + optionValue;
						} else {//there are parameters in the url
							url = eor.eop_ProductInformation.eop_filename + "&" + optionKey + "=" + optionValue;
						}
					}else{
						//the option has already been set : replace the existent value
						var valueStartIndex = eor.eop_ProductInformation.eop_filename.indexOf(optionKey) + optionKey.length + 1; //+1 to cover = after the param
						var firstPart = eor.eop_ProductInformation.eop_filename.substring(0, valueStartIndex);
						//console.log("first part :: " + firstPart);
						var valuePart = eor.eop_ProductInformation.eop_filename.substring(valueStartIndex, eor.eop_ProductInformation.eop_filename.length);
						//console.log("value part :: " + valuePart);
						var valueStopIndex = valuePart.indexOf("&");
						
						if (valueStopIndex == -1){//the value is the last value in the url
							url = firstPart + optionValue;
						}else{//option in the middle of the url
							var remainingPart = valuePart.substring(valueStopIndex, eor.eop_ProductInformation.eop_filename.length);
							//console.log("remainingPart :: " + remainingPart);
							url = firstPart +  optionValue + remainingPart;
							
						}					
						
					}
					console.log("current url with new download options:: " + eor.eop_ProductInformation.eop_filename);
					console.log("Updated url with new download options:: " + url);
					eor.eop_ProductInformation.eop_filename =  url;
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
	
};

// Add events
_.extend(SearchResults, Backbone.Events);


return SearchResults;

});