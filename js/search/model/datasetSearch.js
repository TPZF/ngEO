  
define( ['jquery', 'backbone', 'configuration', 'search/model/dataset'], 
		function($, Backbone, Configuration, Dataset) {

var DataSetSearch = Backbone.Model.extend({
	
	defaults:{
		datasetId : "",
		startdate : "", //name of the opensearch request parameter
		stopdate: "", //name of the opensearch request parameter
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
		this.dataset = new Dataset({id : this.get("datasetId")});			
		this.dataset.fetch().done(function(){
			//TODO set the selected options default value from the dataset download options
		});
	},
	
	validate: function(attrs) {
	    if (attrs.stopdate < attrs.startdate) {
	      return "Date interval can't end before it starts";
	    }   
	 },
	  
	getOpenSearchURL : function(){
	
		//TODO add advanced search criteria later
		var url = Configuration.baseServerUrl + "/catalogueSearch/"+ this.get("datasetId") + "?" +
				"start="+ this.get("startdate") + "&" + 
				"stop=" + this.get("stopdate") + "&count=10";
		
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
	  
	/** get the seach criteria to display as a txt pop-up in the searchresults view */
	getSearchCriteriaSummary : function(){

		var text = '<p><b>DataSet : </b>' + this.get("datasetId") + '</p> '
		
		text += '<b>Start date : </b> '+ this.get("startdate") + '</p>' +
			'<b>Stop date : </b> ' + this.get("stopdate") + '</p> ';
			
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

return DataSetSearch;

});