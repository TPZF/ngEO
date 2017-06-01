var Logger = require('logger');
var BrowsesManager = require('searchResults/browsesManager');
var Map = require('map/map');
var SelectHandler = require('map/selectHandler');
var ProductService = require('ui/productService');

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
		if (fc.isHighlighted(feature) || fc.isSelected(feature)) {
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
		BrowsesManager.addBrowse(feature, fc.id);
	}
};

// Call when a feature is selected to synchronize the map
var _onSelectFeatures = function(features, fc) {
	fc._footprintLayer.modifyFeaturesStyle(features, "select");
	Map.trigger("selectFeatures", features);
};

// Call when a feature is unselected to synchronize the map
var _onUnselectFeatures = function(features, fc) {
	features.forEach(function(_f) {
		if (_f._featureCollection.isHighlighted(_f)) {
			fc._footprintLayer.modifyFeaturesStyle([_f], "highlight");
		} else {
			fc._footprintLayer.modifyFeaturesStyle([_f], "default");
			BrowsesManager.removeBrowse(_f);
		}
	})
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
var _onHighlightFeatures = function(features, fc) {

	var highlightedFeats = [];
	if (features && features.length > 0) {
		// Highlight currently selected features
		for (var i = 0; i < features.length; i++) {
			var feature = features[i];
			fc._footprintLayer.modifyFeaturesStyle([feature], "highlight");
			BrowsesManager.addBrowse(feature, fc.getDatasetId(feature));
			//HACK add feature collection since it does not contain the feature collection
			feature._featureCollection = fc;
			highlightedFeats.push(feature);
		}
		ProductService.addBrowsedProducts(features);
	}
	_updateFeaturesWithBrowse(features);
	Map.trigger("highlightFeatures", features);
};

// Call when a feature is highlighted to synchronize the map
var _onUnHighlightFeatures = function(features, fc) {

	// for previous features to unhighlight
	if (features && features.length > 0) {

		// Set to default the footprint of previously selected features
		for (var i = 0; i < features.length; i++) {
			var feature = features[i];
			if (feature._featureCollection.isSelected(feature)) {
				fc._footprintLayer.modifyFeaturesStyle([feature], "select");
			} else {
				fc._footprintLayer.modifyFeaturesStyle([feature], "default");
				BrowsesManager.removeBrowse(feature);
			}
		}
		ProductService.removeBrowsedProducts(features);
	}
	//_updateFeaturesWithBrowse(featuresToHighLight);
	// update mapPopup
	Map.trigger("unhighlightFeatures", features);
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

		var ctrlOrCmdPressed = false;

		var onKeyDown = function(e) {
			if ( e.ctrlKey || e.metaKey ) {
				ctrlOrCmdPressed = true;
			}
		};

		var onKeyUp = function(e) {
			ctrlOrCmdPressed = e.ctrlKey || e.metaKey;
		};
		
		document.addEventListener('keydown', onKeyDown);
		document.addEventListener('keyup', onKeyUp);

		// Connect with map feature picking
		Map.on('pickedFeatures', function(features, featureCollections) {
			var highlights = {};
			var featsToAdd = [];
			var featsToRemove = [];
			// if ctrl key is pressed and one or more features are picked
			if (ctrlOrCmdPressed && features.length > 0) {
				features.forEach (function(_feat) {
					// if feature is already highlighted > add to remove array
					// if feature is not already highlighted > add to add array
					if (_.find(ProductService.getHighlightedProducts(), function(_highlighted) {
						return _feat.id === _highlighted.id;
					})) {
						featsToRemove.push(_feat);
					} else {
						featsToAdd.push(_feat);
					}
				});
			} else {
				featsToAdd = features;
			}
			ProductService.removeHighlightedProducts(featsToRemove);
			ProductService.addHighlightedProducts(featsToAdd);
			// reinit map of highlights
			for (var i = 0; i < featureCollections.length; i++) {
				highlights[featureCollections[i].id] = [];
			}
			// set highlights for feats to add
			for (var i = 0; i < featsToAdd.length; i++) {
				var fc = featsToAdd[i]._featureCollection;
				highlights[fc.id].push(featsToAdd[i]);
			}
			// add checked features to highlights
			for (var i = 0; i < featureCollections.length; i++) {
				// Ctrl key not pressed > unhighlight unchecked products
				// no features picked > unhighlight unchecked products
				if (!ctrlOrCmdPressed || features.length === 0) {
					featureCollections[i].checkAllHighlight();
				}
				featureCollections[i].setHighlight(highlights[featureCollections[i].id]);
			}
			// unset highlights for feats to remove
			for (var i = 0; i < featsToRemove.length; i++) {
				var fc = featsToRemove[i]._featureCollection;
				fc.unsetHighlight([featsToRemove[i]]);
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

			// NGEO-1779: footprint layers should be always on top
			Map.getMapEngine().setLayerIndex(footprintLayer.engineLayer, 99999);
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
		fc.on('unhighlightFeatures', _onUnHighlightFeatures);
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

		// Remove browse on highlight and selections
		for (var i = 0; i < fc.highlights.length; i++) {
			BrowsesManager.removeBrowse(fc.highlights[i]);
		}

		SelectHandler.removeFeatureCollection(fc);

	}
};