var GlobalEvents = require('globalEvents');
var MenuBar = require('ui/menubar');
var Map = require('map/map');
var SearchResultsMap = require('searchResults/map');
var UserPrefs = require('userPrefs');

var ShopcartCollection = require('shopcart/model/shopcartCollection');
var Shopcart = require('shopcart/model/shopcart');
var ShopcartTableView = require('shopcart/view/shopcartTableView');
// var CreateShopcartView = require('account/view/createShopcartView');
var DataSetPopulation = require('search/model/dataSetPopulation');
var ShopcartListPopup = require('shopcart/view/shopcartListPopup');
	
module.exports =  {
		
	/**
	 * Initialize the shopcart component for data-services-area.
	 *
	 * @param element 	The root element of the data-services-area
	 * @param router 	The data-services-area router
	 */
	initialize: function(element, router, panelManager) {
		
		// Create the shopcart table view and add it to panel
		var tableView = new ShopcartTableView();
		panelManager.bottom.addView( tableView );

		// Manage display of shopcart footprints
		ShopcartCollection.on('change:isSelected', function( shopcart ) {
	
			var updateShopcartLabel = function() {
				// TODO:
				console.log("Update name");
			};

			var selectedShopcarts = JSON.parse(UserPrefs.get("Selected shopcarts") || "[]");

			if ( shopcart._isSelected ) {
				// Connect shopcart with Map
				var shopcartLayer = Map.addLayer({
					name: "Shopcart Footprints " + shopcart.get('id'),
					type: "Feature",
					visible: true,
					style: "shopcart-footprint"
				});
				SearchResultsMap.addFeatureCollection( shopcart.featureCollection, {
					layer: shopcartLayer,
					hasBrowse: false
				});
				shopcart.on('change:name', updateShopcartLabel);

				// Change model on table when the shopcart is changed
				shopcart.loadContent();

				// Add to selected shopcarts only if it's not already present
				// FIXME: investigate why we need to request multiple times this change...
				if ( selectedShopcarts.indexOf(shopcart.get("id")) == -1 )
					selectedShopcarts.push(shopcart.get("id"));
			} else {
				shopcart.featureCollection.reset(); // Reset feature collection to update table view
				SearchResultsMap.removeFeatureCollection( shopcart.featureCollection );
				shopcart.off('change:name', updateShopcartLabel);
				selectedShopcarts.splice( selectedShopcarts.indexOf(shopcart.get("id")), 1);
			}

			UserPrefs.save("Selected shopcarts", JSON.stringify(selectedShopcarts));
		});
	
		// Manager GUI of selected shopcart
		ShopcartCollection.on('change:isSelected', function(shopcart) {

			// console.log("Updating panel " + shopcart.get('id') +" is set to " + shopcart._isSelected);
			var tagFriendlyId = 'shopcart_'+shopcart.get('id');
			if ( shopcart._isSelected ) {

				// Update the toolbar
				$('#bottomToolbar')
					.find('#bottomDatasets')
						.prepend('<command id="'+ tagFriendlyId +'" data-icon="shopcart" title="'+ shopcart.get('name') +'" label="' + shopcart.get('name') + '" class="result" />').end()
					.toolbar('refresh');

				// Add tableView as a status to bottom bar
				var shopcartStatus = {
					activator: '#'+tagFriendlyId,
					$el: $(''),
					views: [tableView],
					viewActivators: [ $('#table') ],
					model: shopcart.featureCollection,
					parent: shopcart
				};
				panelManager.bottom.addStatus(shopcartStatus);

				var shopcarts = JSON.parse(UserPrefs.get("Selected shopcarts") || "[]");
				shopcarts.push(shopcart.id);
			} else {
				// Update the status bar
				panelManager.bottom.removeStatus('#' + tagFriendlyId);
				$('#bottomToolbar #bottomDatasets command:last').click();
			}
		});
		tableView.render();

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
			
			// Show the GUI once loaded
			shareShopcart.on("add:features", function() {
				// Toggle the shopcart button to be clicked
				$("#shopcart").trigger('click');
				panelManager.bottom.showTable();
			});
		});
		
		// Subscribe add to shopcart
		GlobalEvents.on('addToShopcart', function(features) {
			
			ShopcartListPopup.open({
				onSelect: function(shopcart) {
					shopcart.addItems( features );
				}
			})

			// Code used when there were only one shopcart chosen
			// if (!ShopcartCollection.getCurrent()) {
			// 	var createShopcartView = new CreateShopcartView({
			// 		model : ShopcartCollection,
			// 		title : "Create shopcart",
			// 		success : function(model) {
			// 			ShopcartCollection.setCurrent( model );
			// 			ShopcartCollection.getCurrent().addItems( features );
			// 		}
			// 	});
			// 	createShopcartView.render();
				
			// } else {
			// 	ShopcartCollection.getCurrent().addItems( features );
			// }
		});
		
	},
};
