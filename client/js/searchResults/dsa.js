
define(["jquery", "logger", "map/map", "map/selectHandler", 
        "searchResults/model/searchResults", "searchResults/view/searchResultsView",
        "searchResults/view/searchResultsTableView2", "map/widget/mapPopup"], 
	function($, Logger, Map, SelectHandler, SearchResults, SearchResultsView, SearchResultsTableView,
			MapPopup) {

// Private variable
var _views = {};

var _onSelectFeatures = function(features,fc) {
	for ( var i = 0; i < features.length; i++ ) {
		if ( fc.isHighlighted(features[i]) ) {
			fc._footprintLayer.modifyFeaturesStyle([features[i]], "highlight-select" );
		} else {
			fc._footprintLayer.modifyFeaturesStyle([features[i]], "select" );
		}
	}
	
	fc._browsesLayer.addFeatures(features);
	
	// Only display browse if the user has view access
/*	if ( DatasetSearch.get("viewAccess") ) {
		browsesLayer.addFeatures(features);
	} else if (!viewAccessInformation) {
		Logger.inform("You do not have enough permission to view the product.");
		viewAccessInformation = true;
	}*/
};

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
/*		if ( DatasetSearch.get("viewAccess") ) {
			browsesLayer.addFeatures(features);
		} else if (!viewAccessInformation) {
			Logger.inform("You do not have enough permission to view the product.");
			viewAccessInformation = true;
		}*/
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
				style: "results-footprint"
			});
			var browsesLayer = Map.addLayer({
				name: fc.id + " Result Browses",
				type: "Browses",
				visible: true
			});
			fc._footprintLayer = footprintLayer;
			fc._browsesLayer = browsesLayer;
			fc.on('add:features', footprintLayer.addFeatures, footprintLayer);
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
			// update the toolbar
			$('#result' + fc.id)
				.remove();
			$('#dateRangeSlider').css('left', $('#bottomToolbar').outerWidth() );
			var slider = $("#dateRangeSlider").data("dateRangeSlider");
			if (slider) slider.refresh();
			
			_views[ fc.id ].remove();
			delete _views[ fc.id ];
			
			fc.off('add:features', fc._footprintLayer.addFeatures, fc._footprintLayer);
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
/*		
		
		// Connect search results events with map
		var footprintLayer = Map.addLayer({
			name: "Result Footprints",
			type: "Feature",
			visible: true,
			style: "results-footprint"
		});
		var browsesLayer = Map.addLayer({
			name: "Result Browses",
			type: "Browses",
			visible: true
		});
		
		var viewAccessInformation = false;
		SearchResults.on('reset:features', function() {
			footprintLayer.clear();
			browsesLayer.clear();
			viewAccessInformation = false;
		});
		
		SearchResults.on('add:features', footprintLayer.addFeatures, footprintLayer);
		SearchResults.on('zoomToFeature', Map.zoomToFeature);
		
		SearchResults.on('selectFeatures', function(features,searchResults) {
			for ( var i = 0; i < features.length; i++ ) {
				if ( searchResults.isHighlighted(features[i]) ) {
					footprintLayer.modifyFeaturesStyle([features[i]], "highlight-select" );
				} else {
					footprintLayer.modifyFeaturesStyle([features[i]], "select" );
				}
			}
			// Only display browse if the user has view access
			if ( DatasetSearch.get("viewAccess") ) {
				browsesLayer.addFeatures(features);
			} else if (!viewAccessInformation) {
				Logger.inform("You do not have enough permission to view the product.");
				viewAccessInformation = true;
			}
		});
		SearchResults.on('unselectFeatures', function(features,searchResults) {
			for ( var i = 0; i < features.length; i++ ) {
				if ( searchResults.isHighlighted(features[i]) ) {
					footprintLayer.modifyFeaturesStyle([features[i]], "highlight" );
				} else {
					footprintLayer.modifyFeaturesStyle([features[i]], "default" );
					browsesLayer.removeFeatures([features[i]]);
				}
			}
		});
		SearchResults.on('highlightFeatures', function(features,prevFeatures,searchResults) {
			
			if ( prevFeatures ) {
				
				for ( var i = 0; i < prevFeatures.length; i++ ) {

					if ( searchResults.isSelected(prevFeatures[i]) ) {
						footprintLayer.modifyFeaturesStyle([prevFeatures[i]], "select" );
					} else {
						footprintLayer.modifyFeaturesStyle([prevFeatures[i]], "default" );
						browsesLayer.removeFeatures([prevFeatures[i]]);
					}
				}
			}
			
			if ( features ) {
				for ( var i = 0; i < features.length; i++ ) {
					if ( searchResults.isSelected(features[i]) ) {
						footprintLayer.modifyFeaturesStyle([features[i]], "highlight-select" );
					} else {
						footprintLayer.modifyFeaturesStyle([features[i]], "highlight" );
					}
				}
				// Only display browse if the user has view access
				if ( DatasetSearch.get("viewAccess") ) {
					browsesLayer.addFeatures(features);
				} else if (!viewAccessInformation) {
					Logger.inform("You do not have enough permission to view the product.");
					viewAccessInformation = true;
				}
			}
		});	*/
		
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

	},
};

});
