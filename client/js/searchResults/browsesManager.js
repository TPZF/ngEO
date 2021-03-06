var Logger = require('logger');
var Configuration = require('configuration');
var DatasetAuthorizations = require('search/model/datasetAuthorizations');
var DataSetPopulation = require('search/model/dataSetPopulation');
var Map = require('map/map');
var MapUtils = require('map/utils');
var SelectHandler = require('map/selectHandler');
var SearchResults = require('searchResults/model/searchResults');

var _browseLayerMap = {};
var _browseAccessInformationMap = {};

/**
 * Get the url to be used in the map for the given browse info
 * @param {object} myBrowseObject
 * @returns {string | null}
 */
var _getUrl = function (myBrowseObject) {
	return Configuration.getMappedProperty(myBrowseObject, 'browseUrl', null);
};

/**
 * Get crossOrigin to be used in the map for the given browse info
 * @param {object} myBrowseObject
 * @returns {string | null}
 */
var _getCrossOrigin = function (myBrowseObject) {
	return Configuration.getMappedProperty(myBrowseObject, 'browseCrossOrigin', null);
};


/**
 *	Creates a dictionary containing the array of features depending on index
 *	Basically creates an object with keys(the same as _browseAccessInformationMap) with each key,
 *	containing the array with features belonging to this key
 *	Take url as a key
 */
var _buildDicoByKey = function (features) {
	var dico = {};
	for (var i = 0; i < features.length; i++) {
		var feature = features[i];
		var browseInfo = _getBrowseInformation(feature);
		if (browseInfo) {
			var url = _getUrl(browseInfo);
			if (!dico.hasOwnProperty(url)) {
				dico[url] = [];
			}
			dico[url].push(feature);
		}
	}
	return dico;
}

// Helper function to sort BrowsesLayer by time
var sortByTime = function (a, b) {
	return new Date(a.time) - new Date(b.time);
};

// Helper function to sort features by date
var sortFeatureByDate = function (a, b) {
	return new Date(a.properties.EarthObservation.gml_endPosition) - new Date(b.properties.EarthObservation.gml_endPosition);
}

/**
 *	Sort highlighted features on top of any other browse
 */
