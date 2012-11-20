/**
  * Datasets population model
  * 
  * The data structure deals with native datasets;
  * TODO later : to be updated to handle logical/virtual datasets.
  */
  
define( ['jquery', 'backbone', 'configuration'], function($, Backbone, Configuration) {

var DataSetPopulation = Backbone.Model.extend({
	
	defaults:{
		criteria : [],
		datasets : [],
		matrixStr : "",
		datasetsToDisplay : []
	},
	
	// Constructor : initialize the url from the configuration
	initialize : function () {
		// The base url to retreive the datasets population matrix
		this.url = Configuration.baseServerUrl + '/datasetPopulationMatrix';
	},

	parse: function(response){
		
		var criteriaTitles = response.datasetPopulationMatrix.criteriaTitles;
		var valuesTab = response.datasetPopulationMatrix.datasetPopulationValues;
		var self = this;
		var matrixStr = "";
		
		//create criteria as a table of json objects
		var criteria = [];
		_.each(criteriaTitles, function(column, index){
			criteria.push({ "criterionName" : column, "indexInRow" : index, "values" : [{"value" : ""}] }); 
		});
		
		
		//create datasets as a table of json objects
		var datasets = [];
		var treatedCriterions = [];
		var treatedDatasets = [];
		
		_.each(valuesTab, function(row){		
			
			_.each(criteria, function(criterion){
				
				//index of the json object is not correct so use of treatedMissions array
				//if (row[0] != "" && missions.indexOf({"mission" : row[0]}) == -1){
				if (row[criterion.indexInRow] != '' && treatedCriterions.indexOf(row[criterion.indexInRow]) == -1){
					treatedCriterions.push(row[criterion.indexInRow]);
					criterion.values.push({"value" : row[criterion.indexInRow]}); 
				}
			});
			
			//create the matrix as string
			matrixStr = matrixStr.concat('"' + row.join() + '"');
			
			//the first row for a dataset is supposed to be the one with no filters
			if (treatedDatasets.indexOf(row[row.length-2]) == -1){
				treatedDatasets.push(row[row.length-2]);
				datasets.push({"datasetId": row[row.length-2], "itemsCount" : row[row.length-1]});
				
			}
			
		});
		//console.log("created datasets as json ");  
		console.log("datasets :: ");
		console.log(datasets);
		console.log("the matrix to set :: ");
		console.log(matrixStr);
		
		return {"criteria" : criteria, "matrixStr" : matrixStr, "datasets" : datasets, "datasetsToDisplay" : datasets};
	},
	
	

	filter : function (selectedValues){
		
		var filterExp = new RegExp(selectedValues, "g");
		console.log("reg exp :");
		console.log(filterExp);
		var filtredStrings = this.get("matrixStr").match(filterExp);
		console.log("filtredStrings");
		console.log(filtredStrings);
		
		var datasetsToDisplay = [];
		var treatedDatasets = [];
		
		_.each(filtredStrings, function(string){
			var row = string.split(",");
			//avoid adding the same dataset id to the final filtered table
			if (treatedDatasets.indexOf(row[row.length-2]) == -1){
				treatedDatasets.push(row[row.length-2]);
				datasetsToDisplay.push({"datasetId" : row[row.length-2], "itemsCount" : row[row.length-1].substring(0, row[row.length-1].length)});
			}
		});
			
		console.log(datasetsToDisplay);

		this.set({"datasetsToDisplay" : datasetsToDisplay}, {silent: true});
	
	},

});

return DataSetPopulation;

});