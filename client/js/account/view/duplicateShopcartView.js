

define( ['account/view/createShopcartView'], 
		function(CreateShopcartView) {

	
/** The duplicate view is very similar to the createShopcart view 
 * except for the submit action request
 */
var DuplicateShopcartView = CreateShopcartView.extend({
	
	/** submit to the server */ 
	submit : function(name,options) {
	
		var features = this.model.getCurrent().features;
		
		var wrapSuccess = function(model) {
			model.addItems( features );
			if (options.success) options.success();
		};
		
		
		var attributes = { "name" : name,
							"userId" : "",
							"isDefault" : false };
			
		this.model.create(attributes, { 
								wait: true, 
								success: wrapSuccess, 
								error: options.error
							});
							
	}

});

return DuplicateShopcartView;

});
