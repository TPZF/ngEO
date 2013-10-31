
define(["jquery", "logger", "map/map", "map/selectHandler", 
        "search/model/datasetSearch", "searchResults/model/searchResults",
        "searchResults/view/searchResultsTableView2", "map/widget/mapPopup"], 
	function($, Logger, Map, SelectHandler, DatasetSearch, SearchResults, SearchResultsTableView,
			MapPopup) {

// Private variable
var _$resultsTableWidget;

return {
	
	/**
	 * Initialize the search results component for data-services-area.
	 *
	 * @param element 	The root element of the data-services-area
	 * @param router 	The data-services-area router
	 */
	 initialize: function(element, router, panelManager) {
	
		// When the a dataset is changed, reset the search results
		DatasetSearch.on('change:datasetId', function() {
			SearchResults.reset();
		});
		
		// Create the results table view
		var tableView = new SearchResultsTableView({ 
			model : SearchResults 
		});
		panelManager.bottom.addStatus({
			activator: '#result',
			show: function() {
				$('#datasetMessage').show();
				$('#paging a').show();
				$('#resultsMessage').show();
			},
			hide: function() {
				$('#datasetMessage').hide();
				$('#paging a').hide();
				$('#resultsMessage').hide();
			},
			tableView: tableView
		});
		tableView.render();
		
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
		});	
		
		// Initialize the default handler
		SelectHandler.initialize({
			layer: footprintLayer
		});
		// Start it
		SelectHandler.start();
		
		// Create the popup for the map
		var mapPopup = new MapPopup('#mapContainer');
		mapPopup.close();		

		// Connect with map feature picking
		Map.on('pickedFeatures', SearchResults.highlight, SearchResults);
		
		//display a pop-up message when the product search has failed
		SearchResults.on('error:features', function(searchUrl){
			Logger.error('An error occured when retrieving the products with the search url :<br>' + searchUrl);
		});
		SearchResults.on('startLoading', function() {
		
			$('#paging a').addClass('ui-disabled');

			var $resultsMessage = $('#resultsMessage');
			$resultsMessage.html( "Searching..." );
			
			// Pulsate animation when searching
			var fadeOutOptions = {
				duration: 300,
				easing: "linear",
				complete: function() {
					$(this).animate({opacity:1.0},fadeInOptions);
				}
			};
			var fadeInOptions = {
				duration: 300,
				easing: "linear",
				complete: function() {
					$(this).animate({opacity:0.2},fadeOutOptions);
				}
			};
			$resultsMessage.animate({opacity:0.2},fadeOutOptions);
			$resultsMessage.show();
		});
		
		SearchResults.on('reset:features', function() {
			$('#paging a').addClass('ui-disabled');
			var $resultsMessage = $('#resultsMessage');
			$resultsMessage.hide();
		});
		
		SearchResults.on('add:features', function(features) {
			var $resultsMessage = $('#resultsMessage');
			$resultsMessage.stop(true);
			$resultsMessage.css('opacity',1.0);
			$resultsMessage.show();
			
			if ( SearchResults.totalResults != 0 ) {
				var startIndex = 1 + (SearchResults.currentPage-1) * SearchResults.countPerPage;
				$resultsMessage.html( 'Showing ' + startIndex + ' to ' + (startIndex + features.length - 1) + " of " + SearchResults.totalResults + " products." );
				
				// Updage paging button according to the current page
				$('#paging a').removeClass('ui-disabled');
				if ( SearchResults.currentPage == 1 ) {
					$('#paging_prev').addClass('ui-disabled');
					$('#paging_first').addClass('ui-disabled');
				} 
				if ( SearchResults.currentPage == SearchResults.lastPage ) {
					$('#paging_next').addClass('ui-disabled');
					$('#paging_last').addClass('ui-disabled');
				}
			} else {
				$resultsMessage.html( 'No product found.' );
			}
		});
		
		// To start paging is disable
		$('#paging a').addClass('ui-disabled');

		// Manage paging through buttons
		$('#paging_first').click( function() {
			SearchResults.changePage(1);
		});
		$('#paging_last').click( function() {
			SearchResults.changePage( SearchResults.lastPage );
		});
		$('#paging_next').click( function() {
			SearchResults.changePage( SearchResults.currentPage + 1 );
		});
		$('#paging_prev').click( function() {
			SearchResults.changePage( SearchResults.currentPage - 1 );
		});
		
	},
};

});
