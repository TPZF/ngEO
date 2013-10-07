/**
 * ShopcartWidget module
 */
define( ["jquery", "shopcart/model/shopcartCollection", "shopcart/view/shopcartItemView", "ui/panelManager", "ui/widget"], 
		function($, ShopcartCollection, ShopcartItemView, PanelManager) {

	
	return {

		create : function(){

			// Create the shopcart content view
			var shopcartItemView = new ShopcartItemView();
			
			// Add the shopcart table to the bottom panel 
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
			
			shopcartItemView.listenTo(ShopcartCollection, 'change:current', shopcartItemView.setModel);
			
			shopcartItemView.render();
			
			// Manage error on shopcart collection fetch
			// Desactive the shopcart widget : cannot access to shopcart !
			$('#shopcart').addClass('ui-disabled');
			ShopcartCollection.on('error', function() {
				$('#shopcart').addClass('ui-disabled');
			});
			ShopcartCollection.on('sync', function() {
				$('#shopcart').removeClass('ui-disabled');
			});
		
			// load the shopcart collection to display the current shopcart in the data services area
			ShopcartCollection.fetch();
			
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