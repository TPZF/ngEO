/**
 * SearchWidget module
 */
define( ["jquery", "ngeo.toolbar", "ngeo.widget"], function($, ToolBar) {

return function() {
	$('#dataServicesArea').append('<div id="searchWidget" style="width: 500px; height: 300px;"></div>');

	ToolBar.addAction('search','Search');
	$("#searchWidget").ngeowidget({
		title: 'Search',
		activator: '#search',
		buttons: [ "Button1", "Button2" ]
	});

};

});