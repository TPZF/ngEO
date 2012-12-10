/**
 * results table model as received from the server
 */
define( ['jquery', 'backbone'], function($, Backbone) {

var SearchResults = Backbone.Model.extend({
	
	defaults : {
		// Geojson feature's table as returned by the server
		features: [],
	},
	
	// Construtor : intialize the selection as an empty array
	initialize: function() {
		this.selection = [];
	},
	
	// Set the selection, replace the previous one
	setSelection: function(features) {
		this.trigger( "unselectFeatures", _.difference(this.selection, features) );
		this.trigger( "selectFeatures", _.difference(features, this.selection) );
		this.selection = features;
	},
	
	// Select a feature
	select: function(feature) {
		this.selection.push(feature);
		this.trigger( "selectFeatures", [feature] );
	},
	
	// Unselect a feature
	unselect: function(feature) {
		this.selection.splice( this.selection.indexOf(feature), 1 );
		this.trigger( "unselectFeatures", [feature] );
	}
});

return new SearchResults();

});