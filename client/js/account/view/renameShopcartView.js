var CreateShopcartView = require('account/view/createShopcartView');

/** 
 * The rename view is very similar to the createShopcart view 
 * except for the submit action request
 */
var RenameShopcartView = CreateShopcartView.extend({

	/** 
	 * Submit the rename query to the server
	 */
	submit: function(name, options) {
		this.model.getSelected().forEach(function(shopcart){
			shopcart.save({
				"name": name
			}, options);
		});
	},

	/** 
	 * Return an error message
	 */
	errorMessage: function() {
		return "Error : Shopcart cannot be renamed.";
	}

});

module.exports = RenameShopcartView;