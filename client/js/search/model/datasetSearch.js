  
define( ['jquery', 'backbone'], function($, Backbone) {

var DataSetSearch = Backbone.Model.extend({
	
	defaults:{
		host : "http://localhost:3000/server/productSearch",
		datasetId : "",
		startdate : "",
		stopdate: "",
		west: "",
		south : "",
		east : "",
		north : "",
		useExtent : "false",
		criteria : ""
	},
	
	validate: function(attrs) {
	    if (attrs.stopdate < attrs.startdate) {
	      return "Date interval can't end before it starts";
	    }
	    
	  },
	  
	getOpenSearchURL : function(){
	
		//TODO add advanced search criteria later
		return (host + "?q={datasetId  : " + this.get("datasetId") + " } &" +
				"startdate="+ this.get("startdate") + "&" + 
				"stopdate=" + this.get("stopdate") + "&" + 
				"bbox=" + west + "," + south + "," + east + "," + north);
	}
});

return DataSetSearch;

});