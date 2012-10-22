/**
 * ShopcartWidget module
 */
define( ["jquery", "ngeo.toolbar", "ngeo.widget"], function($, ToolBar) {

return function() {
	
	$('#dataServicesArea').append('<div id="shopcartWidget" style="width: 500px; height: 300px;"></div>');

	ToolBar.addAction('shopcart','Shopcart');
	$("#shopcartWidget").ngeowidget({
		title: 'Shopcart',
		activator: '#shopcart',
		buttons: [ "Button1", "Button2" ]
	});

};

});