/**
 * ShopcartWidget module
 */
define( ["jquery", "shopcart/model/shopcartCollection", "shopcart/view/shopcartItemView", "panelManager", "widget"], 
		function($, ShopcartCollection, ShopcartItemView, PanelManager) {

	// Create the shopcart content view
	var shopcartItemView = new ShopcartItemView({
		model : ShopcartCollection  
	});
	
	return {

		create : function(){
			
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
		},
		
		/**
		 * Update the shopcart item view whene the share shopcart is triggered.
		 * @returns
		 */
		updateView : function(){
			shopcartItemView.onShow();
		}

	};

});