  
define( ['jquery', 'backbone', 'configuration'], function($, Backbone, Configuration) {

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
		criteria : ""//TODO later add the advanced criteria 
	},
	
	validate: function(attrs) {
	    if (attrs.stopdate < attrs.startdate) {
	      return "Date interval can't end before it starts";
	    }   
	  },
	  
	getOpenSearchURL : function(){
	
		//TODO add advanced search criteria later
		var url = Configuration.baseServerUrl + "/productSearch?q={datasetId:" + this.get("datasetId") + "}&" +
				"startdate="+ this.get("startdate") + "&" + 
				"stopdate=" + this.get("stopdate");
		
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