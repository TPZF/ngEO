  
define( ['jquery', 'backbone', 'configuration', 'search/model/dataset'], 
		function($, Backbone, Configuration, Dataset) {

var DataSetSearch = Backbone.Model.extend({
	
	defaults:{
		datasetId : "",
		startdate : "", //name of the opensearch request parameter
		stopdate: "", //name of the opensearch request parameter
		startTime : "",
		stopTime: "", 
		west: "",
		south : "",
		east : "",
		north : "",
		useExtent : true,
		selectedDownloadOptions : {}, // the selected download options as json object 
									//{downloadoption1 : value , downloadoption2 : value 2, ....downloadoption : value n}
		criteria : ""//TODO later add the advanced criteria 
		
	},
	
	initialize : function() {
		// Initialize date/time with today
		var today = (new Date()).toISOString();
		//set start and stop dates/times to today
		this.setDateAndTime(today, today); 
		//no dataset is selected
		this.dataset = undefined;
	},
	
	/** load the information for the selected dataset from the server 
	 * unless if no dataset is selected set the dataset to undefined */
	updateDatasetModel : function(){
		
		//Retrieve the dataset information from the server
		if (this.get("datasetId")){
			
			this.dataset = new Dataset({datasetId : this.get("datasetId")});			
			var self = this;
			this.dataset.fetch({
				
				success: function(model, response, options) {
					//update dates/times from dataset dates/times
					self.setDateAndTime(model.attributes.datasetSearchInfo.startDate, model.attributes.datasetSearchInfo.endDate); 
					self.trigger('datasetLoaded');
					//TODO set the selected options default value from the dataset download options
				},
				
				error: function(model, xhr, options) {
					console.log(model);
					//model.trigger('datasetLoaded');
					//TODO set the selected options default value from the dataset download options
				}
			});
	
		}else{
			this.dataset = undefined;
		}
		
	},
	  
	getOpenSearchURL : function(){
	
		//TODO add advanced search criteria later
		var url = Configuration.baseServerUrl + "/catalogueSearch/"+ this.get("datasetId") + "?" +
				"start="+ this.formatDate(this.get("startdate"), this.get("startTime")) + "&" + 
				"stop=" + this.formatDate(this.get("stopdate"), this.get("stopTime")) + "&count=10";
		
		//add area criteria is set
		if (this.get("west") != "" && this.get("south") != ""
			&& this.get("east") != "" && this.get("north") != ""){
		
			var url = url  +  "&" + 
			"bbox=" + this.get("west") + "," + this.get("south") + "," 
			+ this.get("east") + "," + this.get("north");
		}
		
		//console.log("DatasetSearch module : getOpenSearchURL method : " + url);
		
		return url;
	},
	
	/** split a given date/time into date and time for start and stop dates & times*/
	setDateAndTime : function(startDate, stopDate){
		
		//set start date and time
		var dateOnly = startDate.substring(0, startDate.indexOf('T'));
		var timeOnly = startDate.substring(startDate.indexOf('T')+1, startDate.lastIndexOf(':'));
		
		this.set("startdate",dateOnly);
		this.set("startTime",timeOnly);
		
		if (startDate != stopDate){
			dateOnly = stopDate.substring(0, stopDate.indexOf('T'));
			timeOnly = stopDate.substring(stopDate.indexOf('T')+1, stopDate.lastIndexOf(':'));
			this.set("stopdate",dateOnly);
			this.set("stopTime",timeOnly);
		}
		
		//set stop date and time
		this.set("stopdate",dateOnly);
		this.set("stopTime",timeOnly);
		
	},
	
	//Format to openSearch compliant date format : 
	//the seconds are added manually since not handled by the TimeBox widget
	//to confirm later whether to use another widget...
	//TODO CONFIRM TIME FORMAT
	formatDate : function(date, time){
		return date + "T" + time + ":00.00Z"; 
	},
	  
	/** get the seach criteria to display as a txt pop-up in the searchresults view */
	getSearchCriteriaSummary : function(){

		var text = '<p><b>DataSet : </b>' + this.get("datasetId") + '</p> '
		
		text += '<b>Start date : </b> '+ this.formatDate(this.get("startdate"), this.get("startTime")) + '</p>' +
			'<b>Stop date : </b> ' + this.formatDate(this.get("stopdate"), this.get("endTime")) + '</p> ';
			
		if (this.get("west") != '' && this.get("south") != '' &&
				this.get("east") != '' && this.get("north") != ''){
			
			text += '<p><b>Area:</b> ' + 
			 '<p><b>West : </b>' + this.get("west") +'</p> ' +
			 '<p><b>South : </b>' + this.get("south") +'</p> ' +
			 '<p><b>East : </b>' + this.get("east") +'</p> ' +
			 '<p><b>North : </b>' + this.get("north") + '</p> ';
		}
		return text;
	}
});

return new DataSetSearch();

});