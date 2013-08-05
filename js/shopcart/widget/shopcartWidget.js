/**
 * ShopcartWidget module
 */
define( ["jquery", "shopcart/model/shopcartCollection", "shopcart/view/shopcartItemView", "panelManager", "widget"], 
		function($, ShopcartCollection, ShopcartItemView, PanelManager) {

	return function() {
		
//		// load the content of the current shopcart
//		currentShopcart.fetch();
//		
//		currentShopcart.on("shopcart:loaded", function() {
		
			// Create the shopcart content view
			var shopcartItemView = new ShopcartItemView({
				model : ShopcartCollection  
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
			shopcartItemView.on("shopcart:sizeChanged", function() {
				PanelManager.updatePanelSize('bottom');
			});
			
			shopcartItemView.render();
			
			return shopcartItemView.$el;
		
//		}, this);
//		
//		currentShopcart.on("shopcart:errorLoad", function() {
//			//when the fetch fails display an error message and disable the shopcart button
//			// so the application is still usable and the user can still see the other menus.
//			$("#shopcart").parent().addClass('ui-disabled');
//		}, this);

	};

});