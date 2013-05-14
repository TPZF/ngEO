

  
define( ['jquery', 'backbone', 'configuration'], function($, Backbone, Configuration) {

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
		matrix: null,
	},
	
	// Constructor : initialize the url from the configuration
	initialize : function () {
		// The base url to retreive the datasets population matrix
		this.url = Configuration.baseServerUrl + '/datasetPopulationMatrix';
	},

	parse: function(response){
				
		var matrix = response.datasetpopulationmatrix.datasetPopulationValues;
		var criteriaTitles = response.datasetpopulationmatrix.criteriaTitles;
		var criterias = [];
		
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
		
		// Process all rows of the dataset population matrix
		for ( var i = 0; i < this.get('matrix').length; i++ ) {
			var row = this.get('matrix')[i];
			var datasetId = row[id_index];
			
			if ( matchRow(criteriaFilter, row) ) {
				
				if ( !treatedDatasets.hasOwnProperty(datasetId) ) {
					filteredDatasets.push({
						datasetId : datasetId, 
						itemsCount : row[count_index]
					});
					
					treatedDatasets[ datasetId ] = true;
				}
					
			}
		}
			
		return filteredDatasets;
	},

});

return DataSetPopulation;

});