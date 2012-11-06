/**
  * Datasets population model
  */
  
define( ['jquery', 'backbone'], function($, Backbone) {

var DataSetPopulation = Backbone.Model.extend({
	
	defaults:{
		criteria : [],
		missions : [],
		sensors :  [],
		keywords : [],
		datasets : [],
		datasetsToDisplay : []
	},
	
	// The base url to retreive the datasets population matrix
	initialize : function () {
		this.url = '../server/datasetPopulationMatrix';
	},

	parse: function(response){
		
		var columns = response.datasetPopulationMatrix.criteriaTitles;
		var valuesTab = response.datasetPopulationMatrix.datasetPopulationValues;
		
		//create criteria as a table of json objects
		var criteria = [];
		_.each(columns, function(column){
			criteria.push({"criterionName" : column}); 
		});

		var missions = [];	
		var treatedMissions = [];
		var sensors = [];	
		var treatedSensors = [];
		var keywords= [];	
		var treatedKeywords = [];
		
		_.each(valuesTab, function(row){
			
			//create missions
			//index of the json object is not correct so use of treatedMissions array
			//if (row[0] != "" && missions.indexOf({"mission" : row[0]}) == -1){
			if (row[0] != "" && treatedMissions.indexOf(row[0]) == -1){
				treatedMissions.push(row[0]);
				missions.push({"mission" : row[0]}); 
			}
			//create sensors
			if (row[1] != ""  && treatedSensors.indexOf(row[1]) == -1){
				treatedSensors.push(row[1]);
				sensors.push({"sensor" : row[1]}); 
			}
			//create keywords
			if (row[2] != ""  && treatedKeywords.indexOf(row[2]) == -1){
				treatedKeywords.push(row[2]);
				keywords.push({"keyword" : row[2]}); 
			}
			
		});
		
		console.log("created missions as json : ");  
		console.log("missions :: " +  missions);
		
		console.log("created sensors as json : ");  
		console.log("sensors :: " +  sensors);

		console.log("created keywords as json : ");  
		console.log("keywords :: " +  keywords);
		
		//create datasets as a table of json objects
		var datasets = [];
		var datasetKeys = [];
		var treatedDatasets = [];
		
		_.each(valuesTab, function(row){
			
			if (treatedDatasets.indexOf(row[3]) == -1){
		
				treatedDatasets.push(row[3]);
				
				//create keywords table
				datasetKeys = [];
				
				_.each(valuesTab, function(rowIter){
					
					if (rowIter[3] == row[3] && datasetKeys.indexOf({"keyword" : rowIter[2]}) != -1) {
						
						datasetKeys.push({"keyword" : rowIter[2], "itemsCount":  rowIter[3]});
					}
				});
				
				datasets.push({"mission" : row[0], "sensor": row[1], "keywordCount": datasetKeys, "datasetId": row[3], "itemsCount": row[4]}); 
			}
		});
				
		console.log("created datasets as json ");  
		console.log("datasets :: " +  datasets);
		
		return {"criteria" : criteria, "missions" : missions, "sensors" : sensors, 
			"keywords": keywords, "datasets" : datasets};
	},
	
	getDatasetsWithMission : function(datasetsToFilter, mission){
		var datasetsToDisplay = [];
		_.each(datasetsToFilter, function(dataset)){
			if(dataset.mission == mission){
				datasetsToDisplay.push(dataset);
			}
		}
		return datasetsToDisplay;
	},
	
	getDatasetsWithSensor : function (datasetsToFilter, sensor){
		var datasetsToDisplay = [];
		_.each(datasetsToFilter, function(dataset)){
			if(dataset.sensor == sensor){
				datasetsToDisplay.push(dataset);
			}
		}
		return datasetsToDisplay;
	},
	
	getDatasetsWithKeyword : function(datasetsToFilter, keyword){
		var datasetsToDisplay = [];
		_.each(datasetsToFilter, function(dataset)){
			_.each(dataset.keywordCount, function(keyCount)){
				if (keyCount.keyword == keyword){
					datasetsToDisplay.push({"mission" : dataset.mission, 
											"sensor": dataset.sensor, 
											"keywordCount": dataset.keywordCount, 
											"datasetId": dataset.datasetId, 
											"itemsCount": keyCount.itemsCount});
				}
				
			}
		}
		return datasetsToDisplay;
	}
	
	
});

return DataSetPopulation;

});