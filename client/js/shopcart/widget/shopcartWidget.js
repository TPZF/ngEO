/**
 * ShopcartWidget module
 */

var ShopcartCollection = require('shopcart/model/shopcartCollection');
var ShopcartTableView = require('shopcart/view/shopcartItemView');
var PanelManager = require('ui/panelManager');
var ngeoWidget = require('ui/widget');


module.exports = {

	create: function() {

		// Create the shopcart content view
		var shopcartTableView = new ShopcartTableView();

		// Add the shopcart table to the bottom panel 
		PanelManager.addPanelContent({
			element: shopcartTableView.$el,
			position: 'bottom',
			activator: '#shopcart',
			show: $.proxy(shopcartTableView.onShow, shopcartTableView),
			hide: $.proxy(shopcartTableView.onHide, shopcartTableView)
		});

		// Manage panel size
		shopcartTableView.$el.on('panel:show', $.proxy(shopcartTableView.onShow, shopcartItemView));
		shopcartTableView.$el.on('panel:hide', $.proxy(shopcartTableView.onHide, shopcartItemView));
		shopcartItemView.on("sizeChanged", function() {
			PanelManager.updatePanelSize('bottom');
		});

		shopcartTableView.listenTo(ShopcartCollection, 'change:current', shopcartItemView.setShopcart);

		shopcartTableView.render();

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

		return shopcartTableView.$el;
	},

	/**
	 * Update the shopcart item view whene the share shopcart is triggered.
	 * @returns
	 */
	updateView: function() {
		shopcartTableView.onShow();
	}

};