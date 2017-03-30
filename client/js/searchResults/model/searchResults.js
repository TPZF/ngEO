/**
 * Results table model as received from the server
 */

var Configuration = require('configuration');
var FeatureCollection = require('searchResults/model/featureCollection');
var DataSetPopulation = require('search/model/dataSetPopulation');
var DatasetSearch = require('search/model/datasetSearch');
var DatasetAuthorizations = require('search/model/datasetAuthorizations');

var SearchResults = {

	featureCollection: {},

	/**
	 * Launch a search
	 */
	launch: function(searchCriteria) {
		for (var x in this.featureCollection) {
			var fc = this.featureCollection[x];
			var baseUrl = searchCriteria.getOpenSearchURL({id: fc.getDatasetId()});
			fc.search(baseUrl);
		}

		this.trigger('launch');
	},

	/**
	 * Get the product urls of the features
	 */
	getProductUrls: function(features) {
		var productUrls = [];
		for (var i = 0; i < features.length; i++) {
			var f = features[i];
			var productUrl = Configuration.getMappedProperty(f, "productUrl", null);
			if (productUrl) {
				productUrls.push(productUrl);
			}
		}
		return productUrls;
	},

	/**
	 * Get the product sizes of the features
	 */
	getProductSizes: function(features) {
		var productSizes = [];
		for (var i = 0; i < features.length; i++) {
			var f = features[i];
			var productUrl = Configuration.getMappedProperty(f, "productUrl", null);
			var productSize = Configuration.getMappedProperty(f, "productSize", null);
			if (productUrl && productSize) {
				productSizes.push({productURL: productUrl, productSize: productSize});
			}
		}
		return productSizes;
	},
	/**
	 * The direct download uses the
	 *   OLD FORMAT: eor.eop_ProductInformation.eop_filename and not the feature.properties.productUrl
	 *	 NEW FORMAT: mapped "productUri" instead of "productUrl"
	 */
	getDirectDownloadProductUrl: function(feature) {
		return Configuration.getMappedProperty(feature, "productUri", "");
	},

	/**
	 * Check whether the given feature has a direct download url supported by a browser 
	 */
	isBrowserSupportedUrl: function(feature) {

		var downloadUrl = this.getDirectDownloadProductUrl(feature);
		if (downloadUrl.indexOf("http") != -1 || downloadUrl.indexOf("https") != -1) {
			return true;
		}
		return false;
	},

};

// Add events
_.extend(SearchResults, Backbone.Events);

// Listen to selected dataset to create the feature collection used to store the results
DataSetPopulation.on('select', function(dataset) {
	var datasetId = dataset.get('datasetId');
	if (!SearchResults.featureCollection.hasOwnProperty(datasetId)) {
		var fc = new FeatureCollection();
		// NGEO-2171: Use tag friendly id since datasetId can contain special characters as '/'
		fc.id = dataset.tagFriendlyId;
		fc.dataset = dataset;
		fc.viewAccess = DatasetAuthorizations.hasViewAccess(datasetId);
		fc.downloadAccess = DatasetAuthorizations.hasDownloadAccess(datasetId);
		SearchResults.featureCollection[datasetId] = fc;
		SearchResults.trigger('add:featureCollection', fc);
	}
});

// Listen to unselected dataset to remove the feature collection used to store the results
DataSetPopulation.on('unselect', function(dataset) {
	// If mode is correlation/interferometry, switch back to Simple
	if (DatasetSearch.get('mode') != "Simple") {
		DatasetSearch.set('mode', "Simple");
	} else {
		// Otherwise remove the dataset
		var datasetId = dataset.get('datasetId');

		if (SearchResults.featureCollection.hasOwnProperty(datasetId)) {
			SearchResults.featureCollection[datasetId].reset();
			SearchResults.trigger('remove:featureCollection', SearchResults.featureCollection[datasetId]);
			delete SearchResults.featureCollection[datasetId];
		}
	}
});

// Listen to search mode to take into acount correlation, interferometry search
DatasetSearch.on('change:mode', function(model, mode) {

	// Remove previous feature collection
	for (var id in SearchResults.featureCollection) {
		SearchResults.trigger('remove:featureCollection', SearchResults.featureCollection[id]);
		delete SearchResults.featureCollection[id];
	}

	switch (mode) {
		case "Simple":
			for (var datasetId in DataSetPopulation.selection) {
				var fc = new FeatureCollection();
				fc.id = datasetId;
				fc.dataset = DataSetPopulation.selection[datasetId];
				SearchResults.featureCollection[datasetId] = fc;
				SearchResults.trigger('add:featureCollection', fc);
			}
			break;
		case "Correlation":
		case "Interferometry":
			var fc = new FeatureCollection();
			fc.id = mode;
			SearchResults.featureCollection[fc.id] = fc;
			fc.countPerPage = 5;
			SearchResults.trigger('add:featureCollection', fc);
			break;
	}
});

module.exports = SearchResults;