/**
 * This is the model : Shopcarts list
 */
define( ['jquery', 'backbone', 'configuration'], 
			function($, Backbone, Configuration){

var ShopcartList = Backbone.Model.extend({
	
	defaults : {
		shopcarts : []
	},

	initialize : function(){
		// The base url to retreive the shopcarts list
		this.url = Configuration.baseServerUrl + '/shopcarts';
	}
	
});

return new ShopcartList();

});