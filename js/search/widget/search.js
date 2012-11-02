/**
 * SearchWidget module
 */
define( ["jquery", "backbone", "search/view/MainSearchView", 
          "widget"], function($, Backbone, MainSearchView) {

return function() {
	
	var mainSearchView = new MainSearchView();
	mainSearchView.render();
	
	$('#dataServicesArea').append(mainSearchView.$el);
	
	$("#searchWidget").ngeowidget({
		title: 'Search',
		activator: '#search'
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