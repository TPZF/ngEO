
define(["jquery", "logger", "search/model/datasetAuthorizations", "map/map", "map/selectHandler"], 
	function($, Logger, DatasetAuthorizations, Map, SelectHandler) {


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
 * Retreive the browse infromation from a feature
 */
var _getBrowseInformation = function(feature) {
	var eo = feature.properties.EarthObservation;
	if (!eo || !eo.EarthObservationResult || !eo.EarthObservationResult.eop_BrowseInformation) {
		return null;
	}

	var browseInfo = eo.EarthObservationResult.eop_BrowseInformation;
	if (!browseInfo)
		return null;
	return browseInfo;
};

return {
	
	/**
	 * Add a browse
	 *
	 * @param feature		The feature to add
	 * @param datasetId		The parent dataset id
	 */
	 addBrowse: function(feature,datasetId) {
	 
	 	var browseInfo = _getBrowseInformation(feature);
	 	if ( browseInfo ) {
			var key = _getKey(browseInfo);
			if ( DatasetAuthorizations.hasBrowseAuthorization(datasetId,browseInfo.eop_layer) ) {	
			
				var browseLayer = _browseLayerMap[key];
				if (!browseLayer) {
					browseLayer = _browseLayerMap[key] = Map.addLayer({
							name: browseInfo.eop_layer,
							type: "Browses",
							visible: true
						});
				}
				browseLayer.addBrowse(feature,browseInfo);
		
			} else if ( !_browseAccessInformationMap[key] ) {
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
	
		var browseInfo = _getBrowseInformation(feature);
		if ( browseInfo ) {
			var key = _getKey(browseInfo);
			var browseLayer = _browseLayerMap[key];
			if ( browseLayer ) {
				browseLayer.removeBrowse(feature.id);
				
				if ( browseLayer.isEmpty() ) {
					Map.removeLayer(browseLayer);
					delete _browseLayerMap[key];
				}
			}
		}
	}
};

});
