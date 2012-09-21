
define( ["jquery", "ngeo.toolbar", "ngeo.widget"], function($, ToolBar) {

return function() {

	ToolBar.addAction('shopcart','Shopcart');
	$("#shopcartWidget").ngeowidget({
		title: 'Shopcart',
		activator: '#shopcart',
		buttons: [ "Button1", "Button2" ]
	});

};

});