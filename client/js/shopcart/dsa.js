var GlobalEvents = require('globalEvents');
var MenuBar = require('ui/menubar');
var ShopcartCollection = require('shopcart/model/shopcartCollection');
var Shopcart = require('shopcart/model/shopcart');
var ShopcartTableView = require('shopcart/view/shopcartTableView');
var ShopcartView = require('shopcart/view/shopcartView');
var CreateShopcartView = require('account/view/createShopcartView');
	
module.exports =  {
		
	/**
	 * Initialize the shopcart component for data-services-area.
	 *
	 * @param element 	The root element of the data-services-area
	 * @param router 	The data-services-area router
	 */
	initialize: function(element, router, panelManager) {

		// Create shopcart view
		var shopcartView = new ShopcartView({
			model: ShopcartCollection.getCurrent(),
			collection: ShopcartCollection
		});
		$('#statusBar').append(shopcartView.$el);
		shopcartView.render();
		
		// Create the shopcart table view and add it to panel
		var tableView = new ShopcartTableView();
		panelManager.bottom.addView( tableView );		
		tableView.listenTo(ShopcartCollection, 'change:current', function(shopcart) {
			tableView.setShopcart(shopcart);
			shopcartStatus.model = shopcart.featureCollection;
		});
		tableView.render();

		// Add shopcartView&tableView as a status to bottom bar
		var shopcartStatus = {
			activator: '#shopcart',
			$el: shopcartView.$el,
			views: [tableView],
			viewActivators: [ shopcartView.$el.find('#tableCB') ],
			model: ShopcartCollection.getCurrent()
		};
		// Add shopcart status to panel
		panelManager.bottom.addStatus(shopcartStatus);	
		
		// Load the shopcart collection to display the current shopcart in the data services area
		ShopcartCollection.fetch();
	
		// Define route for share shopcart
		router.route(
				"data-services-area/shopcart/:shopcartId", 
				"shopcart", function(shopcartId) {		

			MenuBar.showPage("data-services-area");
			
			// Create a shared shopcart and load its content to be displayed
			var shareShopcart = new Shopcart({
				id: shopcartId, name: "Share Shopcart " + shopcartId,
				isShared: true
			});
			ShopcartCollection.setCurrent( shareShopcart );
			
			// Load content is not needed because it is already done by the shopcart widget when setCurrent is done
			//shareShopcart.loadContent();
			
			// Show the GUI once loaded
			shareShopcart.on("add:features", function() {
				// Toggle the shopcart button to be clicked
				$("#shopcart").trigger('click');
				panelManager.bottom.showTable();
			});
		});
		
		// Subscribe add to shopcart
		GlobalEvents.on('addToShopcart', function(features) {
		
			if (!ShopcartCollection.getCurrent()) {

				var createShopcartView = new CreateShopcartView({
					model : ShopcartCollection,
					title : "Create shopcart",
					success : function(model) {
						ShopcartCollection.setCurrent( model );
						ShopcartCollection.getCurrent().addItems( features );
					}
				});
				createShopcartView.render();
				
			} else {
				ShopcartCollection.getCurrent().addItems( features );
			}
		});
		
	},
};
