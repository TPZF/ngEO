/**
 * Model to retrieve the search results from the server
 */
define( ['jquery', 'backbone'], function($, Backbone) {

var SearchResults = Backbone.Model.extend({
	
	defaults:{
		features : [],
	},
	
	// The url to retrieve the search results
	initialize : function () {
		this.url = '../server/productSearch';
	},

//	parse: function(response){
		
//	},
	
});

return SearchResults;

});