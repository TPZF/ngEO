define(['jquery','menubar'], function ($,MenuBar) {

// Define the QUnit module and lifecycle.
QUnit.module("MenuBar", {
	setup: function() {
		// Initialize the menu bar
		MenuBar.initialize('header nav');
	}
});

// just check that data services area is visible at beginning
QUnit.test("Check default state", function () {
	ok( $('#dataServicesArea').is(':visible') );
	ok( $('a[href="#dataServicesArea"]').hasClass('active') );
});

// just check what happens when a menu item is clicked
QUnit.asyncTest("Check click on menu item", 4, function () {
	$('a[href="#about"]').click();
	setTimeout( function() {
		ok( $('#about').is(':visible') );
		ok( !$('#dataServicesArea').is(':visible') );
		ok( $('a[href="#about"]').hasClass('active') );
		ok( !$('a[href="#dataServicesArea"]').hasClass('active') );
		QUnit.start();
	}, 500 );
});


});