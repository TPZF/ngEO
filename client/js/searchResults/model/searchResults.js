/**
 * results table model as received from the server
 */
define( ['jquery', 'backbone', 'configuration'], function($, Backbone, Configuration) {


var _getProductDownloadOptions = function(feature) {
	var downloadOptions = {};
	if ( feature.properties && feature.properties.productUrl  ) {
		var url = feature.properties.productUrl;

		var idx = url.indexOf("ngEO_DO={");
		if ( idx >= 0 ) {
			var str = url.substring(idx+9,url.length-1);
			var kvs = str.split(',');
			
			for ( var n = 0; n < kvs.length; n++ ) {
				var kv = kvs[n].split(':');
				if ( kv.length == 2 ) {				
					downloadOptions[ kv[0] ] = kv[1];
				}
			}
		}
	}

	return 	downloadOptions;	
};

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
	_highlighted : [],
	
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
			  console.log( jqXHR.getAllResponseHeaders() );
			  if (jqXHR.status == 0 ) {
				location.reload();
			  } else {
				  //notify that the product search has Failed
				  self.trigger('error:features', searchUrl); 
				  self.trigger('endLoading');
			  }
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
		// reset highlight/select
		this._highlighted = [];
		this.selection = [];
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
			this.trigger( "unselectFeatures", unselected, this );
		}
		if (selected.length != 0){
			this.trigger( "selectFeatures", selected, this );
		}
	},
	
	// Check if a feature is selected
	isSelected: function(feature) {
		return this.selection.indexOf(feature) >= 0;
	},
	
	// Check if a feature is highlighted
	isHighlighted: function(feature) {
		return this._highlighted.indexOf(feature) >= 0;
	},
	
	// Highlight a feature, only one can be highlight at a time
	highlight: function(features) {
	
		if ( features.length != 0 || this._highlighted.length != 0 ) {
			// Event for highlight
			this.trigger( "highlightFeatures", features, this._highlighted, this );
			// Copy highlighted items
			this._highlighted = features.slice(0);
		}
	},
	
	// Select a feature
	select: function(feature) {
		this.selection.push(feature);
		this.trigger( "selectFeatures", [feature], this );
	},
	
	// Unselect a feature
	unselect: function(feature) {
		this.selection.splice( this.selection.indexOf(feature), 1 );
		this.trigger( "unselectFeatures", [feature], this );
	},

	/** select all the items of the table which are not selected */
	selectAll : function(){
		
		var selected = _.difference(this.features, this.selection);
		for ( var i = 0; i < selected.length; i++ ) {
			this.selection.push( selected[i] );
		}
		
		if (selected.length != 0){
			this.trigger( "selectFeatures", selected, this );
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
			this.trigger( "unselectFeatures", oldSelection, this );
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
			
			for ( var i = 0; i < features.length; i++ ) {
				var eoMeta = features[i].properties.EarthObservation.EarthObservationMetaData;
				var isPlanned = false;
				if ( eoMeta && eoMeta.eop_status && eoMeta.eop_status == "PLANNED") {
					isPlanned = true;
				} 	
				
				if ( !isPlanned ) {
					if ( features[i].properties && features[i].properties.productUrl ) {
						productUrls.push( features[i].properties.productUrl );
					}
				}
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
	
	/** return the non Planned features */
	getNonPlannedItems : function(features){
		
		var nonPlannedFeatures = [];
		var eoMeta;
		
		for ( var i = 0; i < features.length; i++ ) {
			eoMeta = features[i].properties.EarthObservation.EarthObservationMetaData;
			if ( eoMeta && eoMeta.eop_status && eoMeta.eop_status != "PLANNED") {
				nonPlannedFeatures.push(features[i]);
			} 	
		}
		return nonPlannedFeatures;
	},
	//the following method appends the download options using this convention &param_1=value1&....&param_n=value_n
	//kept here in case of any change !
//	/** After a download options selection change on results table, update the selected(checked) product urls 
//	 * with the new selected downloadOptions. The selectedDownloadOptions argument is a json object 
//	 * containing the selected download options.
//	 * 
//	 */
//	updateProductUrls: function(selectedDownloadOptions) {
//		
//		
//		_.each(this.selection, function(feature){
//			if ( feature.properties && feature.properties.productUrl  ) {
//				var url = feature.properties.productUrl;
//				console.log("product url initial = " + url);
//				_.each(selectedDownloadOptions, function(optionValue, optionKey, list){
//					//the download option is not set in the url
//					if (url.indexOf(optionKey) == -1){
//						//no parameters set in the url
//						if (url.indexOf("?") == -1){
//							url += "?" + optionKey + "=" + optionValue;
//						} else {//there are parameters in the url
//							url += "&" + optionKey + "=" + optionValue;
//						}
//					} else {
//						//the option has already been set : replace the existent value
//						var valueStartIndex = url.indexOf(optionKey) + optionKey.length + 1; //+1 to cover = after the param
//						var firstPart = url.substring(0, valueStartIndex);
//						//console.log("first part :: " + firstPart);
//						var valuePart = url.substring(valueStartIndex, url.length);
//						//console.log("value part :: " + valuePart);
//						var valueStopIndex = valuePart.indexOf("&");
//						
//						if (valueStopIndex == -1){//the value is the last value in the url
//							url = firstPart + optionValue;
//						}else{//option in the middle of the url
//							var remainingPart = valuePart.substring(valueStopIndex, url.length);
//							//console.log("remainingPart :: " + remainingPart);
//							url = firstPart +  optionValue + remainingPart;
//							
//						}					
//						
//					}
//				});	
//				console.log("product url updated = " + url);
//				feature.properties.productUrl =  url;
//			} 
//		});
//	},
	
	/** the following method appends the download options using this convention ngEO product URI :
	 *  it appends the download options to the product url as follows: &ngEO_DO={param_1:value1,....,param_n:value_n}
	 */
	updateProductUrls: function(selectedDownloadOptions) {
		
		
		_.each(this.selection, function(feature){
			if ( feature.properties && feature.properties.productUrl  ) {
				var url = feature.properties.productUrl;
				//console.log("product url initial = " + url);

				//remove the already added download options : this fixes the already existing bug :
				//when none is chosen the download option is not removed from the url
				if (url.indexOf("ngEO_DO={") != -1){
					var url = url.substring(0, url.indexOf("ngEO_DO={")-1);
					//console.log("product url removed download options  = " + url);
				}
				
				_.each(selectedDownloadOptions, function(optionValue, optionKey, list){
								
					//the download option is not set in the url

					if (url.indexOf("ngEO_DO={") != -1){//in that case the ngEO_DO={} is the last param according to the ICD
						
						var urlWithoutlastBaraket = url.substring(0, url.length-1);
						urlWithoutlastBaraket += "," + optionKey + ":" + optionValue + "}";
						url = urlWithoutlastBaraket;
					
					}else{//there are no download options already added
						
						if (url.indexOf("?") == -1){
							url += "?";
						} else {//there are parameters in the url
							url += "&";
						}
						url += "ngEO_DO={" + optionKey + ":" + optionValue + "}";
					
					}
				});	
				//console.log("product url updated = " + url);
				feature.properties.productUrl =  url;
			} 
		});
	},
	
	/** 
	 * Get the download options on the selected products
	 */
	getSelectedDownloadOptions: function() {
			
		if ( this.selection.length == 0 )
			return {};
		
		// Retreive download options for first product in selection
		var selectedDowndloadOptions = _getProductDownloadOptions( this.selection[0] );
		
		// Now check if the other have the same download options
		for ( var i = 1; i < this.selection.length; i++ ) {
			var dos = _getProductDownloadOptions( this.selection[i] );
			
			for ( var x in dos ) {
				if ( selectedDowndloadOptions[x] != dos[x] ) {
					selectedDowndloadOptions[x] = "@conflict";
				}
			}
			
			for ( var x in selectedDowndloadOptions ) {
				if ( selectedDowndloadOptions[x] != dos[x] ) {
					selectedDowndloadOptions[x] = "@conflict";
				}
			}		
		}
		
		return selectedDowndloadOptions;
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
