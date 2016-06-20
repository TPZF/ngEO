var Logger = require('logger');
var Configuration = require('configuration');
var DatasetAuthorizations = require('search/model/datasetAuthorizations');
var Map = require('map/map');
var MapUtils = require('map/utils');
var SelectHandler = require('map/selectHandler');

var _browseLayerMap = {};
var _browseAccessInformationMap = {};

/**
 * Get the key to be used in the map for the given browse info
 */
var _getKey = function(browseInfo) {
	// Note : use filename if url not present because of some problems with WEBS
	return (browseInfo.eop_url || browseInfo.eop_filename) + browseInfo.eop_layer;
};

/**
 *	Creates a dictionary containing the array of features depending on index
 *	Basically creates an object with keys(the same as _browseAccessInformationMap) with each key,
 *	containing the array with features belonging to this key
 */
var _buildDicoByKey = function(features) {
	var dico = {};
	for (var i = 0; i < features.length; i++) {
		var feature = features[i];
		var browseInfo = _getBrowseInformation(feature);
		if (browseInfo) {
			var key = _getKey(browseInfo);
			if (!dico.hasOwnProperty(key)) {
				dico[key] = [];
			}
			dico[key].push(feature);
		}
	}
	return dico;
}

// Helper function to sort BrowsesLayer by time
var sortByTime = function(a, b) {
	return new Date(a.time) - new Date(b.time);
};

// Helper function to sort features by date
var sortFeatureByDate = function(a, b) {
	return new Date(a.properties.EarthObservation.gml_endPosition) - new Date(b.properties.EarthObservation.gml_endPosition);
}

/**
 *	Sort highlighted features on top of any other browse
 */
var sortHighlightedFeatures = function(highlightedFeatures, allBrowses) {

	var mapEngine = Map.getMapEngine();
	// Sort them by date
	highlightedFeatures.sort(sortFeatureByDate);
	_.each(highlightedFeatures, function(feature, i) {
		// Search for the given browse according to feature.id(could be multiple in case of shopcart)
		var highlightedBrowses = _.filter(allBrowses, function(browse) {
			return browse.params.name == feature.id;
		});

		// Finally set the layer index for the found browses to be on top of all other browses
		_.each(highlightedBrowses, function(browse, j) {
			// NGEO-1779: HACK use base layer index < 100 so the overlays/footprint layers are always over browses
			// TODO: add zIndex management for footprint/overlay layers
			mapEngine.setLayerIndex(browse.engineLayer, allBrowses.length /* + i + 100 */ );
		});
	});
}

module.exports = {

	/**
	 * Add a browse
	 *
	 * @param feature		The feature to add
	 * @param datasetId		The parent dataset id
	 */
	addBrowse: function(feature, datasetId) {

		var browseInfo = Configuration.getMappedProperty(feature, "browseInformation", null);
		var isPlanned = (Configuration.getMappedProperty(feature, "status") == "PLANNED"); // NGEO-1775 : no browse for planned features
		// NB: NGEO-1812: Use isEmptyObject to check that browseInfo exists AND not empty (server sends the response not inline with ICD)
		if (!$.isEmptyObject(browseInfo) && !isPlanned) {
			var key = _getKey(browseInfo);
			if (DatasetAuthorizations.hasBrowseAuthorization(datasetId, browseInfo.eop_layer)) {

				var browseLayer = _browseLayerMap[key];
				if (!browseLayer) {
					browseLayer = _browseLayerMap[key] = Map.addLayer({
						name: browseInfo.eop_layer,
						type: "Browses",
						visible: true
					});
				}
				browseLayer.addBrowse(feature, browseInfo);

			} else if (!_browseAccessInformationMap[key]) {
				Logger.inform("You do not have enough permission to browse the layer " + browseInfo.eop_layer + ".");
				_browseAccessInformationMap[key] = true;
			}
		}

	},

	/**
	 * Remove a browse
	 *
	 * @param feature		The feature to remove
	 */
	removeBrowse: function(feature) {

		var browseInfo = Configuration.getMappedProperty(feature, "browseInformation");
		if (browseInfo) {
			var key = _getKey(browseInfo);
			var browseLayer = _browseLayerMap[key];
			if (browseLayer) {
				browseLayer.removeBrowse(feature.id);

				if (browseLayer.isEmpty()) {
					Map.removeLayer(browseLayer);
					delete _browseLayerMap[key];
				}
			}
		}
	},

	/**
	 *	Get browse layer with the given feature collection
	 */
	getBrowseLayer: function(fc) {
		// HACK: Get the first one for now
		var feature = fc.features[0];
		if ( feature ) {
			var browseInfo = Configuration.getMappedProperty(feature, "browseInformation");
			if (browseInfo) {
				var key = _getKey(browseInfo);
				return _browseLayerMap[key];
			}
		}
		return null;
	},

	/**
	 *	Update order of browses rendering depending on time attribute of each browse
	 *	with highlighted features on top
	 *
	 *	@param highlightedFeatures
	 *		Features that were highlighted
	 */
	updateRenderOrder: function(highlightedFeatures) {

		// Extract all the browses for each feature collection and sort them by time
		var allBrowses = [];
		for (var key in _browseLayerMap) {
			allBrowses = allBrowses.concat(_browseLayerMap[key].getBrowses());
		}
		allBrowses.sort(sortByTime);

		if (allBrowses.length > 0) {
			var mapEngine = Map.getMapEngine();

			// Then modify the browse layer indices
			_.each(allBrowses, function(browse, i) {
				// NGEO-1779: HACK use base layer index < 100 so the overlays/footprint layers are always over browses
				// TODO: add zIndex management for footprint/overlay layers
				mapEngine.setLayerIndex(browse.engineLayer, i /* + 100 */ );
			});

			// NGEOD-890: The highlighted features need to be shown over any other browse
			if (highlightedFeatures) {
				sortHighlightedFeatures(highlightedFeatures, allBrowses);
			}
		}
	}
};