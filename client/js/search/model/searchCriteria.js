var Configuration = require('configuration');
var SearchArea = require('search/model/searchArea');
var DownloadOptions = require('search/model/downloadOptions');
var DatasetPopulation = require('search/model/dataSetPopulation');

function pad(num, size) {
	var s = num + "";
	while (s.length < size) s = "0" + s;
	return s;
}

// Helper function to convert a string in ISO format to date
Date.fromISOString = function(str) {

	var reDate = /(\d+)-(\d+)-(\d+)(?:T(\d+):(\d+)(?::(\d+)(?:.(\d+))?)?Z)?/;
	var match = reDate.exec(str);
	if (match) {
		// Hack to support bad date
		if (match[1].length < match[3].length) {
			var tmp = match[1];
			match[1] = match[3];
			match[3] = tmp;
		}

		// Need to cut the original precision to only first 3 digits since UTC constructor accepts milliseconds only in range between 0-999
		// @see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/UTC
		if (match[7] && match.length > 3) {
			match[7] = match[7].substr(0, 3);
		}

		var date = new Date(Date.UTC(match[1], match[2] - 1, match[3], match[4] || 0, match[5] || 0, match[6] || 0, match[7] || 0));

		return date;
	} else {
		throw "Invalid ISO date";
	}
};

// Helper function to convert a date to an iso string, only the date part
Date.prototype.toISODateString = function() {
	return this.getUTCFullYear() + "-" + pad(this.getUTCMonth() + 1, 2) + "-" + pad(this.getUTCDate(), 2);
};

// A constant
var ONE_MONTH = 24 * 30 * 3600 * 1000;

/**
 * This backbone model holds the search criteria attributes
 * Used as a base class for DatasetSearch & StandingOrder
 */
