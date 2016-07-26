var Logger = require('logger');
var BrowsesManager = require('searchResults/browsesManager');
var Map = require('map/map');
var SelectHandler = require('map/selectHandler');

/**
 *	Update the array of selected/highlighted features
 *	which need to update its render order
 */
var _updateFeaturesWithBrowse = function(features) {
	var beforeLen = _featuresWithBrowse.length;
	_featuresWithBrowse = _.union(_featuresWithBrowse, features);
	if ( _featuresWithBrowse.length != beforeLen ) {
		_lazyRenderOrdering();
	}
}

// Called when feature is hidden
var _onHideFeatures = function(features, fc) {

	// Remove browses of all hidden features
	for (var i = 0; i < features.length; i++) {
		var feature = features[i];
		BrowsesManager.removeBrowse(feature);
	}
	// Remove footprints from map
	fc._footprintLayer.removeFeatures(features);
};

// Called when feature is shown
var _onShowFeatures = function(features, fc) {

	// Add browses for highlighted or selected features
	for (var i = 0; i < features.length; i++) {
		var feature = features[i];
		if ( (fc.isHighlighted(feature) || fc.isSelected(feature)) && feature._browseShown) {
			BrowsesManager.addBrowse(feature);
		}
	}
	_updateFeaturesWithBrowse(features);

	// Add footprints to map
	fc._footprintLayer.addFeatures(features);
};

// Called when feature browse is hidden
var _onHideBrowses = function(features, fc) {
	for (var i=0; i<features.length; i++) {
		var feature = features[i];
		delete feature._browseShown;
		BrowsesManager.removeBrowse(feature);
	}
};

// Called when feature browse is shown
var _onShowBrowses = function(features, fc) {
	for (var i=0; i<features.length; i++) {
		var feature = features[i];
		feature._browseShown = true;

		BrowsesManager.addBrowse(feature, fc.dataset.get("datasetId"));
	}
};

// Call when a feature is selected to synchronize the map
var _onSelectFeatures = function(features, fc) {
	for (var i = 0; i < features.length; i++) {
		var feature = features[i];
		if (fc.isHighlighted(feature)) {
			fc._footprintLayer.modifyFeaturesStyle([feature], "highlight-select");
		} else {
			fc._footprintLayer.modifyFeaturesStyle([feature], "select");
		}

		if ( feature._browseShown )
			BrowsesManager.addBrowse(feature, fc.getDatasetId(feature));
	}
	_updateFeaturesWithBrowse(features);
};


// Call when a feature is unselected to synchronize the map
var _onUnselectFeatures = function(features, fc) {
	for (var i = 0; i < features.length; i++) {
		var feature = features[i];
		if (fc.isHighlighted(feature)) {
			fc._footprintLayer.modifyFeaturesStyle([feature], "highlight");
		} else {
			fc._footprintLayer.modifyFeaturesStyle([feature], "default");
			BrowsesManager.removeBrowse(feature);
		}
	}
	Map.trigger("unselectFeatures");
};

// Selected or highlighted features with browse
var _featuresWithBrowse = [];
var waitTimeout = 10; // in ms
// Helper debounce function which triggers updateRenderOrder method
// after LAST highlight/select event has been triggered(in condition that it doesn't takes > waitTimeout)
var _lazyRenderOrdering = _.debounce(function() {
	BrowsesManager.updateRenderOrder(_featuresWithBrowse);
	_featuresWithBrowse = [];
}, waitTimeout);

