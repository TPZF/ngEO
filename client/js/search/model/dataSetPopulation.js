/**
  * Datasets population model 
  * Handled transparently the criteria received from the server.
  * Filters the daatsets according the regex created from the criteria
  */

  
define( ['jquery', 'backbone', 'configuration'], function($, Backbone, Configuration) {

var DataSetPopulation = Backbone.Model.extend({
	
	defaults:{
		criteria : [], //table of criteria each element is a json {"criterionName": "", "indexInRow" : index, "values" : [{"value" : ""}] }
					  //"criterionName" is the name of the criterion received from the server
					  //"indexInRow" is the index of the criterion within the criteria table "criteriaTitles" received 
					  //"values" is table of the values got from the matrix values received from the server.
		datasets : [], // the datsets without filtring
		matrixStr : "", //the whole string created from the received values matrix
		datasetsToDisplay : [] //the datasets filtred according to a given expression
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
		
		//create datasets as a table of json object {"datsetId" : id, "itemsCount" : itemsCount}
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
			
			//create the matrix as a one long string: each table row is transformed into a commar-separated string
			//wrapped with "" in order to keep a row isolated into the whole matrix
			matrixStr = matrixStr.concat('"' + row.join() + '"');
			
			//the first row for a dataset is supposed to be the one with no filters
			if (treatedDatasets.indexOf(row[row.length-2]) == -1){
				treatedDatasets.push(row[row.length-2]);
				datasets.push({"datasetId": row[row.length-2], "itemsCount" : row[row.length-1]});
			}
			
		});

		console.log("datasets :");
		console.log(datasets);
		console.log("the matrix to set : ");
		console.log(matrixStr);	
		
		this.set({"datasetsToDisplay" : datasets}, {silent: true});
	
		return {"criteria" : criteria, "matrixStr" : matrixStr, "datasets" : datasets, "datasetsToDisplay" : datasets};
	},
	
	

	filter : function (selectedValues){
		
		var filterExp = new RegExp(selectedValues, "g");
		console.log("reg exp :");
		console.log(filterExp);
		//the match function returns an array of strings having this form:
		//"(criteria_1,criteria_2,...., criteria_n,dataset_id,itemsCount"
		var filtredStrings = this.get("matrixStr").match(filterExp);
		console.log("filtredStrings");
		console.log(filtredStrings);
		
		var datasetsToDisplay = [];
		var treatedDatasets = [];
		
		//iterate on the table of the matched strings.
		//for each string split the commar-separated string into and array 
		//in order to access the dateset id and the items count values.
		//the dateset id and the items count values are respectively the two last items in the table 
		
		_.each(filtredStrings, function(string){
			var row = string.split(",");
			//avoid adding the same dataset id to the final filtered table
			//by keeping the track of already processed dataset ids
			if (treatedDatasets.indexOf(row[row.length-2]) == -1){
				treatedDatasets.push(row[row.length-2]);
				//
				datasetsToDisplay.push({"datasetId" : row[row.length-2], "itemsCount" : row[row.length-1].substring(0, row[row.length-1].length)});
			}
		});
			
		console.log(datasetsToDisplay);

		this.set({"datasetsToDisplay" : datasetsToDisplay}, {silent: true});
	
	},

});

return DataSetPopulation;

});