var SearchCriteria = Backbone.Model.extend({

	// Defaults is a function in aim to not share among instances
	defaults: function() {
		return {
			stop: new Date(),
			start: new Date(new Date().getTime() - ONE_MONTH),
			useExtent: true,
			advancedAttributes: {},
			downloadOptions: {}
		}
	},

	/**	
	 * Constructor
	 */
	initialize: function() {
		// The search area
		this.searchArea = new SearchArea();

		// Automatically load the dataset when the datasetId is changed
		this.listenTo(DatasetPopulation, 'select', this.onDatasetSelectionChanged);
		this.listenTo(DatasetPopulation, 'unselect', this.onDatasetSelectionChanged);
	},

	/**
	 * Get the url without base url with all search criteria
	 */
	getOpenSearchParameters: function(datasetId) {

		//add area criteria if set
		var params = this.addGeoTemporalParams();

		//always add the advanced criteria values selected and already set to the model
		params = this.addAdvancedCriteria(params, datasetId);

		//add the download options values selected and already set to the model
		params = this.addDownloadOptions(params, datasetId);

		//console.log("DatasetSearch module : getCoreURL method : " + url);

		return params;
	},

	/**
	 * Get the shared search URL
	 */
	getSharedSearchURL: function() {

		var url = "#data-services-area/search/" + this.getDatasetPath() + '?';
		url += this.getOpenSearchParameters();
		return url;
	},

	/**
	 * Populate the model with the parameters retrieved from the Shared URL
	 */
	populateModelfromURL: function(query, datasetId) {

		// Enhance bad queries case
		if ( query.charAt(0) == "?" || query.charAt(0) == "&" ) {
			query = query.substr(1);
		}

		var vars = query.split("&");

		// Force useExtent to false to avoid bug when setting the geometry
	    this.set('useExtent', false);

		for (var i = 0; i < vars.length; i++) {

			var pair = vars[i].split("=");
			if (pair.length != 2)
				throw "Invalid OpenSearch URL : parameter " + vars[i] + "not correctly defined."

			var key = pair[0];
	    	var value = pair[1];

			switch (key) {
				case "bbox":
					var coords = value.split(",");
					if (coords.length != 4)
						throw "Invalid OpenSearch URL : bbox parameter is not correct."
					this.searchArea.setBBox({
						west: parseFloat(coords[0]),
						south: parseFloat(coords[1]),
						east: parseFloat(coords[2]),
						north: parseFloat(coords[3])
					});
					break;
				case "geom":
					// TODO : check polygon is correct
					this.searchArea.setFromWKT(value);
					break;
				case "start":
					try {
						this.set('start', Date.fromISOString(value));
					} catch (err) {
						throw "Invalid OpenSearch URL : start parameter is not correct."
					}
					break;
				case "stop":
					try {
						this.set('stop', Date.fromISOString(value));
					} catch (err) {
						throw "Invalid OpenSearch URL : stop parameter is not correct."
					}
					break;

				case "ngEO_DO":
					var don = value.substr(1, value.length-2);

					// Use this regex to avoid splitting crop product
					// which has multiple "," in it
					var commaNotBetweenParenthesisRe = new RegExp(/,(?!\(?[^()]*\))/);
					parameters = don.split(commaNotBetweenParenthesisRe);

					var downloadOptions = this.get('downloadOptions')[datasetId];
					for ( var n = 0; n < parameters.length; n++ ) {
						var p = parameters[n].split(':');
						if (p.length != 2) 
							throw "Invalid OpenSearch URL : download option parameter " + parameters[n] + "not correctly defined."

						downloadOptions.setValue(p[0], (p[0] == "cropProduct" ? true : p[1]));
					}
					// Force triggering since there is no set of 'downloadOptions'
					this.trigger("change:downloadOptions");
					break;


				default:
					if ( this.has(key) ) {
						// Interferometry parameters are stored directly on a model
						this.set(key, value);
					} else {
						// Check if Advanced attributes
						var advancedAttributes = this.get('advancedAttributes')[datasetId];
						var attributeToDefine = _.findWhere(advancedAttributes, {id: key});
						// Set parameter if it exists in advanced attribute of the given dataset
						// skip any other parameter
						if ( attributeToDefine ) {
							attributeToDefine.value = value;
							// Force triggering since object doesn't do it automatically
							this.trigger('change:advancedAttributes');
						}
					}
					break;
			}
		}

		// Manual trigger of a change:searchArea event because SearchArea is not (yet?) a Backbone model
		this.trigger('change:searchArea');

	},

	// Add date WITHOUT cf ngeo 368 time and area parameters
	addGeoTemporalParams: function() {

		var params = "start=" + this.get("start").toISOString() + "&" +
			"stop=" + this.get("stop").toISOString();

		var searchAreaParam = this.searchArea.getOpenSearchParameter(Configuration.get("search.geometryPrecision", 2));
		//if user has no search area parameter (for exmaple, in polygon mode, there are no area defined by user)
		//then do not provide search area criterion (issue NGEO-1723/NGEO-1394))		
		if (searchAreaParam)
			params += "&" + searchAreaParam

		//console.log("DatasetSearch module : addGeoTemporalParams : " + url);
		return params;
	},

	// Add advanced criteria to the given url
	addAdvancedCriteria: function(url, datasetId) {

		var self = this;
		// Get the advanced attributes corresponding to the datasetId
		// And append only the modified values(which contain "value" attribute)
		var advancedAttributes = this.get('advancedAttributes')[datasetId];
		if (advancedAttributes) {

			var values = [];
			_.each(advancedAttributes, function(attribute) {
				// Check if the avanced attribute has a value in the DatasetSearch
				if ( attribute.value ) {
					values.push( attribute.id + '=' + attribute.value );
				}
			});

			if ( values.length ) {
				// if ( url.indexOf("?") >= 0 ) {
		        	url += "&";
				// } else {
				// 	url += "?";
				// }
				url += values.join("&");
		    }
		}

		//console.log("DatasetSearch module : addAdvancedCriteria : " + url);
		return url;
	},

	/**
	 * In case there are selected download options : 
	 * 		add download options to the given url by appending "&ngEO_DO={param_1:value_1,...,param_n:value_n} 
	 * 		to the url and returns the modified url.
	 * otherwise : do not append "&ngEO_DO={} to the url 
	 */
	addDownloadOptions: function(url, datasetId) {

		var self = this;

		// Add the selected download options to the opensearch url
		var downloadOptionsStr = null;

		var downloadOptions = this.get('downloadOptions')[datasetId];
		if ( downloadOptions ) {
			var doUrl = downloadOptions.getAsUrlParameters();
			if ( doUrl ) {
				// if ( url.indexOf("?") >= 0 ) {
		        	url += "&";
				// } else {
				// 	url += "?";
				// }
				url += doUrl;
			}
		}
		//console.log("DatasetSearch module : addDownloadOptionsWithProductURIConvention : " + url);
		return url;
	},


	/**
	 * Get the selected download options as a json object.
	 * If the download options have been changed by the user, their are set as an attribute to the DatasetSearch
	 * otherwise the default value is got from the dataset.
	 */
	getSelectedDownloadOptions: function(dataset) {

		var selectedOptions = {};
		var datasetId = dataset.get("datasetId");
		var downloadOptions = this.get('downloadOptions')[datasetId];
		if ( downloadOptions ) {
			selectedOptions = downloadOptions.attributes;
		}
		return selectedOptions;
	},

	/**
	 *	Update advanced attributes & download options depending on dataset that has been changed
	 *	Overrided by DatasetSearch & StandingOrder objects
	 */
	onDatasetSelectionChanged : function(dataset) {

		var datasetId = dataset.get("datasetId");
		//console.log(datasetId + " : changed");
		if ( this.get("advancedAttributes")[datasetId] ) {
			// Already exists --> remove it
			delete this.get("advancedAttributes")[datasetId];
			delete this.get("downloadOptions")[datasetId];
		} else {
			this.get("advancedAttributes")[datasetId] = _.map(dataset.get("attributes"), _.clone);
			this.get('downloadOptions')[datasetId] = new DownloadOptions(dataset.get("downloadOptions"), {init: true});
		}
	}

});

module.exports = SearchCriteria;