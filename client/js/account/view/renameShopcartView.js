var CreateShopcartView = require('account/view/createShopcartView');

/** The rename view is very similar to the createShopcart view 
 * except for the submit action request
 */
var RenameShopcartView = CreateShopcartView.extend({

	/** submit the rename query to the server */
	submit: function(name, options) {
		this.model.getCurrent().save({
			"name": name
		}, options);
	},

	/** 
	 * Return an error message
	 */
	errorMessage: function() {
		return "Error : Shopcart cannot be renamed.";
	}

});

module.exports = RenameShopcartView;