/**
 * FeatureCollection received from search results
 */

var Configuration = require('configuration');
var DataSetPopulation = require('search/model/dataSetPopulation');
var DataSetSearch = require('search/model/datasetSearch');

/**
 * Extract the download options from the product url
 */
var _getProductDownloadOptions = function(feature) {
	var downloadOptions = {};
	var productUrl = Configuration.getMappedProperty(feature, "productUrl", null);
	if (productUrl) {
		var idx = productUrl.indexOf("ngEO_DO={");
		if (idx >= 0) {
			var str = productUrl.substring(idx + 9, productUrl.length - 1);
			var kvs = str.split(',');

			for (var n = 0; n < kvs.length; n++) {
				var kv = kvs[n].split(':');
				if (kv.length == 2) {
					downloadOptions[kv[0]] = kv[1];
				}
			}
		}
	}

	return downloadOptions;
};


var FeatureCollection = function() {

	// Dictionary for features containing children feature collections
	this.children = {};

	// Keep the page results
	var _pageCache = [];

	// The URL for search results
	var _url = "";

	// Store the current page index
	this.currentPage = 1;

	// The last page
	this.lastPage = 0;

	// Store the count per page
	this.countPerPage = Configuration.get('searchResults.countPerPage', 100);

	// Store the number of total results
	this.totalResults = -1;

	// Array of features
	this.features = [];

	// The current selection
	this.selection = [];

	// The hightlighted features
	this.highlights = [];

	// View access
	this.viewAccess = true;

	// Download access
	this.downloadAccess = true;

	// The dataset
	this.dataset = null;

	// The id of the feature collection
	this.id = "";

	var self = this;

	// fetch the results using the given start index
	var _fetch = function(startIndex, currentUrl) {
		var searchUrl = _url + "&startIndex=" + startIndex;

		$.ajax({
			url: searchUrl,
			dataType: 'json'

		}).done(function(data) {

			if (self.parse)
				data = self.parse(data);

			// Update data if a new launch has not been done, the launch is new if the url has changed
			// TODO : improve the mechanism?
			if (_url == currentUrl) {

				_pageCache[self.currentPage] = data.features;

				if (data.properties && data.properties.totalResults) {
					self.totalResults = data.properties.totalResults;
				} else {
					self.totalResults = data.features.length;
				}

				self.lastPage = Math.ceil(self.totalResults / self.countPerPage);

				// Add the features to the results
				self.addFeatures(data.features);

				// Relaunch a search on next page if there is still some results
				/*if ( data.features.length == self.countPerPage ) {
					self.fetch(startIndex + self.countPerPage, currentUrl);
				} else {
					self.trigger('endLoading');
				}*/
			}
		}).fail(function(jqXHR, textStatus, errorThrown) {
			if (jqXHR.status == 0) {
				location.reload();
			} else {
				console.log("ERROR when retrieving the products :" + textStatus + ' ' + errorThrown);
				//notify that the product search has Failed
				self.trigger('error:features', searchUrl);
				self.trigger('endLoading');
			}
		});
	};

	// Add features to collection
	this.addFeatures = function(features) {
		for (var i = 0; i < features.length; i++) {

			// HACK: currently server returns the same id for all children so we modify it to be unique
			var feature = features[i];
			if ( this.parent != null ) {
				feature.id = feature.id + i;
			}

			self.features.push(feature);
		}

		self.trigger('add:features', features, self);
	};

	// Remove features from the collection
	this.removeFeatures = function(features) {
		this.setSelection(_.difference(this.selection, features));
		this.highlight(_.difference(this.highlights, features));
		this.features = _.difference(this.features, features);
		self.trigger('remove:features', features, self);
	};

	// Show features
	this.showFeatures = function(features) {
		self.trigger('show:features', features, self);
		if ( features.length > 0 ) {
			// HACK: highlight all highlights, selected all selection for the moment
			this.trigger("highlightFeatures", this.highlights, this.highlights, this);
			this.trigger("selectFeatures", this.selection, this);
		}

	};
	
	// Hide features
	this.hideFeatures = function(features) { 
		self.trigger('hide:features', features, self);
	};

	// Show browses
	this.showBrowses = function(features) {
		self.trigger('show:browses', features, self);
	};

	// Hide browses
	this.hideBrowses = function(features) {
		self.trigger('hide:browses', features, self);
	};


	// Launch a search
	this.search = function(baseUrl) {

		// Build base url
		_url = baseUrl;
		_url += "&count=" + this.countPerPage;

		// Reset the cache
		_pageCache.length = 0;
		// Reset the count of results
		this.lastPage = 1;
		this.totalResults = 0;
		// Change to first page, will trigger the first search
		this.changePage(1);
	};

	// Reset the results
	this.reset = function() {
		// Reset all highlighted/selected features
		this.resetHighlighted();
		this.resetSelected();

		// Reset children
		for ( var x in this.children ) {
			this.removeChild(x);
		}
		this.children = {};

		_url = "";
		// Reset the cache
		_pageCache.length = 0;
		// Reset the count of results
		this.lastPage = 1;
		this.totalResults = 0;
		// Reset the features
		this.features.length = 0;
		this.trigger('reset:features', this);
	};

	// Method to change the current page of results
	this.changePage = function(page) {
		if (page >= 1 && page <= this.lastPage) {
			this.currentPage = page;
			this.features.length = 0;
			// Reset all highlighted/selected features
			this.resetHighlighted();
			this.resetSelected();

			// Reset children
			for ( var x in this.children ) {
				this.removeChild(x);
			}
			this.children = {};
			this.trigger('reset:features', this);
			if (_pageCache[this.currentPage]) {
				this.addFeatures(_pageCache[this.currentPage]);
			} else {
				this.trigger('startLoading', this);
				_fetch(1 + (this.currentPage - 1) * this.countPerPage, _url);
			}
		}
	};

	// Append the given page to existing results
	this.appendPage = function(page) {
		this.currentPage = page;
		this.trigger('startLoading', this);
		_fetch(1 + (this.currentPage - 1) * this.countPerPage, _url);
	};

	// Set the selection, replace the previous one
	this.setSelection = function(features) {
		var unselected = _.difference(this.selection, features);
		var selected = _.difference(features, this.selection);
		this.selection = features;
		if (unselected.length != 0) {
			this.trigger("unselectFeatures", unselected, this);
		}
		if (selected.length != 0) {
			this.trigger("selectFeatures", selected, this);
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

	// Reset all highlighted features
	this.resetHighlighted = function() {
		this.trigger("highlightFeatures", [], this.highlights, this);
		this.highlights = [];
	};

	// Reset all selected features
	this.resetSelected = function() {
		this.trigger("unselectFeatures", this.selection, this);
		this.selection = [];
	};

	// Highlight a feature, only one can be highlight at a time
	this.highlight = function(features) {

		if (features.length != 0 || this.highlights.length != 0) {
			var prevHighlights = this.highlights;
			// Copy highlighted items
			this.highlights = features.slice(0);
			// Trigger highlight event with features which belongs to "this" feature collection
			this.trigger("highlightFeatures", _.intersection(features, this.features), prevHighlights, this);
			// Trigger highlight event on every children feature collection with highlighted features which belongs to children[x] feature collection
			for ( var x in this.children ) {
				this.trigger("highlightFeatures", _.intersection(features, this.children[x].features), prevHighlights, this.children[x])
			}
		}
	};

	// Create a child feature collection for the given feature
	this.createChild = function(featureId) {
		var child = new FeatureCollection();
		var cleanedId = String(featureId).replace(/\W/g,'_'); // Id without special characters
		child.id = cleanedId;
		child.parent = this;
		child.countPerPage = Configuration.get('expandSearch.countPerPage', 100);
		this.children[cleanedId] = child;
		this.trigger('add:child', child, {
			layerName: "Child Result",
			style: "results-footprint",
			hasBrowse: true
		});
		return child;
	};

	// Remove child feature collection for the given feature
	this.removeChild = function(featureId) {
		var cleanedId = String(featureId).replace(/\W/g,'_'); // Id without special characters
		this.trigger('remove:child', this.children[cleanedId], {
			layerName: "Child Result",
			style: "results-footprint",
			hasBrowse: true
		});
		delete this.children[cleanedId];
	};

	// Select a feature
	this.select = function(feature) {
		if ( this.selection.indexOf(feature) == -1 ) {
			this.selection.push(feature);
			this.trigger("selectFeatures", [feature], this);
		}
	};

	// Unselect a feature
	this.unselect = function(feature) {
		if ( this.selection.indexOf(feature) >= 0 ) {
			this.selection.splice(this.selection.indexOf(feature), 1);
			this.trigger("unselectFeatures", [feature], this);
		}
	};

	/**
	 * Select all the items of the table which are not selected
	 *
	 * @param filteredFeatures
	 *		Features to select: used if features were filtered by table view
	 */
	this.selectAll = function(filteredFeatures) {

		// Use filtered features if defined otherwise select all present features
		var selected = _.difference(filteredFeatures ? filteredFeatures : this.features, this.selection);
		for (var i = 0; i < selected.length; i++) {
			this.selection.push(selected[i]);
		}

		if (selected.length != 0) {
			this.trigger("selectFeatures", selected, this);
		}
	};

	/**
	 * Unselect all the already selected table items
	 */
	this.unselectAll = function() {
		this.trigger("unselectFeatures", this.selection, this);
		this.selection = [];
	};

	/**
	 * Get the list of products URLs from a list of features
	 * if the file name is empty the product is rejected
	 */
	this.getSelectedProductUrls = function() {

		var productUrls = [];

		for (var i = 0; i < this.selection.length; i++) {
			var f = this.selection[i];
			var url = Configuration.getMappedProperty(f, "productUrl", null);
			if (url) {
				productUrls.push(url);
			}
		}
		return productUrls;
	};

	/**
	 *	Update feature url property according to the given download options
	 *
	 *  The following method appends the download options using this convention ngEO product URI :
	 *		ngEO_DO={param_1:value1,....,param_n:value_n}
	 */
	this.updateProductUrl = function(feature, urlProperty, downloadOptions) {

		var url = Configuration.getMappedProperty(feature, urlProperty, null);
		if (url) {
			// console.log("product url initial = " + url);

			// Remove the already added download options : this fixes the already existing bug :
			// When none is chosen the download option is not removed from the url
			if (url.indexOf("ngEO_DO={") != -1) {
				url = url.substring(0, url.indexOf("ngEO_DO={") - 1);
				//console.log("product url removed download options  = " + url);
			}

			if (url.indexOf("?") == -1) {
				// First parameter
				url += "?";
			} else {
				// Otherwise
				url += "&";
			}
			url += downloadOptions.getAsUrlParameters();
			Configuration.setMappedProperty(feature, urlProperty, url);
			//console.log("product url updated = " + url);
		}
	};

	/**
	 * Update download options in product url/uri for the current selection
	 */
	this.updateDownloadOptions = function(downloadOptions) {

		var self = this;
		_.each(this.selection, function(feature) {

			self.updateProductUrl(feature, "productUrl", downloadOptions);
			// NGEO-1972: Update productUri (metadata report) as well...
			self.updateProductUrl(feature, "productUri", downloadOptions);
		});
		this.trigger("update:downloadOptions", this.selection);
	};

	/** 
	 * Get the download options on the selected products
	 */
	this.getSelectedDownloadOptions = function() {

		if (this.selection.length == 0)
			return {};

		// Retreive download options for first product in selection
		var selectedDownloadOptions = _getProductDownloadOptions(this.selection[0]);

		// Now check if the other have the same download options
		for (var i = 1; i < this.selection.length; i++) {
			var dos = _getProductDownloadOptions(this.selection[i]);

			for (var x in dos) {
				if (selectedDownloadOptions[x] != dos[x]) {
					selectedDownloadOptions[x] = "@conflict";
				}
			}

			for (var x in selectedDownloadOptions) {
				if (selectedDownloadOptions[x] != dos[x]) {
					selectedDownloadOptions[x] = "@conflict";
				}
			}
		}

		return selectedDownloadOptions;
	};

	/**
	 * Get the dataset id of a feature.
	 */
	this.getDatasetId = function(feature) {

		// If the feature collection has a dataset, just return its id
		if (this.dataset) {
			return this.dataset.get('datasetId');
		}

		// Otherwise extract the id from the feature
		var re = /catalogue\/(\w+)\/search/;
		var productUrl = Configuration.getMappedProperty(feature, "productUrl", null);
		var match = re.exec(productUrl);
		if (match) {
			return match[1];
		}
		return null;
	};

	/**
	 * Get the datasets from the selection
	 */
	this.getSelectionDatasetIds = function() {
		var datasetIds = [];
		for (var i = 0; i < this.selection.length; i++) {
			var datasetId = this.getDatasetId(this.selection[i]);
			if (datasetId) {
				if (datasetIds.indexOf(datasetId) < 0) {
					datasetIds.push(datasetId);
				}
			}
		}
		return datasetIds;
	};

	/** 
	 * Fetch the available download options for the selected products
	 */
	this.fetchAvailableDownloadOptions = function(callback) {

		if (this.dataset) {
			return callback(this.dataset.get('downloadOptions'));
		}

		var downloadOptions = [];
		var datasetIds = this.getSelectionDatasetIds();
		if (datasetIds.length == 1) {
			DataSetPopulation.fetchDataset(datasetIds[0], function(dataset) {
				callback(dataset.get('downloadOptions'));
			});
		} else {
			callback([]);
		}
	};

	/** return the non Planned features */
	/*	this.getSelectedNonPlannedFeatures = function() {
			
			var nonPlannedFeatures = [];
			var eoMeta;
			
			for ( var i = 0; i < this.selection.length; i++ ) {
				eoMeta = this.selection[i].properties.EarthObservation.EarthObservationMetaData;
				if ( eoMeta && eoMeta.eop_status && eoMeta.eop_status != "PLANNED") {
					nonPlannedFeatures.push(this.selection[i]);
				} 	
			}
			return nonPlannedFeatures;
		};*/

	// Add events
	_.extend(this, Backbone.Events);

};

module.exports = FeatureCollection;