/**
 * ShopcartWidget module
 */
define( ["jquery", "shopcart/model/shopcart", "shopcart/model/ShopcartCollection", 
         "shopcart/view/shopcartItemView", "panelManager", "widget"], 
		function($, Shopcart, ShopcartCollection, ShopcartItemView, PanelManager) {

return function(element) {
	
	// Create the model for the current Shopcart
	var currentShopcart = new Shopcart();
	
	//load the shopcart collection to get the default shopcart id
	ShopcartCollection.fetch({
	
		success: function() {
			
			currentShopcart.initialize(ShopcartCollection.currentShopcartId);

			// load the content of the current shopcart
			currentShopcart.fetch({
				
				success: function(model, response) {
					
					// Create the shopcart content view
					var shopcartItemView = new ShopcartItemView({
						model : model 
					});
					
					//Add the shopcart table to the bottom panel 
					PanelManager.addPanelContent({
						element: shopcartItemView.$el,
						position: 'bottom',
						activator: '#shopcart',
						show: $.proxy( shopcartItemView.onShow, shopcartItemView ),
						hide: $.proxy( shopcartItemView.onHide, shopcartItemView )
					});
					
					// Manage panel size
					shopcartItemView.$el.on('panel:show', $.proxy( shopcartItemView.onShow, shopcartItemView ) );
					shopcartItemView.$el.on('panel:hide', $.proxy( shopcartItemView.onHide, shopcartItemView ) );
					shopcartItemView.on("sizeChanged", function() {
						PanelManager.updatePanelSize('bottom');
					});
					
					shopcartItemView.render();
					
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