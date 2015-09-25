/** Console fix	: create a dummy console.log when console is not present. Otherwise it is not working on some browser configuration */
window.console || (console = {
	log: function() {}
});

// Store the opened popup in order to close it
// since jqm doesn't allow popup-chaining
var openedPopup;

module.exports = {
	error: function(message) {

		if (openedPopup)
			openedPopup.popup("close");

		console.log('Error : ' + message);
		// Create a pop-up to warn the user
		openedPopup = $('<div><p>Error : ' + message + '</p></div>')
			.appendTo('.ui-page-active')
			.popup({
				afterclose: function(event, ui) {
					$(this).remove();
					openedPopup = null;
				}
			})
			.popup('open');
	},

	inform: function(message) {

		if (openedPopup)
			openedPopup.popup("close");


		console.log(message);
		// Create a pop-up to warn the user
		openedPopup = $('<div><p>' + message + '</p></div>')
			.appendTo('.ui-page-active')
			.popup({
				afterclose: function(event, ui) {
					$(this).remove();
					openedPopup = null;
				}
			})
			.popup('open');
	},

	warning: function(message, object) {
		if (object != undefined) {
			console.log('Warning : ' + message, object);
		} else {
			console.log('Warning : ' + message);
		}

	},

	log: function(message, object) {
		if (object != undefined) {
			console.log('Log : ' + message, object);
		} else {
			console.log('Log : ' + message);
		}
	}
};