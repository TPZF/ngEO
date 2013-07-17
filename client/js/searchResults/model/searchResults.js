/**
 * results table model as received from the server
 */
define( ['jquery', 'backbone', 'configuration'], function($, Backbone, Configuration) {


var SearchResults = {
	
	// Store the count per page
	countPerPage : 100,
	
	// Store the current page index
	currentPage : 0,
	
	// The last page
	lastPage : 0,
	
	// Store the number of total results
	totalResults: 0,
	
	// Keep the page results
	_pageCache: [],
		
	// Array of features
	features: [],
		
	// The current selection
	selection: [],
	
	// The hightlighted feature
	_highlight: null,
	
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
			
				self._pageCache[self.currentPage] = data.features;
				
				if ( data.properties && data.properties.totalResults ) {
					self.totalResults = data.properties.totalResults;
				} else {
					self.totalResults = data.features.length;
				}
				
				self.lastPage = Math.ceil( self.totalResults / self.countPerPage );
			
				// Add the features to the results
				self._addFeatures( data.features );
				
				// Relaunch a search on next page if there is still some results
				/*if ( data.features.length == self.countPerPage ) {
					self.fetch(startIndex + self.countPerPage, currentUrl);
				} else {
					self.trigger('endLoading');
				}*/
			}		
		}).fail(function(jqXHR, textStatus, errorThrown) {		
			  console.log("ERROR when retrieving the products :" + textStatus + ' ' + errorThrown);
			  //notify that the product search has Failed
			  self.trigger('error:features', searchUrl); 
			  self.trigger('endLoading');
		});
	},
	
	// launch a search
	launch: function(url) {
		this.url = url + "&count=" + this.countPerPage;
		// reset the cache
		this._pageCache.length = 0;
		// resest the count of results
		this.lastPage = 1;
		this.totalResults = 0;
		// Change to first page, will trigger the first search
		this.changePage(1);
	},
	
	// Reset the results
	reset: function() {
		this.url = "";
		// reset the cache
		this._pageCache.length = 0;
		// resest the count of results
		this.lastPage = 1;
		this.totalResults = 0;
		// reset the features
		this.features.length = 0;
		this.trigger('reset:features');
	},
	
	// Add features to the result
	_addFeatures: function(features) {
		for ( var i = 0; i < features.length; i++ ) {
			this.features.push( features[i] );
		}
		this.trigger('add:features',features);
	},
	
	// Method to change the current page of results
	changePage: function(page) {
		if ( page >= 1 && page <= this.lastPage ) {
			this.currentPage = page;
			this.features.length = 0;
			this.trigger('reset:features');
			if ( this._pageCache[this.currentPage] ) {
				this._addFeatures( this._pageCache[this.currentPage] );
			} else {
				this.trigger('startLoading');
				this.fetch(1 + (this.currentPage-1)*this.countPerPage, this.url);
			}
		}
	},
	
	// Set the selection, replace the previous one
	setSelection: function(features) {
		var unselected = _.difference(this.selection, features);
		var selected = _.difference(features, this.selection);
		this.selection = features;
		if (unselected.length != 0){
			this.trigger( "unselectFeatures", unselected );
		}
		if (selected.length != 0){
			this.trigger( "selectFeatures", selected );
		}
	},
	
	// Check if a feature is selected
	isSelected: function(feature) {
		return this.selection.indexOf(feature) >= 0;
	},
	
	// Highlight a feature, only one can be highlight at a time
	highlight: function(feature) {
		if ( feature != this._highlight ) {
			this.trigger( "highlightFeature", feature, this._highlight, this );
			this._highlight = feature;
		}
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

	/** select all the items of the table which are not selected */
	selectAll : function(){
		
		var selected = _.difference(this.features, this.selection);
		for ( var i = 0; i < selected.length; i++ ) {
			this.selection.push( selected[i] );
		}
		
		if (selected.length != 0){
			this.trigger( "selectFeatures", selected );
		}
	},
	
	/** unselect all the already selected table items */
	unselectAll: function() {
		
		//this.setSelection([]);
		var oldSelection = [];
		//copy the selected items
		for ( var i = 0; i < this.selection.length; i++ ) {
			oldSelection.push(this.selection[i])
		}
		this.selection = []	
		if (oldSelection.length != 0){
			this.trigger( "unselectFeatures", oldSelection );
		}

	},
	
	/** Get the list of products URLs from a list of features
	 * if the file name is empty the product is rejected
	 */
	getProductUrls: function(features) {
		
		var productUrls = [];
		var eor;
		
		for ( var i = 0; i < features.length; i++ ) {
/*			eor = features[i].properties.EarthObservation.EarthObservationResult;
			if ( eor && eor.eop_ProductInformation && eor.eop_ProductInformation.eop_filename && eor.eop_ProductInformation.eop_filename != "" ) {
				productUrls.push(eor.eop_ProductInformation.eop_filename);
			} */
			
			if ( features[i].properties && features[i].properties.productUrl ) {
				productUrls.push( features[i].properties.productUrl );
			}
		}
		return productUrls;
	},
	
	/** the direct download uses the eor.eop_ProductInformation.eop_filename and not the feature.properties.productUrl */
	getDirectDownloadProductUrls : function(features) {
		
		var productUrls = [];
		var eor;
		
		for ( var i = 0; i < features.length; i++ ) {
			eor = features[i].properties.EarthObservation.EarthObservationResult;
			if ( eor && eor.eop_ProductInformation && eor.eop_ProductInformation.eop_filename && eor.eop_ProductInformation.eop_filename != "" ) {
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
		
		
		_.each(this.selection, function(feature){
			if ( feature.properties && feature.properties.productUrl  ) {
				var url = feature.properties.productUrl;
				_.each(selectedDownloadOptions, function(optionValue, optionKey, list){
					//the download option is not set in the url
					if (url.indexOf(optionKey) == -1){
						//no parameters set in the url
						if (url.indexOf("?") == -1){
							url += "?" + optionKey + "=" + optionValue;
						} else {//there are parameters in the url
							url += "&" + optionKey + "=" + optionValue;
						}
					} else {
						//the option has already been set : replace the existent value
						var valueStartIndex = url.indexOf(optionKey) + optionKey.length + 1; //+1 to cover = after the param
						var firstPart = url.substring(0, valueStartIndex);
						//console.log("first part :: " + firstPart);
						var valuePart = url.substring(valueStartIndex, url.length);
						//console.log("value part :: " + valuePart);
						var valueStopIndex = valuePart.indexOf("&");
						
						if (valueStopIndex == -1){//the value is the last value in the url
							url = firstPart + optionValue;
						}else{//option in the middle of the url
							var remainingPart = valuePart.substring(valueStopIndex, url.length);
							//console.log("remainingPart :: " + remainingPart);
							url = firstPart +  optionValue + remainingPart;
							
						}					
						
					}
				});	
				feature.properties.productUrl =  url;
			} 
		});
	},
	
	/**  Check whether the given feature has a direct download url supported by a browser */
	isBrowserSupportedUrl : function(feature) {

		var eor = feature.properties.EarthObservation.EarthObservationResult;
		if ( eor && eor.eop_ProductInformation && eor.eop_ProductInformation.eop_filename && eor.eop_ProductInformation.eop_filename != "" &&
				(eor.eop_ProductInformation.eop_filename.indexOf("http") != -1 ||
						eor.eop_ProductInformation.eop_filename.indexOf("https") != -1)) {
			return true;
		}	
		return false;
	},
	
};

if ( Configuration.data && Configuration.data.searchResults && Configuration.data.searchResults.countPerPage ) {
	SearchResults.countPerPage = Configuration.data.searchResults.countPerPage;
}

// Add events
_.extend(SearchResults, Backbone.Events);


return SearchResults;

});