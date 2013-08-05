/**
 * These are the model components for Shopcarts Collection handling
 */
define( ['jquery', 'backbone', 'configuration', 'shopcart/model/shopcart'], 
			function($, Backbone, Configuration, Shopcart){

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
		_.extend(this, Backbone.Events);
		// The base url to retreive the shopcarts list
		this.url = Configuration.baseServerUrl + '/shopcarts';
		this.defaultShopcartId = "";
		this.currentShopcartId = "";
		this.currentShopcart = {};
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
	},
	
	/** load the current shopcart*/ 
	loadCurrentShopcart : function(){
		this.currentShopcart = new Shopcart(this, this.currentShopcartId);
		this.currentShopcart.fetch();
	},
	
	/** called when the current shopcart has been changed not after a fetch */
	updateCurrentShopcartId : function(shopcartId){
		this.currentShopcartId = shopcartId;
		this.loadCurrentShopcart();
		//this.trigger('updatedCurrentShopcart');
	},
	
	
	/** get the shopcart config of the currently selected shopcart */
	getCurrentShopcartConfig : function(){
		
		var shopcartConfig;		
		for (var i = 0; i<this.models.length; i++){
			
			if (this.models[i].id == this.currentShopcartId){
				shopcartConfig = this.models[i];
			}
		}
		 return shopcartConfig;
	},
	
	/** get the id of the shopcart before the current one ! */
	getPreviousShopcartId : function(){
		
		var shopcartId;		
		
		for (var i = 0; i<this.models.length; i++){
			
			if (this.models[i].id == this.currentShopcartId){
				if (i==0){//should not happen
					shopcartId = this.defaultShopcartId;
				}else{
					shopcartId = this.models[i-1].id;
				}
			}
		}
//		console.log("this.currentShopcartId == " + this.currentShopcartId);
//		console.log("this.defaultShopcartId == " + this.defaultShopcartId);
//		console.log("shopcartId == " + shopcartId);
		return shopcartId;
	}
	
});

return new ShopcartCollection();

});