
define(["jquery", "text!../pages/account.html", "tabs"], 
	function($, account_html) {
	
return {

	/**
	 * Build the root element of the module and return it
	 */
	buildElement: function() {
	
		var acc = $(account_html);
		acc.find('#tabs').tabs();
		return acc;
	},
	
	/**
	 * Initialize the module.
	 * Called after buildElement
	 */
	initialize: function() {
			
	}
};

});