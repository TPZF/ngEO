  
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
	
	initialize : function(){
		//Retrieve the dataset information
		this.dataset = new Dataset({datasetId : this.get("datasetId")});			
		//TODO handle download options later
		//this.dataset.fetch().done(function(){
			//TODO set the selected options default value from the dataset download options
		//});
	},
	
	validate: function(attrs) {
	    if (attrs.stopdate < attrs.startdate) {
	      return "Date interval can't end before it starts";
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