var Configuration = require('configuration');
var SearchResults = require('searchResults/model/searchResults');
var DataAccessRequest = require('dataAccess/model/dataAccessRequest');
var ShopCartCollection = require('shopcart/model/shopcartCollection');

/**
 * This module deals with the creation and submission of simple data access requests 
 * It extends DataAccessRequest module
 */
var SimpleDataAccessRequest = {

	url: Configuration.baseServerUrl + "/simpleDataAccessRequests",

	name: "download",

	rejectedProductsNB: 0, //nb of products checked but not having a url 

	productURLs: [],

	productSizes: [],

	totalSize: 0,

	dataType: null,

	/**
	 * Reset specific parameters of a simple DAR
	 */
	resetRequest: function () {

		this.rejectedProductsNB = 0;
		this.productURLs = [];
		this.hostedProcessId = null;
		this.name = "download";
	},

	/**
	*	Get dataset included in request
	*/
	getDataType: function () {
		return this.dataType;
	},

	/**
	 * Get the current request to submit
	 */
	getRequest: function () {

		// The JSON to send to the server
		if (this.hostedProcessId) {
			this.url = Configuration.baseServerUrl + "/hostedProcessDataAccessRequests";
			var params = [];
			// Add hosted processing parameters
			for (var i = 0; i < this.productURLs.length; i++) {
				params.push({
					name: "productURL",
					value: this.productURLs[i]
				});
			}
			params = params.concat(this.parameters);

			var request = {
				hostedProcessDataAccessRequest: {
					requestStage: this.requestStage,
					hostedProcessId: this.hostedProcessId,
					downloadLocation: this.downloadLocation,
					parameter: params,
					name: this.name
				}
			};
		} else {
			this.url = Configuration.baseServerUrl + "/simpleDataAccessRequests";

			var request = {
				simpledataaccessrequest: {
					requestStage: this.requestStage,
					downloadLocation: this.downloadLocation,
					productURLs: [],
					name: this.name
				}
			};
			// Add create bulk order if needed
			if (this.createBulkOrder) {
				request.simpledataaccessrequest.createBulkOrder = true;
			}

			// Transform product URLs
			for (var i = 0; i < this.productURLs.length; i++) {
				var self = this;
				var _findExpectedSize = _.find(this.productSizes, function (item) {
					return item.productURL === self.productURLs[i];
				});
				var _expectedSize = "0";
				if (_findExpectedSize) {
					_expectedSize = _findExpectedSize.productSize;
				}
				request.simpledataaccessrequest.productURLs.push({
					productURL: this.productURLs[i],
					expectedSize: _expectedSize
				});
			}
		}

		//console.log(request);

		return request;
	},

	/** 
	 * Get message the display when a simple DAT creation is triggered
	 */
	getSpecificMessage: function () {

		/*		var collapsibleContent = "<h5>Selected Products : " + (this.productURLs.length + this.rejectedProductsNB) + "<h5>";
		   	
			 if (this.rejectedProductsNB == 0){
			   collapsibleContent += "<p>All the selected items have been included in the request.<p>";
			 }else{
			   collapsibleContent += "<p> " + this.rejectedProductsNB + " products are not included in the request since they do not have a url.";
			 }
		   	
			 return collapsibleContent; */

		if (this.productURLs.length == 1) {
			return "<p>One product is included in the request.</p>";
		} else {
			return "<p>" + this.productURLs.length + " products are included in the request.</p>";
		}
	},


	/** 
	 * Set the list of products for the DAR 
	 * if the file name is empty the product is rejected
	 */
	setProducts: function (products) {
		this.productURLs = SearchResults.getProductUrls(products);
		this.productSizes = SearchResults.getProductSizes(products);
		this.rejectedProductsNB = products.length - this.productURLs.length;
		// dataType = name of shopcart or catalog
		if (_.find(products, function (product) {
			return (typeof product.properties.shopcart_id !== 'undefined');
		})) {
			this.dataType = ShopCartCollection._current.get('name');
		} else {
			this.dataType = products[0].properties.originDatasetId;
		}
	},

	/**
	 * Check whether the request is valid or not
	 */
	isValid: function () {

		var dataAccessConfig = Configuration.localConfig.dataAccessRequestStatuses;

		// If request not valid when no download manager then display the specific message
		// the validate button is not disabled since when the user selects a download manager the request
		if (this.downloadLocation.DownloadManagerId == "") {
			this.serverResponse = dataAccessConfig.invalidDownloadManagersError;
			return false;
		}

		// Request not valid when no product urls set then display the specific message
		if (this.productURLs.length == 0) {
			this.serverResponse = Configuration.localConfig.simpleDataAccess.invalidProductURLsError;
			this.trigger('RequestNotValidEvent');
			return false;
		}

		// Initial request : nominal case
		if (this.step == 0 &&
			this.id == "" &&
			this.requestStage == dataAccessConfig.validationRequestStage) {
			return true;
		}

		// Second stage submission with and without bulk order
		if (this.step == 1 &&
			this.id != "" &&
			this.requestStage == dataAccessConfig.confirmationRequestStage) {
			return true;
		}

		// Disable the request validation if the request is not valid
		this.trigger('RequestNotValidEvent');

		return false;
	},

	/** 
	 * Specific simple DAR additional processing after validation request
	 */
	validationProcessing: function (dataAccessRequestStatus) {

		// Calculate the total download estimated size  
		this.totalSize = 0;
		var productStatuses = dataAccessRequestStatus.productStatuses;
		var aPromises = [];
		for (var i = 0; i < productStatuses.length; i++) {
			var _productSize = _.find(this.productSizes, function (item) {
				return item.productURL === productStatuses[i].productURL;
			});
			if (_productSize && _productSize.productSize) {
				var _expectedSize = _productSize.productSize;
				productStatuses[i].expectedSize = _expectedSize;
				this.totalSize += parseInt(_expectedSize);
			}
		}
	}
}

// Add DataAccessRequest methods to SimpleDataAccessRequest
_.extend(SimpleDataAccessRequest, DataAccessRequest);

module.exports = SimpleDataAccessRequest;