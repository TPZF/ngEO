define( ['jquery'], function($) {

/** Console fix	: create a dummy console.log when console is not present. Otherwise it is not working on some browser configuration */
window.console || (console={log:function(){}});

return {
	error: function(message) {
		console.log('Error : ' + message);
		// Create a pop-up to warn the user
		$('<div><p>Error : ' + message + '</p></div>')
			.appendTo('.ui-page-active')
			.popup()
			.popup('open');
	},
	
	inform: function(message) {
		console.log(message);
		// Create a pop-up to warn the user
		$('<div><p>' + message + '</p></div>')
			.appendTo('.ui-page-active')
			.popup()
			.popup('open');
	},
	
	warning: function(message) {
		console.log('Warning : ' + message);
	},
	
	log: function(message) {
		console.log('Log : ' + message);
	}
};
	
});
	