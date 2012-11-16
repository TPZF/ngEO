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
		missions : [{"mission" : "None"}],
		sensors :  [{"sensor" : "None"}],
		keywords : [{"keyword" : "None"}],
		datasets : [],
		datasetsToDisplay : [],
		datasetsFiltredWithMissions : [],
		datasetsFiltredWithSensors : [],
		datasetsFiltredWithKeywords : [],
		
	},
	
	// Constructor : initialize the url from the configuration
	initialize : function () {
		// The base url to retreive the datasets population matrix
		this.url = Configuration.baseServerUrl + '/datasetPopulationMatrix';
	},

	parse: function(response){
		
		var columns = response.datasetPopulationMatrix.criteriaTitles;
		var valuesTab = response.datasetPopulationMatrix.datasetPopulationValues;
		
		this.matrix = valuesTab;
		
		//create criteria as a table of json objects
		var criteria = [];
		_.each(columns, function(column){
			criteria.push({"criterionName" : column}); 
		});

		var missions = [{"mission" : "None"}];	
		var treatedMissions = [];
		var sensors = [{"sensor" : "None"}];	
		var treatedSensors = [];
		var keywords= [{"keyword" : "None"}];	
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
		
/*		console.log("created missions as json : ");  
		console.log("missions :: " +  missions);
		
		console.log("created sensors as json : ");  
		console.log("sensors :: " +  sensors);

		console.log("created keywords as json : ");  
		console.log("keywords :: " +  keywords);*/
		
		//create datasets as a table of json objects
		var datasets = [];
		var datasetKeys = [];
		var treatedDatasets = [];
		var mission, sensor;
		var self = this;
		
		_.each(valuesTab, function(row){
			
			if (treatedDatasets.indexOf(row[3]) == -1){
		
				treatedDatasets.push(row[3]);
				
				mission = row[0];
				sensor = row[1];
				
				//create keywords table
				datasetKeys = [];
				
				_.each(valuesTab, function(rowIter){
					
					if (rowIter[3] == row[3] && !self.isIn(datasetKeys, {"keyword" : rowIter[2], "itemsCount":  rowIter[3]})) {
						if (mission == "" && rowIter[0] !=""){
							mission = rowIter[0];
						}
						if (sensor == "" && rowIter[1] !=""){
							sensor = rowIter[1];
						}
						if (rowIter[2] != ""){
							datasetKeys.push({"keyword" : rowIter[2], "itemsCount":  rowIter[4]});
						}
					}
				});
				
				datasets.push({"datasetId": row[3], "itemsCount": row[4], "mission" : mission, "sensor": sensor, "keywordCount": datasetKeys}); 
			}
		});
				
		//console.log("created datasets as json ");  
		console.log("datasets :: ");
		console.log(datasets);
		
		return {"criteria" : criteria, "missions" : missions, "sensors" : sensors, 
			"keywords": keywords, "datasets" : datasets, "datasetsToDisplay" : datasets};
	},
	
	isIn : function (json, array){
		_.each(array, function(elt){
			if (elt.keyword == json.keyword && elt.itemsCount == json.itemsCount){
				return true;
			}
		});
		return false;
	},

	updateDatasetsWithMission : function(mission){
		
		if (mission == 'None'){

			//TODO re-filter from the initial table with the sensor and keyword
			var self = this;
			this.set({"datasetsToDisplay" : self.get("datasets")}, {silent: true});
			return;
		}
		
		
		var datasetsToFilter = this.get("datasets");
		var datasetsToDisplay = [];
		_.each(datasetsToFilter, function(dataset){
			if(dataset.mission == mission){
				datasetsToDisplay.push(dataset);
			}
		});
		console.log(datasetsToDisplay);
		
		this.set({"datasetsFiltredWithMissions" : datasetsToDisplay}, {silent: true});
		this.set({"datasetsToDisplay" : datasetsToDisplay}, {silent: true});
	},
	

	updateDatasetsWithSensor : function (sensor){
		
		if (sensor == 'None'){
			//TODO re-filter from the initial table with the mission and keyword
			var self = this;
			this.set({"datasetsFiltredWithSensors" : self.get("datasetsFiltredWithMissions")}, {silent: true});
			this.set({"datasetsToDisplay" : self.get("datasetsFiltredWithMissions")}, {silent: true});
			return;
		}
		
		var datasetsToFilter = this.get("datasetsFiltredWithMissions");
		var datasetsToDisplay = [];
		_.each(datasetsToFilter, function(dataset){
			if(dataset.sensor == sensor){
				datasetsToDisplay.push(dataset);
			}
		});
		console.log(datasetsToDisplay);
		this.set({"datasetsFiltredWithSensors" : datasetsToDisplay}, {silent: true});
		this.set({"datasetsToDisplay" : datasetsToDisplay}, {silent: true});
	},
	

	updateDatasetsWithKeyword : function(keyword){
		
		if (keyword == 'None'){
			//re-filter from the initial table with the sensor and mission
			var self = this;
			this.set({"datasetsToDisplay" : self.get("datasetsFiltredWithSensors")}, {silent: true});
			return; 
		}
		
		var datasetsToFilter = this.get("datasetsFiltredWithSensors");
		var datasetsToDisplay = [];
		_.each(datasetsToFilter, function(dataset){
			_.each(dataset.keywordCount, function(keyCount){
				if (keyCount.keyword == keyword){
					datasetsToDisplay.push({
						"datasetId": dataset.datasetId, 
						"itemsCount": keyCount.itemsCount,
						"mission" : dataset.mission, 
						"sensor": dataset.sensor, 
						"keywordCount": dataset.keywordCount});
				}
			});	
		});
		
		console.log(datasetsToDisplay);
		//this.set({"datasetsFilredWithSensors" : datasetsToDisplay}, {silent: true});
		this.set({"datasetsToDisplay" : datasetsToDisplay}, {silent: true});
	}
	
	
});

return DataSetPopulation;

});