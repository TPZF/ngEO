/**
 * ShopcartWidget module
 */
define( ["jquery", "widget"], function($) {

return function() {
	
	$('#dataServicesArea').append('<div id="shopcartWidget" style="width: 500px; height: 300px;"></div>');

	$("#shopcartWidget").ngeowidget({
		title: 'Shopcart',
		activator: '#shopcart',
		buttons: [ "Button1", "Button2" ]
	});

};

});