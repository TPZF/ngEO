/**
 * FeatureCollection received from search results
 */

var Configuration = require('configuration');
var DataSetPopulation = require('search/model/dataSetPopulation');
var DataSetSearch = require('search/model/datasetSearch');
var DownloadOptions = require('search/model/downloadOptions');
var ProductService = require('ui/productService');

/**
 * Extract the download options from the product url
 */
var _getProductDownloadOptions = function (feature) {

	var productUrl = Configuration.getMappedProperty(feature, "productUrl", null);
	return DownloadOptions.extractParamsFromUrl(productUrl);
};


var FeatureCollection = function () {

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
	this.selections = [];

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

	// Current browse index (in case of multiple browses) per feature collection
	// MS: Maybe move it to BrowsesManager.. (tbd on deploy)
	this.browseIndex = [0];

	var self = this;

	// fetch the results using the given start index
	var _fetch = function (startIndex, currentUrl) {
		var searchUrl = _url + "&startIndex=" + startIndex;

		$.ajax({
			url: searchUrl,
			dataType: 'json'

		}).done(function (data) {

			if (self.parse)
				data = self.parse(data);

			// Update data if a new launch has not been done, the launch is new if the url has changed
			// TODO : improve the mechanism?
			if (_url == currentUrl) {

				_pageCache[self.currentPage] = data.features;

				if (data.properties && data.properties.totalResults) {
					self.totalResults = parseInt(data.properties.totalResults);
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
				if (data.features.length < 1) {
					self.trigger('endLoading', 0);
				}
			}
		}).fail(function (jqXHR, textStatus, errorThrown) {
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
	this.addFeatures = function (features) {
		for (var i = 0; i < features.length; i++) {

			// HACK: currently server returns the same id for all children so we modify it to be unique
			var feature = features[i];
			if (this.parent != null) {
				feature.id = feature.id + i;
			}
			// HACK: store feature collection on each feature to avoid multiple problems on browse changing
			feature._featureCollection = this;

			self.features.push(feature);
		}

		if (features.length > 0) {
			// if lastPage = 0 (empty) => set to 1 (now not empty)
			if (self.lastPage === 0) {
				self.lastPage = 1;
			}

			self.trigger('add:features', features, self);
		}

	};

	// 
	/**
	 * Remove features from collection
	 * 
	 * @function removeFeatures
	 * @param {array} features
	 * 
	 * @see client/js/shopcart/model#deleteHighlights()
	 */
	this.removeFeatures = function (features) {
		this.unselect(features);
		this.unsetHighlight(features);
		this.features = _.difference(this.features, features);
		self.trigger('remove:features', features, self);
	};

	// 
	/**
	 * Show features of collection
	 * 
	 * @function showFeatures
	 * @param {array} features
	 * 
	 * @see client/js/ui/tableView#filterData()
	 */
	this.showFeatures = function (features) {
		self.trigger('show:features', features, self);
		if (features.length > 0) {
			// HACK: highlight all highlights, selected all selection for the moment
			this.trigger("highlightFeatures", this.highlights, this);
			this.trigger("selectFeatures", this.selections, this);
		}

	};

	/**
	 * Hide features of collection
	 * 
	 * @function hideFeatures
	 * @param {array} features
	 * 
	 * @see client/js/ui/tableView#filterData()
	 */
	this.hideFeatures = function (features) {
		self.trigger('hide:features', features, self);
	};

	// Show browses
	this.showBrowses = function (features) {
		self.trigger('show:browses', features, self);
	};

	// Hide browses
	this.hideBrowses = function (features) {
		self.trigger('hide:browses', features, self);
	};


	// Launch a search
	this.search = function (baseUrl) {

		// Build base url
		_url = baseUrl;
		if (this.dataset) {
			this.countPerPage = this.dataset.get('countPerPage');
		}
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
	this.reset = function () {
		// Reset all highlighted/selected features
		this.unsetHighlight(this.highlights);
		this.unselect(this.selections);

		// Reset children
		for (var x in this.children) {
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
	this.changePage = function (page) {
		if (page >= 1 && page <= this.lastPage) {
			this.currentPage = page;
			this.features.length = 0;
			// Reset all highlighted/selected features
			this.unsetHighlight(this.highlights);
			this.unselect(this.selections);

			// Reset children
			for (var x in this.children) {
				this.removeChild(x);
			}
			this.children = {};
			this.trigger('reset:features', this);
			if (_pageCache[this.currentPage]) {
				this.addFeatures(_pageCache[this.currentPage]);
			} else {
				this.trigger('startLoading', this);
				_fetch(this.getStartIndex() + (this.currentPage - 1) * this.countPerPage, _url);
			}
		}

	};

	// Append the given page to existing results
	this.appendPage = function (page) {
		this.currentPage = page;
		this.trigger('startLoading', this);
		_fetch(this.getStartIndex() + (this.currentPage - 1) * this.countPerPage, _url);
	};

	// Get start index according to current dataset
	this.getStartIndex = function () {
		if (this.dataset) {
			// Backend dataset
			return this.dataset.get('startIndex');
		} else {
			return 1; // Default start index according to OpenSearch spec
		}
	};

	/**
	 * Check if a feature is browsed
	 * @see ProductService
	 * 
	 * @function isBrowsed
	 * @param {object} feature
	 * @returns {boolean}
	 */
	this.isBrowsed = function (feature) {
		return ProductService.getBrowsedProducts().indexOf(feature) >= 0;
	};

	/**
	 * Check if a feature is selected
	 * 
	 * @function isSelected
	 * @param {object} feature
	 * @returns {boolean}
	 */
	this.isSelected = function (feature) {
		return this.selections.indexOf(feature) >= 0;
	};

	/**
	 * Check if a feature is highlighted
	 * 
	 * @function isHighlighted
	 * @param {object} feature
	 * @returns {boolean}
	 */
	this.isHighlighted = function (feature) {
		return this.highlights.indexOf(feature) >= 0
	};

	/**
	 * For all features
	 * If feature is not selected (checked)
	 * Then unhighlight it
	 * 
	 * @function checkAllHighlight
	 * @returns {void}
	 */
	this.checkAllHighlight = function () {
		var _this = this;
		var unhighlights = [];
		this.highlights.forEach(function (feat) {
			if (!_this.isSelected(feat)) {
				unhighlights.push(feat);
			}
		})
		this.unsetHighlight(unhighlights);
	};

	/**
	 * Set status highlight for these features
	 * And trigger this event
	 * 
	 * @function setHighlight
	 * @param {array} features
	 * @returns {void}
	 */
	this.setHighlight = function (features) {

		ProductService.addHighlightedProducts(features);

		var _this = this; // reference to featureCollection object

		if (features.length === 0) {
			this.checkAllHighlight();
		}

		this.highlights = _.union(this.highlights, features);

		this.trigger("highlightFeatures", features, this);
		// ***OML*** this.showBrowses( _.intersection(features, this.features));
		// Trigger highlight event on every children feature collection with highlighted features which belongs to children[x] feature collection
		for (var x in this.children) {
			// ***OML*** this.trigger("highlightFeatures", _.intersection(features, this.children[x].features), prevHighlights, this.children[x])
		}
	};

	/**
	 * Remove highlight status for these features
	 * And trigger this event
	 * 
	 * @function unsetHighlight
	 * @param {array} features
	 * @returns {void}
	 */
	this.unsetHighlight = function (features) {

		ProductService.removeHighlightedProducts(features);
		this.highlights = _.difference(this.highlights, features);
		this.trigger("unhighlightFeatures", features, this);

	};

	/**
	 * Select features
	 * 
	 * @function select
	 * @param {array} features
	 * @returns {void}
	 */
	this.select = function (features) {
		for (var i = 0; i < features.length; i++) {
			var feature = features[i];
			if (this.selections.indexOf(feature) == -1) {
				this.selections.push(feature);
			}
		}
		ProductService.addCheckedProducts(features);
		this.trigger("selectFeatures", features, this);
	};

	/**
	 * Unselect features
	 * 
	 * @function unselect
	 * @param {array} features
	 * @returns {void}
	 */
	this.unselect = function (features) {
		let newSelections = _.difference(this.selections, features);
		this.selections = newSelections;
		ProductService.removeCheckedProducts(features);
		this.trigger("unselectFeatures", features, this);
	};


	// Create a child feature collection for the given feature
	this.createChild = function (featureId) {
		var child = new FeatureCollection();
		var cleanedId = String(featureId).replace(/\W/g, '_'); // Id without special characters
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
	this.removeChild = function (featureId) {
		var cleanedId = String(featureId).replace(/\W/g, '_'); // Id without special characters
		this.trigger('remove:child', this.children[cleanedId], {
			layerName: "Child Result",
			style: "results-footprint",
			hasBrowse: true
		});
		delete this.children[cleanedId];
	};

	/**
	 * Get the list of products URLs from a list of features
	 * if the file name is empty the product is rejected
	 */
	this.getSelectedProductUrls = function () {

		var productUrls = [];

		for (var i = 0; i < this.selections.length; i++) {
			var f = this.selections[i];
			var url = Configuration.getMappedProperty(f, "productUrl", null);
			if (url) {
				productUrls.push(url);
			}
		}
		return productUrls;
	};

	/**
	 * Get the list of products URLs from a list of features
	 * if the file name is empty the product is rejected
	 */
	this.getHighlightedProductUrls = function () {

		var productUrls = [];

		for (var i = 0; i < this.highlights.length; i++) {
			var f = this.highlights[i];
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
	this.updateProductUrl = function (feature, urlProperty, downloadOptions) {

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
	this.updateDownloadOptions = function (downloadOptions) {

		var self = this;
		_.each(this.selections, function (feature) {

			self.updateProductUrl(feature, "productUrl", downloadOptions);
			// NGEO-1972: Update productUri (metadata report) as well...
			self.updateProductUrl(feature, "productUri", downloadOptions);
		});
		this.trigger("update:downloadOptions", this.selections);
	};

	/** 
	 * Get the download options on the selected products
	 */
	this.getSelectedDownloadOptions = function () {

		if (this.selections.length == 0)
			return {};

		// Retreive download options for first product in selection
		var selectedDownloadOptions = _getProductDownloadOptions(this.selections[0]);

		// Now check if the other have the same download options
		for (var i = 1; i < this.selections.length; i++) {
			var dos = _getProductDownloadOptions(this.selections[i]);

			for (var x in dos) {
				if (_.isArray(dos[x])) {
					selectedDownloadOptions[x] = _.intersection(selectedDownloadOptions[x], dos[x]);
				} else if (!_.isEqual(selectedDownloadOptions[x], dos[x])) {
					selectedDownloadOptions[x] = "@conflict";
				}
			}

			for (var x in selectedDownloadOptions) {
				if (_.isArray(selectedDownloadOptions[x])) {
					selectedDownloadOptions[x] = _.intersection(selectedDownloadOptions[x], dos[x]);
				} else if (!_.isEqual(selectedDownloadOptions[x], dos[x])) {
					selectedDownloadOptions[x] = "@conflict";
				}
			}
		}

		return selectedDownloadOptions;
	};

	/**
	 * Get the dataset id of a feature.
	 */
	this.getDatasetId = function (feature) {

		// If the feature collection has a dataset, just return its id
		if (this.dataset) {
			return this.dataset.get('datasetId');
		}

		// Otherwise extract the id from the feature
		return Configuration.getMappedProperty(feature, "originDatasetId", null);
	};

	/**
	 * Get the datasets from the selections
	 */
	// this.getSelectionDatasetIds = function() {
	// 	var datasetIds = [];
	// 	for (var i = 0; i < this.selections.length; i++) {
	// 		var datasetId = this.getDatasetId(this.selections[i]);
	// 		if (datasetId) {
	// 			if (datasetIds.indexOf(datasetId) < 0) {
	// 				datasetIds.push(datasetId);
	// 			}
	// 		}
	// 	}
	// 	return datasetIds;
	// };

	/**
	 * Get the datasets from the highlights
	 */
	this.getDatasetIdsFromHighlights = function () {
		var datasetIds = [];
		for (var i = 0; i < this.highlights.length; i++) {
			var datasetId = this.getDatasetId(this.highlights[i]);
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
	this.fetchAvailableDownloadOptions = function (callback) {

		if (this.dataset) {
			return callback(this.dataset.get('downloadOptions'));
		}

		var downloadOptions = [];
		var datasetIds = this.getDatasetIdsFromHighlights();
		if (datasetIds.length == 1) {
			DataSetPopulation.fetchDataset(datasetIds[0], function (dataset) {
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

	/**
	 * The direct download uses the
	 *   OLD FORMAT: eor.eop_ProductInformation.eop_filename and not the feature.properties.productUrl
	 *	 NEW FORMAT: mapped "productUri" instead of "productUrl"
	 */
	this.getDirectDownloadProductUrl = function (feature) {
		return Configuration.getMappedProperty(feature, "productUri", "");
	};

	/**
	 * Check whether the given feature has a direct download url supported by a browser 
	 */
	this.isBrowserSupportedUrl = function (feature) {

		var downloadUrl = this.getDirectDownloadProductUrl(feature);
		if (downloadUrl.indexOf("http") != -1 || downloadUrl.indexOf("https") != -1) {
			return true;
		}
		return false;
	};


	this.focus = function (feature) {
		this.trigger("focus", feature, this);
	}

	this.unfocus = function (feature) {
		this.trigger("unfocus", feature, this);
	}

	// Add events
	_.extend(this, Backbone.Events);

};

module.exports = FeatureCollection;