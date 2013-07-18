
define(['jquery', 'map/map', 'searchResults/model/searchResults'], function($, Map, SearchResults) {
	
/**
 * Private variables
 */
 // The current picked features
var pickedFeatures = [];
// The index when using stack picking
var stackPickingIndex = -1;
// The map engine
var mapEngine;
// Needed to detect click
var prevX, prevY, prevTime;
// Needed to clear stack when selection is changed from another way
var inPicking = false;

/**
 * Private methods
 */
 
/**
 * Check if the point is inside the given ring
 */
var pointInRing = function ( point, ring )
{
	var nvert = ring.length;
	if ( ring[0][0] == ring[nvert-1][0] && ring[0][1] == ring[nvert-1][1] )
	{
		nvert--;
	}
	var inPoly = false;
	
	var j = nvert-1;
	for (var i = 0; i < nvert; j = i++)
	{
		if ( ((ring[i][1] > point[1]) != (ring[j][1] > point[1])) &&
		 (point[0] < (ring[j][0] - ring[i][0]) * (point[1] - ring[i][1]) / (ring[j][1] - ring[i][1]) + ring[i][0]) )
		{
			inPoly = !inPoly;
		}
	}
	return inPoly;
}

/**
 * Get the feature from a point : test if the point is inside the footprint
 */
var getFeaturesFromPoint = function(lonlat) {

	var features = [];
	
	var featureCollection = Map.layers[0].data;
	
	for ( var i = 0; i < featureCollection.features.length; i++ ) {
		var feature = featureCollection.features[i];
		var isMultiPolygon = feature.geometry.type == "MultiPolygon";
		if ( pointInRing(lonlat,isMultiPolygon ? feature.geometry.coordinates[0][0] : feature.geometry.coordinates[0]) ) {
			features.push( feature );
		}
	}
			
	return features;
};

 /** 
  *	Test if a new selection is equal to the previous selection
  */
var isSelectionEqual = function( newSelection ) {
	if ( pickedFeatures.length == newSelection.length) {
		
		for ( var i=0; i < pickedFeatures.length; i++ ) {
			if ( pickedFeatures[i] != newSelection[i] )
				return false;
		}
		
		return true;
	}
	else
		return false;
};

/**
 * Call when the user click on the map
 */
var mapClickHandler = function(event)
{
	if ( event.button != 0 ) {
		return;
	}
	
	// Check there is data to select
	if (!Map.layers[0].data)
		return;
		
	// Check that we are on a click
	var dx = Math.abs(event.pageX - prevX);
	var dy = Math.abs(event.pageY - prevY);
	var dt = Date.now() - prevTime;
	if ( dx > 1 || dy > 1 || dt > 500 ) {
		return;
	}
		
	var lonlat = Map.getLonLatFromEvent(event);
	if ( lonlat ) {
		var features = getFeaturesFromPoint(lonlat);
		
		inPicking = true;
		
		if ( isSelectionEqual(features) ) {
		
			stackPickingIndex++;
			
			if ( stackPickingIndex == pickedFeatures.length ) {
				stackPickingIndex = -1;
				Map.trigger("pickedFeatures", pickedFeatures);
			} else {
				Map.trigger("pickedFeatures", [ pickedFeatures[stackPickingIndex] ]);
			}
		
		} else {
		
			pickedFeatures = features;
			stackPickingIndex = -1;
			Map.trigger("pickedFeatures", pickedFeatures);
			
		}
		
		inPicking = false;
	}
};

/**
 * Call when the user pressed the left mouse button
 */
function onMouseDown(event) {
	if ( event.button == 0 ) {
		prevX = event.pageX;
		prevY = event.pageY;
		prevTime = Date.now();
	}
};

/**
 * Clear stack when selection is changed
 */
function clearStack() {
	if (!inPicking) {
		pickedFeatures = [];
	}
};


/**
 * Public interface
 */
return {
	start: function() {
		mapEngine = Map.getMapEngine();
		
		// Click is not used because OpenLayers is messing up with click when navigation is active
		mapEngine.subscribe( 'mousedown', onMouseDown);
		mapEngine.subscribe( 'mouseup', mapClickHandler);
		
		SearchResults.on('selectFeatures', clearStack);
		SearchResults.on('unselectFeatures', clearStack);

	},
	
	stop: function() {
		mapEngine.unsubscribe( 'mousedown', onMouseDown);
		mapEngine.unsubscribe( 'mouseup', mapClickHandler);
	}
};
		
});