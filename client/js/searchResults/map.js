
define(["jquery", "logger", "searchResults/browsesManager", "map/map", "map/selectHandler"], 
	function($, Logger, BrowsesManager, Map, SelectHandler) {


// Call when a feature is selected to synchronize the map
var _onSelectFeatures = function(features, fc) {
	for ( var i = 0; i < features.length; i++ ) {
		if ( fc.isHighlighted(features[i]) ) {
			fc._footprintLayer.modifyFeaturesStyle([features[i]], "highlight-select" );
		} else {
			fc._footprintLayer.modifyFeaturesStyle([features[i]], "select" );
		}
		
		BrowsesManager.addBrowse(features[i],fc.getDatasetId(features[i]));
	}
};

// Call when a feature is unselected to synchronize the map
var _onUnselectFeatures = function(features, fc) {
	for ( var i = 0; i < features.length; i++ ) {
		if ( fc.isHighlighted(features[i]) ) {
			fc._footprintLayer.modifyFeaturesStyle([features[i]], "highlight" );
		} else {
			fc._footprintLayer.modifyFeaturesStyle([features[i]], "default" );
		
			BrowsesManager.removeBrowse(features[i]);
		}
	}
};

// Call when a feature is highlighted to synchronize the map
var _onHighlightFeatures = function(features, prevFeatures, fc) {
	
	if ( prevFeatures.length > 0 ) {
		
		for ( var i = 0; i < prevFeatures.length; i++ ) {

			if ( fc.isSelected(prevFeatures[i]) ) {
				fc._footprintLayer.modifyFeaturesStyle([prevFeatures[i]], "select" );
			} else {
				fc._footprintLayer.modifyFeaturesStyle([prevFeatures[i]], "default" );
				BrowsesManager.removeBrowse(prevFeatures[i]);
			}
		}
	}
	
	if ( features.length > 0 ) {
		for ( var i = 0; i < features.length; i++ ) {
			if ( fc.isSelected(features[i]) ) {
				fc._footprintLayer.modifyFeaturesStyle([features[i]], "highlight-select" );
			} else {
				fc._footprintLayer.modifyFeaturesStyle([features[i]], "highlight" );
			}
			BrowsesManager.addBrowse(features[i],fc.getDatasetId(features[i]));
		}

		BrowsesManager.updateRenderOrder( features );
	} else {
		BrowsesManager.updateRenderOrder();
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
	removeFeatureCollection: function(fc,options) {
			
			fc.off('add:features', fc._footprintLayer.addFeatures, fc._footprintLayer);
			fc.off('remove:features', fc._footprintLayer.removeFeatures, fc._footprintLayer);
			fc.off('reset:features', fc._footprintLayer.resetFeatures, fc._footprintLayer);
			fc.off('selectFeatures', _onSelectFeatures );
			fc.off('unselectFeatures', _onUnselectFeatures );
			fc.off('highlightFeatures', _onHighlightFeatures );
			
			if ( !options || !options.keepLayer ) {
				Map.removeLayer( fc._footprintLayer );
			}
			
			// Remove browse on highlight and selection
			for ( var i = 0; i < fc.highlights.length; i++ ) {
				BrowsesManager.removeBrowse(fc.highlights[i]);
			}
			for ( var i = 0; i < fc.selection.length; i++ ) {
				BrowsesManager.removeBrowse(fc.selection[i]);
			}
					
			SelectHandler.removeFeatureCollection(fc);
			
	}
};

});
