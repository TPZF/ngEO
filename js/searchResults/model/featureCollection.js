/**
 * FeatureCollection received from search results
 */
define( ['jquery', 'backbone', 'configuration'], function($, Backbone, Configuration) {


var FeatureCollection = function() {
	
	
	// Keep the page results
	var _pageCache = [];
	
	// The URL for search results
	var _url = "";
	
	// Store the current page index
	this.currentPage = 0;
	
	// The last page
	this.lastPage = 0;
	
	// Store the count per page
	this.countPerPage = Configuration.get('searchResults.countPerPage',100);
	
	// Store the number of total results
	this.totalResults = -1;
		
	// Array of features
	this.features = [];
		
	// The current selection
	this.selection = [];
	
	// The hightlighted features
	this.highlights = [];
	
	// The id of the feature collection
	this.id = "";
	
	var self = this;
	
	// fetch the results using the given start index
	var _fetch = function(startIndex,currentUrl) {
		var searchUrl = _url + "&startIndex=" + startIndex;
		
		$.ajax({
			url: searchUrl,
			dataType: 'json'
				
		}).done(function(data) {
			// Update data if a new launch has not been done, the launch is new if the url has changed
			// TODO : improve the mechanism?
			if ( _url == currentUrl ) {
			
				_pageCache[self.currentPage] = data.features;
				
				if ( data.properties && data.properties.totalResults ) {
					self.totalResults = data.properties.totalResults;
				} else {
					self.totalResults = data.features.length;
				}
				
				self.lastPage = Math.ceil( self.totalResults / self.countPerPage );
			
				// Add the features to the results
				_addFeatures( data.features );
				
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
	};
	
	// Add features to the result
	var _addFeatures = function(features) {
		for ( var i = 0; i < features.length; i++ ) {
			self.features.push( features[i] );
		}
		self.trigger('add:features',features,self);
	};
	
	// launch a search
	this.launch = function(searchCriteria) {
	
		_url = Configuration.serverHostName + Configuration.baseServerUrl + "/catalogue/" + this.id + "/search?";

		//add area criteria if set
		_url = searchCriteria.addGeoTemporalParams(_url);
		
		//always add the advanced criteria values selected and already set to the model
		_url = searchCriteria.addAdvancedCriteria(_url);

		//add the download options values selected and already set to the model
		_url = searchCriteria.addDownloadOptionsWithProductURIConvention(_url);

		_url += "&count=" + this.countPerPage;
		
		// reset the cache
		_pageCache.length = 0;
		// resest the count of results
		this.lastPage = 1;
		this.totalResults = 0;
		// Change to first page, will trigger the first search
		this.changePage(1);
	};
	
	// Reset the results
	this.reset = function() {
		_url = "";
		// reset the cache
		_pageCache.length = 0;
		// resest the count of results
		this.lastPage = 1;
		this.totalResults = 0;
		// reset the features
		this.features.length = 0;
		// reset highlight/select
		this.highlights = [];
		this.selection = [];
		this.trigger('reset:features',this);
	};
	
	// Method to change the current page of results
	this.changePage = function(page) {
		if ( page >= 1 && page <= this.lastPage ) {
			this.currentPage = page;
			this.features.length = 0;
			this.trigger('reset:features',this);
			if ( _pageCache[this.currentPage] ) {
				_addFeatures( _pageCache[this.currentPage] );
			} else {
				this.trigger('startLoading', this);
				_fetch(1 + (this.currentPage-1)*this.countPerPage, _url);
			}
		}
	};
	
	// Set the selection, replace the previous one
	this.setSelection = function(features) {
		var unselected = _.difference(this.selection, features);
		var selected = _.difference(features, this.selection);
		this.selection = features;
		if (unselected.length != 0){
			this.trigger( "unselectFeatures", unselected, this );
		}
		if (selected.length != 0){
			this.trigger( "selectFeatures", selected, this );
		}
	};
	
	// Check if a feature is selected
	this.isSelected = function(feature) {
		return this.selection.indexOf(feature) >= 0;
	};
	
	// Check if a feature is highlighted
	this.isHighlighted = function(feature) {
		return this.highlights.indexOf(feature) >= 0;
	};
	
	// Highlight a feature, only one can be highlight at a time
	this.highlight = function(features) {
	
		if ( features.length != 0 || this.highlights.length != 0 ) {
			// Event for highlight
			this.trigger( "highlightFeatures", features, this.highlights, this );
			// Copy highlighted items
			this.highlights = features.slice(0);
		}
	};
	
	// Select a feature
	this.select = function(feature) {
		this.selection.push(feature);
		this.trigger( "selectFeatures", [feature], this );
	};
	
	// Unselect a feature
	this.unselect = function(feature) {
		this.selection.splice( this.selection.indexOf(feature), 1 );
		this.trigger( "unselectFeatures", [feature], this );
	};

	/** select all the items of the table which are not selected */
	this.selectAll = function(){
		
		var selected = _.difference(this.features, this.selection);
		for ( var i = 0; i < selected.length; i++ ) {
			this.selection.push( selected[i] );
		}
		
		if (selected.length != 0){
			this.trigger( "selectFeatures", selected, this );
		}
	};
	
	/** unselect all the already selected table items */
	this.unselectAll =function() {
		
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

	};
	
	/** Get the list of products URLs from a list of features
	 * if the file name is empty the product is rejected
	 */
	this.getSelectedProductUrls = function(features) {
		
		var productUrls = [];
		
		for ( var i = 0; i < this.selection.length; i++ ) {			
			var f = this.selection[i];
			if ( f.properties && f.properties.productUrl ) {
				productUrls.push( f.properties.productUrl );
			}
		}
		return productUrls;
	};
	
	// Add events
	_.extend(this, Backbone.Events);

};

return FeatureCollection;

});