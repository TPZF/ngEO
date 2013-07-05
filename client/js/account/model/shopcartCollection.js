/**
 * This is the model components for Shopcarts Collection
 */
define( ['jquery', 'backbone', 'configuration'], 
			function($, Backbone, Configuration){

/** This is the backbone Model of the Shopcart Collection element
 */
var ShopcartConfig = Backbone.Model.extend({
	
	defaults : {
		name : "",
		userId : "",
		isDefault : false
	},

	initialize : function(){
		// The base url to retreive the shopcarts list
		this.urlRoot = Configuration.baseServerUrl + '/shopcarts';
	}
});
	
/** This is the backbone Collection modeling the shopcart list
 */
var ShopcartCollection = Backbone.Collection.extend({
	
	model : ShopcartConfig,

	initialize : function(){
		// The base url to retreive the shopcarts list
		this.url = Configuration.baseServerUrl + '/shopcarts';
		this.defaultShopcartId = "";
		this.currentShopcartId = "";
	},

	/**
	 * Implemented in order to store at this stage the default shopcart id.
	 */
	parse : function(response){
		
		var self = this;
		for ( var i = 0; i < response.shopcarts.length; i++ ) {
			if (response.shopcarts[i].isDefault){		
				this.defaultShopcartId = response.shopcarts[i].id;
				this.currentShopcartId = this.defaultShopcartId;
			}
		}	
		return response.shopcarts;
	}
	
	
});

return new ShopcartCollection();

});