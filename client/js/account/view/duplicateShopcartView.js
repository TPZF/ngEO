

define( ['account/view/createShopcartView'], 
		function(CreateShopcartView) {

	
/** The duplicate view is very similar to the createShopcart view 
 * except for the submit action request
 */
var DuplicateShopcartView = CreateShopcartView.extend({
	
	/** submit to the server */ 
	submit : function(name,options) {
	
		var features = this.model.getCurrent().features;
		var newModel = this.model.create({ "name" : name,
							"userId" : "",
							"isDefault" : false}, options);
							
		newModel.addItems( features );
	}

});

return DuplicateShopcartView;

});
