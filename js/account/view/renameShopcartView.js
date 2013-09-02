

define( ['jquery', 'logger', 'backbone',  'account/view/createShopcartView'], 
		function($, Logger, Backbone, CreateShopcartView) {

	
	/** The rename view is very similar to the createShopcart view 
	 * except for the submit action request
	 */
var RenameShopcartView = CreateShopcartView.extend({
	
	/** submit the rename query to the server */ 
	submit : function(event){
		event.preventDefault();
		this.model.getCurrentShopcartConfig().set({ "name" : $('#shopcartNameField').val()}).save();
	}

});

return RenameShopcartView;

});
