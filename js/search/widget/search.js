/**
 * SearchWidget module
 */
define( ["jquery", "backbone", "search/view/MainSearchView", 
          "widget"], function($, Backbone, MainSearchView) {

return function() {
	
	var mainSearchView = new MainSearchView();
	
	console.log("main search view HTML content : " + mainSearchView.render().$el);
	
	$('#dataServicesArea').append(mainSearchView.render().$el);
	
	$("#searchWidget").ngeowidget({
		title: 'Search',
		activator: '#search',
		buttons: [ "Button1", "Button2" ]
	});
	
//	// Router for seach shared url
//    var SearchRouter = Backbone.Router.extend({
//        routes: {
//            "search/:id": "search"
//        },
//        search: function( id ){
//			$("#searchWidget").ngeowidget("show");
//        }
//    });
//	
//    // Initiate the router
//    var router = new SearchRouter;	

};

});