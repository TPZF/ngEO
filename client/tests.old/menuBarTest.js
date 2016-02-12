define(['jquery','menubar'], function ($,MenuBar) {

// Define the QUnit module and lifecycle.
QUnit.module("MenuBar", {
	setup: function() {
		// Initialize the menu bar
		MenuBar.initialize('header nav');
	}
});

// just check that data services area is visible at beginning
QUnit.asyncTest("Check default state", 2, function () {
	setTimeout( function() {
		ok( $('#data-services-area').is(':visible') );
		ok( $('a[href="#data-services-area"]').hasClass('active') );
		QUnit.start();
	}, 1000 );
});

// just check what happens when a menu item is clicked
QUnit.asyncTest("Check click on menu item", 4, function () {
	$('a[href="#about"]').click();
	setTimeout( function() {
		ok( $('#about').is(':visible') );
		ok( !$('#data-services-area').is(':visible') );
		ok( $('a[href="#about"]').hasClass('active') );
		ok( !$('a[href="#data-services-area"]').hasClass('active') );
		QUnit.start();
	}, 1000 );
});


});