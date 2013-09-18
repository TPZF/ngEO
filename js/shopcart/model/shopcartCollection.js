/**
 * These are the model components for Shopcarts Collection handling
 */
define( ['jquery', 'backbone', 'configuration', 'shopcart/model/shopcart'], 
			function($, Backbone, Configuration, Shopcart){
		
/** This is the backbone Collection modeling the shopcart list
 */
var ShopcartCollection = Backbone.Collection.extend({
	
	model : Shopcart,

	initialize : function(){
		_.extend(this, Backbone.Events);
		// The base url to retreive the shopcarts list
		this.url = Configuration.baseServerUrl + '/shopcarts';
		// No current shopcart
		this._current = null;
		
		// Synchronize the current shopcart when the collection has been fetched from the server
		this.on('sync', function() {
			
			// Do not change the current if it is a shared one
			if ( this._current && this._current.get("isShared") ) {
				return;
			}
			
			// Find the current : the default one or the first one if none defined
			var current = this.findWhere({ isDefault: true });
			if (!current) {
				current = this.at(0);
			}
			
			// Set the new current 
			this.setCurrent( current );
			
		}, this );
	},

	/**
	 * Needed because the server response is not what is expected from Backbone
	 */
	parse : function(response){
		// Remove the shopcart attributes from JSON
		return response.shopcarts;
	},
	
	/** get the current shopcart */
	getCurrent: function() {
		return this._current;
	},
	
	// Set the current shopcart
	setCurrent: function(current) {
		this._current = current;
		this.trigger('change:current',this._current);
	},
	
	/**
	 * Get the current shopcart shared URL
	 */
	getShopcartSharedURL : function(){

		return "#data-services-area/shopcart/" +  this.getCurrent().id;

	},
	
});

return new ShopcartCollection();

});