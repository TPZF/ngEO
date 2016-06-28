var Configuration = require('configuration');
var DataSet = require('search/model/dataset');
var DataSetAuthorizations = require('search/model/datasetAuthorizations');

/**
 * Function to match a row from the matrix with the given filter
 */
var matchRow = function(filter, row) {
	for (var i = 0; i < filter.length; i++) {
		if (filter[i] && filter[i] != row[i]) {
			return false;
		}
	}
	return true;
};

/**
 * Small criteria structure
 */
var Criteria = function(name) {
	this.title = name;
	this.selectedValue = "";
	this.possibleValues = [];
};

Criteria.prototype.addValue = function(value) {
	if (value != '' && !_.contains(this.possibleValues, value)) {
		this.possibleValues.push(value);
	}
};

/**
 * Dataset population model 
 * Handled transparently the criteria received from the server.
 * Filters the datasets according to a criteria list
 */
var DataSetPopulation = Backbone.Model.extend({

	defaults: {
		criterias: null,
		matrix: null
	},

	// Constructor : initialize the url from the configuration
	initialize: function() {
		// The base url to retreive the datasets population matrix
		this.url = Configuration.baseServerUrl + '/datasetPopulationMatrix';
		this.selection = {};
		this.cache = {};
		this._usableForInterferomtry = {};
	},

	/**
	 * Fetch dataset
	 * Use a cache
	 */
	fetchDataset: function(datasetId, callback) {
		if (this.cache.hasOwnProperty(datasetId)) {
			if (callback) {
				callback(this.cache[datasetId]);
			}
		} else {
			var self = this;
			var dataset = new DataSet({
				datasetId: datasetId
			});
			dataset.fetch({
				success: function(model) {
					self.cache[datasetId] = model;
					callback(model);
				},
				error: function() {
					self.trigger('datasetFetch', datasetId, "ERROR");
				}
			});
		}
	},

	/**
	 * Select a dataset
	 */
	select: function(datasetId) {
		if (!this.selection.hasOwnProperty(datasetId)) {
			var self = this;
			this.fetchDataset(datasetId, function(model) {
				self.selection[datasetId] = model;
				self.trigger('select', model);
				self.trigger('datasetFetch', model, "SUCCESS");
			});
		}
	},

	/**
	 * Select exclusively a dataset
	 */
	selectExclusive: function(datasetId) {
		var prevSelection = this.selection;
		this.selection = {};
		for (var x in prevSelection) {
			this.trigger('unselect', prevSelection[x]);
		}
		this.select(datasetId);
	},

	/**
	 * Unselect a dataset
	 */
	unselect: function(datasetId) {
		if (this.selection.hasOwnProperty(datasetId)) {
			var dataset = this.selection[datasetId];
			delete this.selection[datasetId];
			this.trigger('unselect', dataset);
		}
	},

	/**
	 * Check if a dataset is usable by interferomretry
	 * See NGEOD-434
	 */
	usableForInterferometry: function(datasetId) {
		return this._usableForInterferomtry[datasetId];
	},

	/** 
	 * Parse the response from the server
	 * Row example: [ "", "", "Friendly ATS_TOA_1P", "", "false", "ATS_TOA_1P", "100" ],
	 *				[ criteria1, criteria2, ..., criteriaN, id, count ]
	 * Parse methode find special "name" criteria in response and put it in the end if exists
	 */
	parse: function(response) {

		var matrix = response.datasetpopulationmatrix.datasetPopulationValues;
		var criteriaTitles = response.datasetpopulationmatrix.criteriaTitles;
		var criterias = [];
		
		// See NGEOD-434
		// usableForInterferometry is stored in the criteria titles
		var usableForInterferomtryIndex = criteriaTitles.indexOf('usableForInterferometry');
		if (usableForInterferomtryIndex >= 0) {
			for (var n = 0; n < matrix.length; n++) {
				var row = matrix[n];
				this._usableForInterferomtry[row[row.length - 2]] = row[usableForInterferomtryIndex] == "true";
			}
		}
		
		// Special treatment for name : remove it as a criteria and push it at end in the matrix
		// <!> Modifies criteriaTitles length so must be executed after usableForInterferometry detection <!>
		var nameIndex = criteriaTitles.indexOf('name');
		if (nameIndex >= 0) {
			criteriaTitles.splice(nameIndex, 1);
			for (var n = 0; n < matrix.length; n++) {
				var row = matrix[n];
				row.push(row[nameIndex]);
				row.splice(nameIndex, 1);
			}
		}

		// Object which contains rows/keyword information to be able to filter dataset by criterias
		this.datasetInfoMap = {};

		// NGEO-2160 : Criterias are now build from "keyword" values
		this.keywordIndex = response.datasetpopulationmatrix.criteriaTitles.indexOf("keyword");
		for ( var i = 0; i < matrix.length; i++ ) {
			var datasetId = matrix[i][criteriaTitles.length];
			if ( !this.datasetInfoMap[datasetId] ) {
				this.datasetInfoMap[datasetId] = {
					rows: [],
					keywords: {}
				}
			}
			this.datasetInfoMap[datasetId].rows.push(matrix[i]);

			var keyword = matrix[i][this.keywordIndex].split(":"); // GROUP:VALUE
			// Continue if empty
			if ( keyword.length != 2 )
				continue;

			var criteria = _.findWhere(criterias, { "title": keyword[0] });
			if ( !criteria ) {
				criteria = new Criteria(keyword[0]);
				criterias.push(criteria);
			}
			criteria.addValue(keyword[1]);
			// Store group:value as a dictionary in datasetInfoMap
			this.datasetInfoMap[datasetId].keywords[keyword[0]] = keyword[1];
		}

		return {
			criterias: criterias,
			matrix: matrix
		};
	},

	/**
	 *	Extract criteria values for the given datasets with the given criteria key
	 */
	filterCriteriaValues: function(datasets, criteria) {
		var criteriaValues = [];

		for ( var i = 0; i<datasets.length; i++ ) {
			var dataset = this.datasetInfoMap[datasets[i].datasetId];
			for ( var group in dataset.keywords ) {
				var value = dataset.keywords[group];
				if ( group == criteria.title && (criteria.selectedValue == '' || criteria.selectedValue == value) && !_.contains(criteriaValues, value) ) {
					criteriaValues.push(value);
				}
			}
		}
		return criteriaValues;
	},

	/**
	 *	Get user-friendly name for the given datasetId
	 */
	getFriendlyName: function(datasetId) {
		var idIndex = this.get('criterias').length;
		var nameIndex = this.get('criterias').length + 2;

		var datasetRow = _.find(this.get('matrix'), function(row) { return row[idIndex] == datasetId } )
		return datasetRow[nameIndex] ? datasetRow[nameIndex] : datasetRow[idIndex];
	},

	/**
	 * Return the datasets filtered by the given filter
	 */
	filterDatasets: function(criteriaFilter) {

		var filteredDatasets = [];
		var treatedDatasets = {};

		// Keep the id and count index for the dataset population row
		var id_index = this.get('criterias').length;
		var count_index = this.get('criterias').length + 1;
		var name_index = this.get('criterias').length + 2;

		// Process all grouped datasets
		for ( var datasetId in this.datasetInfoMap ) {

			var datasetInfos = this.datasetInfoMap[datasetId];
			var passedFilter = true;

			var selectedCriterias = _.filter(this.get('criterias'), function(o) { return o.selectedValue });
			if ( selectedCriterias.length ) {

				var row = datasetInfos.rows[0];
				// Need filter all the datasets
				for ( var i=0; i<selectedCriterias.length; i++ ) {
					var criteria = selectedCriterias[i];
					passedFilter &= _.contains(datasetInfos.keywords, criteria.selectedValue);
				}
			}

			if (passedFilter) {
				var row = datasetInfos.rows[0];
				// No need to filter take all the datasets
				filteredDatasets.push({
					datasetId: datasetId,
					tagFriendlyId: datasetId.replace(/\W/g,'_'),
					name: name_index < row.length ? row[name_index] : datasetId,
					itemsCount: row[count_index]
				})
			}
		}

		return filteredDatasets;
	},

});

module.exports = new DataSetPopulation();