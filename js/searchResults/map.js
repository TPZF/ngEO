
define(["jquery", "logger", "map/map", "map/selectHandler"], 
	function($, Logger, Map, SelectHandler) {


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
	if ( fc._browsesLayer ) {
		if ( fc.viewAccess ) {
			fc._browsesLayer.addFeatures(features);
		} else if (!fc._viewAccessInformation) {
			Logger.inform("You do not have enough permission to view the product.");
			fc._viewAccessInformation = true;
		}
	}
};

// Call when a feature is unselected to synchronize the map
var _onUnselectFeatures = function(features,fc) {
	for ( var i = 0; i < features.length; i++ ) {
		if ( fc.isHighlighted(features[i]) ) {
			fc._footprintLayer.modifyFeaturesStyle([features[i]], "highlight" );
		} else {
			fc._footprintLayer.modifyFeaturesStyle([features[i]], "default" );
		
			if ( fc._browsesLayer ) {
				fc._browsesLayer.removeFeatures([features[i]]);
			}
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
				if ( fc._browsesLayer ) {
					fc._browsesLayer.removeFeatures([prevFeatures[i]]);
				}
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
		
		if ( fc._browsesLayer ) {
			fc._browsesLayer.addFeatures(features);

			// Only display browse if the user has view access
			if ( fc.viewAccess ) {
				fc._browsesLayer.addFeatures(features);
			} else if (!fc._viewAccessInformation) {
				Logger.inform("You do not have enough permission to view the product.");
				fc._viewAccessInformation = true;
			}
		}
	}
};

// Connect with map feature picking
Map.on('pickedFeatures', function(features, event, featureCollections) {

	var highlights = {}
	for ( var i = 0; i < featureCollections.length; i++ ) {
		highlights[ featureCollections[i].id ] = [];
	}
	
	for ( var i = 0; i < features.length; i++ ) {
		var fc = features[i]._featureCollection;
		highlights[fc.id].push( features[i] );
	}
	
	for ( var i = 0; i < featureCollections.length; i++ ) {
		featureCollections[i].highlight( highlights[ featureCollections[i].id ] );
	}
});



return {
	
	/**
	 * Add a feature collection to be displayed on the map
	 *
	 * @param fc 			The feature collection
	 * @param options		Options for visualization
	 */
	 addFeatureCollection: function(fc, options) {
						
			var footprintLayer = options.layer;

			if (!footprintLayer) {
				footprintLayer = Map.addLayer({
					name: options.layerName + " Footprints",
					type: "Feature",
					visible: true,
					style: options.style,
					greatCircle: true
				});
			}
			
			if ( options.hasBrowse ) {
				var browsesLayer = Map.addLayer({
					name: options.layerName + " Browses",
					type: "Browses",
					visible: true
				});
				fc._browsesLayer = browsesLayer;
				fc.on('reset:features', browsesLayer.clear, browsesLayer);
			}
			
			fc._footprintLayer = footprintLayer;
			fc.on('add:features', footprintLayer.addFeatures, footprintLayer);
			fc.on('remove:features', footprintLayer.removeFeatures, footprintLayer);
			fc.on('reset:features', footprintLayer.clear, footprintLayer);
			
			fc.on('selectFeatures', _onSelectFeatures );
			fc.on('unselectFeatures', _onUnselectFeatures );
			fc.on('highlightFeatures', _onHighlightFeatures );
			
			SelectHandler.addFeatureCollection(fc);
		},
	
	/**
	 * Remove a feature collection to be displayed on the map
	 *
	 * @param fc 	The feature collection
	 */
	removeFeatureCollection: function(fc) {
			
			fc.off('add:features', fc._footprintLayer.addFeatures, fc._footprintLayer);
			fc.off('remove:features', fc._footprintLayer.removeFeatures, fc._footprintLayer);
			fc.off('reset:features', fc._footprintLayer.resetFeatures, fc._footprintLayer);
			fc.off('selectFeatures', _onSelectFeatures );
			fc.off('unselectFeatures', _onUnselectFeatures );
			fc.off('highlightFeatures', _onHighlightFeatures );
			Map.removeLayer( fc._footprintLayer );
			
			if ( fc._browsesLayer ) {
				fc.off('reset:features', fc._browsesLayer.clear, fc._browsesLayer);
				Map.removeLayer( fc._browsesLayer );
			}
			
			SelectHandler.removeFeatureCollection(fc);
			
	}
};

});
