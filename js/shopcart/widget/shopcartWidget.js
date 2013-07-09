/**
 * ShopcartWidget module
 */
define( ["jquery", "shopcart/model/shopcart", "shopcart/model/ShopcartCollection", 
         "shopcart/view/shopcartItemView", "widget"], 
		function($, Shopcart, ShopcartCollection, ShopcartItemView) {

return function(element) {
	
	// Create the model for the current Shopcart
	var currentShopcart = new Shopcart();
	
	//load the shopcart collection to get the default shopcart id
	ShopcartCollection.fetch({
	
		success: function() {
			
			currentShopcart.initialize(ShopcartCollection.currentShopcartId);
			
			// Create the shopcart content view
			var shopcartItemView = new ShopcartItemView({
				model : currentShopcart 
			});
			
			// load the content of the current shopcart
			currentShopcart.fetch({
				
				success: function() {
					
					shopcartItemView.render();
					
					// Append it to the data services area
					element.append(shopcartItemView.$el);
					
					// Create the widget for main search view
					shopcartItemView.$el.ngeowidget({
						activator: '#shopcart',
					});
					
					return shopcartItemView.$el;
					
				},//when the fetch fails display an error message and disable the shopcart button
				// so the application is still usable and the user can still see the other menus.
				error: function(){
					$("#shopcart").parent().addClass('ui-disabled');
					Logger.error('Cannot retreive the shopcart items from the server');
				}
			});
		},
		error: function(){
			$("#shopcart").parent().addClass('ui-disabled');
			Logger.error('Cannot retreive the list of shopcarts from the server');
		}
	});
};

});