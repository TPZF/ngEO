/**
 * These are the model components for a shopcart content handling
 */
define( ['jquery', 'backbone', 'configuration'], 
			function($, Backbone, Configuration){
	

	/** This is the backbone Model of the a shopcart list element */
	var ShopcartItem = Backbone.Model.extend({
		
		defaults : {
			shopcartId : "",
			product : {} //geojson feature
			//downloadOptions : {}
		},
	
		initialize : function(shopcartId){
			
			// The base url to retreive the shopcarts list
			this.urlRoot = Configuration.baseServerUrl + '/shopcarts/' + shopcartId;
		}
	});
	
	/** This is the backbone Collection modeling a shopcart content
	 */
	var Shopcart = Backbone.Collection.extend({
		
		model : ShopcartItem,
	
		initialize : function(id){
			this.id = id;
			// The base url to retreive the shopcarts list
			this.url = Configuration.baseServerUrl + '/shopcarts/' + id;
		}, 
		
		/** get the items array to create the Backbone collection */ 
		parse : function(response){
			return response.items;
		}
	
	});

	return Shopcart;

});

