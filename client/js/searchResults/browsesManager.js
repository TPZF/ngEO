
define(["jquery", "logger", "search/model/datasetAuthorizations", "map/map", "map/selectHandler"], 
	function($, Logger, DatasetAuthorizations, Map, SelectHandler) {


var _browseLayerMap = {};

var _getKey = function(browseInfo) {
	return (browseInfo.eop_url || browseInfo.eop_filename) + browseInfo.eop_layer;
};


var _getBrowseInformation = function(feature) {
	var eo = feature.properties.EarthObservation;
	if (!eo || !eo.EarthObservationResult || !eo.EarthObservationResult.eop_BrowseInformation) return null;
	var browseInfo = eo.EarthObservationResult.eop_BrowseInformation;
	if (!browseInfo) return null;
	return browseInfo;
};


var _getBrowseLayer = function(browseInfo,create) {
	var key = (browseInfo.eop_url || browseInfo.eop_filename) + browseInfo.eop_layer;
	if (create && !_browseLayerMap[key]) {
		_browseLayerMap[key] = Map.addLayer({
					name: browseInfo.eop_layer,
					type: "Browses",
					visible: true
				});
	}
	return _browseLayerMap[key];
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
		if ( DatasetAuthorizations.hasBrowseAuthorization(datasetId,browseInfo.eop_layer) ) {	
		
			var key = _getKey(browseInfo);
			var browseLayer = _browseLayerMap[key];
			if (!browseLayer) {
				browseLayer = _browseLayerMap[key] = Map.addLayer({
						name: browseInfo.eop_layer,
						type: "Browses",
						visible: true
					});
			}
			browseLayer.addBrowse(feature,browseInfo);
	
		} else if (!browseLayer._viewAccessInformation) {
			Logger.inform("You do not have enough permission to view the layer.");
			browseLayer._viewAccessInformation = true;
		}
						
	},
	
	/**
	 * Remove a browse
	 *
	 * @param feature		The feature to remove
	 */
	removeBrowse: function(feature) {
	
		var browseInfo = _getBrowseInformation(feature);
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
};

});
