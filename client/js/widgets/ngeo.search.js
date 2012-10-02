/**
 * SearchWidget module
 */
define( ["jquery", "backbone", "ngeo.toolbar", "ngeo.widget"], function($, Backbone, ToolBar) {

return function() {
	$('#dataServicesArea').append('<div id="searchWidget" style="width: 500px; height: 300px;"></div>');

	ToolBar.addAction('search','Search');
	$("#searchWidget").ngeowidget({
		title: 'Search',
		activator: '#search',
		buttons: [ "Button1", "Button2" ]
	});
	
	// Router for seach shared url
    var SearchRouter = Backbone.Router.extend({
        routes: {
            "search/:id": "search"
        },
        search: function( id ){
			$("#searchWidget").ngeowidget("show");
        }
    });
	
    // Initiate the router
    var router = new SearchRouter;	

};

});