// Call when a feature is highlighted to synchronize the map
var _onHighlightFeatures = function(features, prevFeatures, fc) {

	if (prevFeatures.length > 0) {

		// Set to default the footprint of previously selected features
		for (var i = 0; i < prevFeatures.length; i++) {

			if (fc.isSelected(prevFeatures[i])) {
				fc._footprintLayer.modifyFeaturesStyle([prevFeatures[i]], "select");
			} else {
				fc._footprintLayer.modifyFeaturesStyle([prevFeatures[i]], "default");
				BrowsesManager.removeBrowse(prevFeatures[i]);
			}
		}
	}

	var highlightedFeats = [];
	if (features.length > 0) {
		// Highlight currently selected features
		for (var i = 0; i < features.length; i++) {
			var feature = features[i];
			if (fc.isSelected(feature)) {
				fc._footprintLayer.modifyFeaturesStyle([feature], "highlight-select");

			} else {
				fc._footprintLayer.modifyFeaturesStyle([feature], "highlight");
			}
			if ( feature._browseShown )
				BrowsesManager.addBrowse(feature, fc.getDatasetId(feature));

			//HACK add feature collection since it does not contain the feature collection
			feature._featureCollection = fc;
			highlightedFeats.push(feature);
		}
	}
	_updateFeaturesWithBrowse(features);
	Map.trigger("highlightFeatures", highlightedFeats);
};

module.exports = {

	/**
	 *	Initialize picked features event
	 *	Used only to ensure the ORDER of event binding
	 *
	 *	Highlight event should be triggered AFTER status panel reacted to 'pickedFeatures'
	 *	so table view could react on highlight to features which it contains
	 */
	initialize: function() {
		// Connect with map feature picking
		Map.on('pickedFeatures', function(features, featureCollections) {
			var highlights = {}
			for (var i = 0; i < featureCollections.length; i++) {
				highlights[featureCollections[i].id] = [];
			}

			for (var i = 0; i < features.length; i++) {
				var fc = features[i]._featureCollection;
				highlights[fc.id].push(features[i]);
			}

			for (var i = 0; i < featureCollections.length; i++) {
				featureCollections[i].highlight(highlights[featureCollections[i].id]);
			}
		});
	},

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
		fc.on('add:child', this.addFeatureCollection);
		fc.on('remove:child', this.removeFeatureCollection);

		fc.on('show:features', _onShowFeatures, footprintLayer);
		fc.on('hide:features', _onHideFeatures, footprintLayer);
		fc.on('selectFeatures', _onSelectFeatures);
		fc.on('unselectFeatures', _onUnselectFeatures);
		fc.on('highlightFeatures', _onHighlightFeatures);
		fc.on('show:browses', _onShowBrowses);
		fc.on('hide:browses', _onHideBrowses);

		SelectHandler.addFeatureCollection(fc);
	},

	/**
	 * Remove a feature collection to be displayed on the map
	 *
	 * @param fc 	The feature collection
	 */
	removeFeatureCollection: function(fc, options) {

		fc.off('add:features', fc._footprintLayer.addFeatures, fc._footprintLayer);
		fc.off('remove:features', fc._footprintLayer.removeFeatures, fc._footprintLayer);
		fc.off('reset:features', fc._footprintLayer.resetFeatures, fc._footprintLayer);
		fc.off('add:child', this.addFeatureCollection);
		fc.off('remove:child', this.removeFeatureCollection);

		fc.off('show:features', fc._footprintLayer.addFeatures, fc._footprintLayer);
		fc.off('hide:features', fc._footprintLayer.removeFeatures, fc._footprintLayer);
		fc.off('selectFeatures', _onSelectFeatures);
		fc.off('unselectFeatures', _onUnselectFeatures);
		fc.off('highlightFeatures', _onHighlightFeatures);
		fc.off('show:browses', _onShowBrowses);
		fc.off('hide:browses', _onHideBrowses);

		if (!options || !options.keepLayer) {
			Map.removeLayer(fc._footprintLayer);
		}

		// Remove browse on highlight and selection
		for (var i = 0; i < fc.highlights.length; i++) {
			BrowsesManager.removeBrowse(fc.highlights[i]);
		}
		for (var i = 0; i < fc.selection.length; i++) {
			BrowsesManager.removeBrowse(fc.selection[i]);
		}

		SelectHandler.removeFeatureCollection(fc);

	}
};