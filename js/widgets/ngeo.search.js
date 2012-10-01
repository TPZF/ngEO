
define( ["jquery", "ngeo.toolbar", "ngeo.widget"], function($, ToolBar) {

return function() {

	ToolBar.addAction('search','Search');
	$("#searchWidget").ngeowidget({
		title: 'Search',
		activator: '#search',
		buttons: [ "Button1", "Button2" ]
	});

};

});