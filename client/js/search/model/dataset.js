var Configuration = require('configuration');

var _ReservedNames = ['start', 'stop', 'geom', 'bbox', 'id', 'lat', 'lon', 'radius', 'rel', 'loc'];

var Dataset = Backbone.Model.extend({

	// Dataset attributes
	defaults: {
		description: "",
		keywords: null,
		downloadOptions: [],
		attributes: null,
		datasetId: "",
		startDate: null,
		endDate: null,
		validityEndDate: null,
		startIndex: 1,
		countPerPage: null
	},

	initialize: function () {
		// The base url to retreive the dataset Search Info
		this.url = Configuration.baseServerUrl + '/datasetSearchInfo/' + this.get('datasetId');
		this.listenTo(this, "error", this.onError);

		// NGEO-2171: datasetId can possibly have special characters so to use it as #id we need to remove them
		this.tagFriendlyId = this.get("datasetId").replace(/\W/g, '_'); // Used in HTML tag-id generation
	},

	/** 
	 * Call when the model cannot be fetched from the server
	 */
	onError: function (model, response) {
		if (response.status == 0) {
			location.reload();
		}
	},

	/**
	 * Check if the keywords exists
	 */
	hasKeyword: function (val) {
		return this.get('keywords').indexOf(val) >= 0;
	},

	/**
	 * Parse the response from server
	 */
	parse: function (response, options) {
		var resp = {};
		if (response.datasetSearchInfo) {
			resp.description = response.datasetSearchInfo.description;
			if (_.isArray(response.datasetSearchInfo.downloadOptions)) {
				// Remove reserved names
				resp.downloadOptions = _.reject(response.datasetSearchInfo.downloadOptions, function (o) {
					return _.contains(_ReservedNames, o.argumentName);
				});
			}
			if (_.isArray(response.datasetSearchInfo.attributes)) {
				// Remove reserved names
				resp.attributes = _.reject(response.datasetSearchInfo.attributes, function (a) {
					return _.contains(_ReservedNames, a.id);
				});
			}
			if (_.isArray(response.datasetSearchInfo.keywords)) {
				// 'Flattenize' the keyword array
				resp.keywords = _.pluck(response.datasetSearchInfo.keywords, 'keyword');
			}

			// Set the start/end date for the dataset, ensure there is always a valid time extent
			if (response.datasetSearchInfo.endDate) {
				resp.endDate = Date.fromISOString(response.datasetSearchInfo.endDate);
			} else {
				resp.endDate = new Date();
			}
			if (response.datasetSearchInfo.startDate) {
				resp.startDate = Date.fromISOString(response.datasetSearchInfo.startDate);
			} else {
				resp.startDate = new Date(resp.endDate.getTime());
				resp.startDate.setUTCFullYear(resp.endDate.getUTCFullYear() - 10);
			}

			if (response.datasetSearchInfo.validityEndDate) {
				resp.validityEndDate = Date.fromISOString(response.datasetSearchInfo.validityEndDate);
			} else {
				resp.validityEndDate = new Date(resp.endDate.getTime());
				resp.validityEndDate.setUTCFullYear(resp.endDate.getUTCFullYear() + 5);
			}

			if (response.datasetSearchInfo.hasOwnProperty('startIndex')) {
				resp.startIndex = response.datasetSearchInfo.startIndex;
			}

			if (response.datasetSearchInfo.hasOwnProperty('countPerPage')) {
				resp.countPerPage = response.datasetSearchInfo.countPerPage;
			}
		}
		return resp;
	}

});

module.exports = Dataset;