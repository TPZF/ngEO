
define(["jquery", "logger", "map/map", "map/selectHandler", 
        "searchResults/model/searchResults", "searchResults/view/searchResultsView",
        "searchResults/view/searchResultsTableView", "map/widget/mapPopup"], 
	function($, Logger, Map, SelectHandler, SearchResults, SearchResultsView, SearchResultsTableView,
			MapPopup) {

// Private variable
var _views = {};

// Call when a feature is selected to synchronize the map
var _onSelectFeatures = function(features,fc) {
	for ( var i = 0; i < features.length; i++ ) {
		if ( fc.isHighlighted(features[i]) ) {
			fc._footprintLayer.modifyFeaturesStyle([features[i]], "highlight-select" );
		} else {
			fc._footprintLayer.modifyFeaturesStyle([features[i]], "select" );
		}
	}
	
	// Only display browse if the user has view access
	if ( fc.viewAccess ) {
		fc._browsesLayer.addFeatures(features);
	} else if (!fc._viewAccessInformation) {
		Logger.inform("You do not have enough permission to view the product.");
		fc._viewAccessInformation = true;
	}
};

// Call when a feature is unselected to synchronize the map
var _onUnselectFeatures = function(features,fc) {
	for ( var i = 0; i < features.length; i++ ) {
		if ( fc.isHighlighted(features[i]) ) {
			fc._footprintLayer.modifyFeaturesStyle([features[i]], "highlight" );
		} else {
			fc._footprintLayer.modifyFeaturesStyle([features[i]], "default" );
			fc._browsesLayer.removeFeatures([features[i]]);
		}
	}
};

// Call when a feature is highlighted to synchronize the map
var _onHighlightFeatures = function(features,prevFeatures,fc) {
	
	if ( prevFeatures ) {
		
		for ( var i = 0; i < prevFeatures.length; i++ ) {

			if ( fc.isSelected(prevFeatures[i]) ) {
				fc._footprintLayer.modifyFeaturesStyle([prevFeatures[i]], "select" );
			} else {
				fc._footprintLayer.modifyFeaturesStyle([prevFeatures[i]], "default" );
				fc._browsesLayer.removeFeatures([prevFeatures[i]]);
			}
		}
	}
	
	if ( features ) {
		for ( var i = 0; i < features.length; i++ ) {
			if ( fc.isSelected(features[i]) ) {
				fc._footprintLayer.modifyFeaturesStyle([features[i]], "highlight-select" );
			} else {
				fc._footprintLayer.modifyFeaturesStyle([features[i]], "highlight" );
			}
		}
		
		fc._browsesLayer.addFeatures(features);

		// Only display browse if the user has view access
		if ( fc.viewAccess ) {
			fc._browsesLayer.addFeatures(features);
		} else if (!fc._viewAccessInformation) {
			Logger.inform("You do not have enough permission to view the product.");
			fc._viewAccessInformation = true;
		}
	}
};	


return {
	
	/**
	 * Initialize the search results component for data-services-area.
	 *
	 * @param element 	The root element of the data-services-area
	 * @param router 	The data-services-area router
	 */
	 initialize: function(element, router, panelManager) {
			
		// Call when a new feature collection is available
		SearchResults.on('add:featureCollection', function(fc) {
						
			// Create the search results view
			var searchResultsView = new SearchResultsView({ 
				model : fc 
			});
			_views[ fc.id ] = searchResultsView;
			$('#statusBar').append( searchResultsView.$el );
			searchResultsView.render();
			
			// Create the results table view
			var tableView = new SearchResultsTableView({ 
				model : fc 
			});
			tableView.hasGroup = fc.id == "Correlation" || fc.id == "Interferometry";
			
			// update the toolbar
			$('#bottomToolbar')
				.append('<command id="result' + fc.id + '" label="' + fc.id + '" class="result" />')
				.toolbar('refresh');
			$('#dateRangeSlider').css('left', $('#bottomToolbar').outerWidth() );
			var slider = $("#dateRangeSlider").data("dateRangeSlider");
			if (slider) slider.refresh();
			
			panelManager.bottom.addStatus({
				activator: '#result' + fc.id,
				show: function() {					
					searchResultsView.$el.show();
				},
				hide: function() {
					searchResultsView.$el.hide();
				},
				tableView: tableView,
				$tableCB: searchResultsView.$el.find('#tableCB')
			});
			tableView.render();
			
			var footprintLayer = Map.addLayer({
				name: fc.id + " Result Footprints",
				type: "Feature",
				visible: true,
				style: "results-footprint",
				greatCircle: true
			});
			var browsesLayer = Map.addLayer({
				name: fc.id + " Result Browses",
				type: "Browses",
				visible: true
			});
			fc._footprintLayer = footprintLayer;
			fc._browsesLayer = browsesLayer;
			fc.on('add:features', footprintLayer.addFeatures, footprintLayer);
			fc.on('remove:features', footprintLayer.removeFeatures, footprintLayer);
			fc.on('reset:features', footprintLayer.clear, footprintLayer);
			fc.on('reset:features', browsesLayer.clear, browsesLayer);
			fc.on('selectFeatures', _onSelectFeatures );
			fc.on('unselectFeatures', _onUnselectFeatures );
			fc.on('highlightFeatures', _onHighlightFeatures );
			
			SelectHandler.addFeatureCollection(fc);
			
			// Activate the new result
			$('#result' + fc.id).click();
			
		});
		
		// Call when a feature collection is removed
		SearchResults.on('remove:featureCollection', function(fc) {
			// Update the toolbar
			$('#result' + fc.id)
				.remove();
				
			// Update the daterange slider
			$('#dateRangeSlider').css('left', $('#bottomToolbar').outerWidth() );
			var slider = $("#dateRangeSlider").data("dateRangeSlider");
			if (slider) slider.refresh();
			
			// Remove the view
			_views[ fc.id ].remove();
			delete _views[ fc.id ];
			
			fc.off('add:features', fc._footprintLayer.addFeatures, fc._footprintLayer);
			fc.off('remove:features', fc._footprintLayer.removeFeatures, fc._footprintLayer);
			fc.off('reset:features', fc._footprintLayer.resetFeatures, fc._footprintLayer);
			fc.off('reset:features', fc._browsesLayer.clear, fc._browsesLayer);
			fc.off('selectFeatures', _onSelectFeatures );
			fc.off('unselectFeatures', _onUnselectFeatures );
			fc.off('highlightFeatures', _onHighlightFeatures );
			Map.removeLayer( fc._footprintLayer );
			Map.removeLayer( fc._browsesLayer );
			
			SelectHandler.removeFeatureCollection(fc);
			
			// Activate the last
			$('#bottomToolbar command:last-child').click();
		});
		
		// Initialize the default handler
		SelectHandler.initialize();
		// Start it
		SelectHandler.start();
		
		// Create the popup for the map
		var mapPopup = new MapPopup('#mapContainer');
		mapPopup.close();		

		// Connect with map feature picking
		Map.on('pickedFeatures', function(features) {
			var highlights = {};
			for ( var x in SearchResults.featureCollection ) {
				highlights[x] = [];
			}
			
			for ( var i = 0; i < features.length; i++ ) {
				var fc = features[i]._featureCollection;
				highlights[fc.id].push( features[i] );
			}
			
			for ( var x in SearchResults.featureCollection ) {
				SearchResults.featureCollection[x].highlight( highlights[x] );
			}
		});
		
		// Do not stay on shopcart when a search is launched
		SearchResults.on('launch', function() {
			if ( $('#shopcart').hasClass('toggle') ) {
				$('#shopcart').next().click();
			}
		});

	},
};

});