var sortHighlightedFeatures = function (highlightedFeatures, allBrowses) {

	var mapEngine = Map.getMapEngine();
	// Sort them by date
	highlightedFeatures.sort(sortFeatureByDate);
	_.each(highlightedFeatures, function (feature, i) {
		// Search for the given browse according to feature.id(could be multiple in case of shopcart)
		var highlightedBrowses = _.filter(allBrowses, function (browse) {
			return browse.params.name == feature.id;
		});

		// Finally set the layer index for the found browses to be on top of all other browses
		_.each(highlightedBrowses, function (browse, j) {
			// NGEO-1779: HACK use base layer index < 100 so the overlays/footprint layers are always over browses
			// TODO: add zIndex management for footprint/overlay layers
			mapEngine.setLayerIndex(browse.engineLayer, allBrowses.length /* + i + 100 */);
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
	addBrowse: function (feature, datasetId, browseIndex) {

		var browses = Configuration.getMappedProperty(feature, "browses", null);
		var isPlanned = (Configuration.getMappedProperty(feature, "status") == "PLANNED"); // NGEO-1775 : no browse for planned features
		// NB: NGEO-1812: Use isEmptyObject to check that browses exists AND not empty (server sends the response not inline with ICD)
		if (!$.isEmptyObject(browses) && !isPlanned) {
			//var browseObject = _.find(browses, function(browse) { return browse.BrowseInformation._selected == true; });

			if (!browseIndex) {
				var fc = feature._featureCollection;
				browseIndex = fc.browseIndex;
			}

			for (var i = 0; i < browseIndex.length; i++) {
				var browseObject = browses[browseIndex[i]];
				if (browseObject) {
					browseObject.BrowseInformation._selected = true;

					var browseUrl = _getUrl(browseObject);
					var browseCrossOrigin = _getCrossOrigin(browseObject);
					var layerName = MapUtils.getLayerName(browseUrl);
					if (!layerName) {
						// Can't find the name of layer: it's impossible to add a new layer
						return null;
					}

					if (DatasetAuthorizations.hasBrowseAuthorization(datasetId, layerName)) {
						var browseLayer = _browseLayerMap[layerName];
						if (!browseLayer) {
							browseLayer = _browseLayerMap[layerName] = Map.addLayer({
								name: layerName,
								type: "Browses",
								visible: true
							});
						}
						browseLayer.addBrowse(feature, browseUrl, browseCrossOrigin);

					} else if (!_browseAccessInformationMap[browseUrl]) {
						Logger.inform("You do not have enough permission to browse the layer " + browseUrl + ".");
						_browseAccessInformationMap[browseUrl] = true;
					}
				}
			}


		}

	},

	/**
	 * Remove a browse
	 *
	 * @param feature		The feature to remove
	 */
	removeBrowse: function (feature, browseIndex) {

		var browses = Configuration.getMappedProperty(feature, "browses");
		if (browses) {
			// var selectedBrowse = _.find(browses, function(browse) { return browse.BrowseInformation._selected == true; });
			if (!browseIndex) {
				var fc = feature._featureCollection;
				// var browsesArray = Array.apply(null, Array(browses.length)).map(function (x, i) { return i; });
				// browseIndex = _.difference(browsesArray, fc.browseIndex);
				browseIndex = fc.browseIndex;
			}

			for (var i = 0; i < browseIndex.length; i++) {
				var browseObject = browses[browseIndex[i]];
				if (browseObject) {

					var layerName = MapUtils.getLayerName(_getUrl(browseObject));
					var browseLayer = _browseLayerMap[layerName];
					if (browseLayer) {
						var browseUrl = _getUrl(browseObject);
						browseLayer.removeBrowse(feature, browseUrl);

						if (browseLayer.isEmpty()) {
							Map.removeLayer(browseLayer);
							delete _browseLayerMap[layerName];
						}
					}
					delete browseObject.BrowseInformation._selected;
				}
			}

		}
	},

	/**
	 *	Get all selected browse layers for the given feature collection
	 */
	getSelectedBrowseLayers: function (fc) {
		var selectedBrowses = [];
		for (var i = 0; i < fc.features.length; i++) {
			var feature = fc.features[i];
			var browses = Configuration.getMappedProperty(feature, "browses");
			if (browses[0] !== undefined) {
				var selectedBrowse = _.find(browses, function (browse) { return browse.BrowseInformation._selected == true; });
				if (selectedBrowse) {
					var layerName = MapUtils.getLayerName(_getUrl(selectedBrowse));
					if (selectedBrowses.indexOf(_browseLayerMap[layerName]) == -1) {
						if (_browseLayerMap[layerName]) {
							selectedBrowses.push(_browseLayerMap[layerName]);
						}
					}
				}
			}
		}
		return selectedBrowses;
	},

	/**
	 *	Update order of browses rendering depending on time attribute of each browse
	 *	with highlighted features on top
	 *
	 *	@param highlightedFeatures
	 *		Features that were highlighted
	 */
	updateRenderOrder: function (highlightedFeatures) {

		// Extract all the browses for each feature collection and sort them by time
		var allBrowses = [];
		for (var key in _browseLayerMap) {
			allBrowses = allBrowses.concat(_browseLayerMap[key].getBrowses());
		}
		allBrowses.sort(sortByTime);

		if (allBrowses.length > 0) {
			var mapEngine = Map.getMapEngine();

			// Then modify the browse layer indices
			_.each(allBrowses, function (browse, i) {
				// NGEO-1779: HACK use base layer index < 100 so the overlays/footprint layers are always over browses
				// TODO: add zIndex management for footprint/overlay layers
				mapEngine.setLayerIndex(browse.engineLayer, i /* + 100 */);
			});

			// NGEOD-890: The highlighted features need to be shown over any other browse
			if (highlightedFeatures) {
				sortHighlightedFeatures(highlightedFeatures, allBrowses);
			}
		}
	}
};