  
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
		useExtent : "false",
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
				"stopdate=" + this.get("stopdate") + "&" + 
				"bbox=" + this.get("west") + "," + this.get("south") + "," 
				+ this.get("east") + "," + this.get("north");
		
		//console.log("DatasetSearch module : getOpenSearchURL method : " + url);
		
		return url;
	}
});

return DataSetSearch;

});