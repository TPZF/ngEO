

  
define( ['jquery', 'backbone', 'configuration', 'search/model/dataset', 'search/model/datasetAuthorizations'], function($, Backbone, Configuration, DataSet, DataSetAuthorizations) {

/**
 * Function to match a row from the matrix with the given filter
 */
var matchRow = function( filter, row )  {
	for ( var i = 0; i < filter.length; i++ ) {
		if ( filter[i] && filter[i] != row[i] ) {
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
	this.possibleValues = [];
};

Criteria.prototype.addValue = function(value) {
	if ( value != '' && !_.contains(this.possibleValues,value) ) {
		this.possibleValues.push(value);
	}
};

/**
  * Datasets population model 
  * Handled transparently the criteria received from the server.
  * Filters the datasets according to a criteria list
  */
var DataSetPopulation = Backbone.Model.extend({
	
	defaults:{
		criterias : null,
		matrix: null
	},
	
	// Constructor : initialize the url from the configuration
	initialize : function () {
		// The base url to retreive the datasets population matrix
		this.url = Configuration.baseServerUrl + '/datasetPopulationMatrix';
		this.selection = {};
		this.cache = {};
	},
	
	/**
	 * Fetch dataset
	 * Use a cache
	 */
	fetchDataset: function(datasetId,callback) {
		if ( this.cache.hasOwnProperty(datasetId) ) {
			if (callback) {
				callback( this.cache[datasetId] );
			}	
		} else {
			var self = this;
			var dataset = new DataSet({datasetId : datasetId});		
			dataset.fetch({
				success: function(model) {
					self.cache[datasetId] = model;
					callback(model);
				},
				error: function() {
					self.trigger('datasetFetch',datasetId,"ERROR");
				}
			});
			
			
		}
	},
	
	/**
	 * Select a dataset
	 */
	select : function(datasetId) {
		if (!this.selection.hasOwnProperty(datasetId)) {
			var self = this;
			this.fetchDataset(datasetId,function(model) {
					self.selection[datasetId] = model;
					self.trigger('select',model);
					self.trigger('datasetFetch',model,"SUCCESS");
				});
		}
	},
	
	/**
	 * Select exclusively a dataset
	 */
	selectExclusive : function(datasetId) {
		var prevSelection = this.selection;
		this.selection = {};
		for ( var x in prevSelection ) {
			this.trigger('unselect',prevSelection[x]);
		}
		this.select( datasetId );
	},	
	
	/**
	 * Unselect a dataset
	 */
	unselect : function(datasetId) {
		if (this.selection.hasOwnProperty(datasetId)) {
			var dataset = this.selection[datasetId];
			delete this.selection[datasetId];
			this.trigger('unselect',dataset);
		}
	},
	
	/** 
	 * Parse the response from the server
	 */
	parse: function(response){
				
		var matrix = response.datasetpopulationmatrix.datasetPopulationValues;
		var criteriaTitles = response.datasetpopulationmatrix.criteriaTitles;
		var criterias = [];
		
		// Special treatment for name : remove it as a criteria and push it at end in the matrix
		var nameIndex = criteriaTitles.indexOf('name');
		if ( nameIndex >= 0 ) {
			criteriaTitles.splice( nameIndex, 1 );
			for ( var n = 0; n < matrix.length; n++ ) {
				var row = matrix[n];
				row.push( row[nameIndex] );
				row.splice( nameIndex, 1 );
			}
		}
		
		// Build the criterias
		for ( var i = 0; i < criteriaTitles.length; i++ ) {
			var criteria = new Criteria(criteriaTitles[i]);
			for ( var n = 0; n < matrix.length; n++ ) {
				criteria.addValue( matrix[n][i] );
			}
			criterias.push( criteria );
		}
	
		return { 
			criterias: criterias,
			matrix: matrix
		};
	},	
	
	/**
	 * Return the criteria values filtered by the given filter for the given criteria index
	 */
	filterCriteriaValues : function( criteriaFilter, index ) {
	
		var criteriaValues = [];
		
		// Remove the criteria from the filter
		var backupFilter = criteriaFilter[index];
		criteriaFilter[index] = undefined;
		
		// Process all rows of the dataset population matrix
		for ( var i = 0; i < this.get('matrix').length; i++ ) {
			var row = this.get('matrix')[i];	
			if ( row[index] != '' && matchRow(criteriaFilter, row) ) {
				if ( !_.contains(criteriaValues,row[index]) ) {
					criteriaValues.push( row[index] );
				}									
			}
		}
		
		// restore the criteria filter
		criteriaFilter[index] = backupFilter;
		
		return criteriaValues;
	},

	/**
	 * Return the datasets filtered by the given filter
	 */
	filterDatasets : function ( criteriaFilter ) {
	
		var filteredDatasets = [];
		var treatedDatasets = {};
		
		// Keep the id and count index for the dataset population row
		var id_index = this.get('criterias').length;
		var count_index = this.get('criterias').length + 1;
		var name_index = this.get('criterias').length + 2;
		
		// Process all rows of the dataset population matrix
		for ( var i = 0; i < this.get('matrix').length; i++ ) {
			var row = this.get('matrix')[i];
			var datasetId = row[id_index];
			
			if ( matchRow(criteriaFilter, row) ) {
				
				if ( !treatedDatasets.hasOwnProperty(datasetId) ) {
				
					// Check authorization
					if ( DataSetAuthorizations.hasSearchAccess(datasetId) ) {
						filteredDatasets.push({
							datasetId : datasetId,
							name : name_index < row.length ? row[name_index] : datasetId,
							itemsCount : row[count_index]
						});
					}
					
					treatedDatasets[ datasetId ] = true;
				}
					
			}
		}
			
		return filteredDatasets;
	},

});

return new DataSetPopulation();

});