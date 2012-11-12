/**
 * results table model as received from the server
 */
define( ['jquery', 'backbone'], function($, Backbone) {

var SearchResults = Backbone.Model.extend({
	
	defaults : {
		//geojson feature's table as returned by the server
		features: []
	}
});

return SearchResults;

});