
define(['jquery', 'map/map', 'searchResults/model/searchResults'], function($, Map, SearchResults) {
	
/**
 * Private variables
 */
 // The current picked features
var pickedFeatures = [];
// The layer to pick
var featureCollections = [];
// The index when using stack picking
var stackPickingIndex = -1;
// The map engine
var mapEngine;
// Needed to detect click
var prevX, prevY, prevTime;
// Needed to clear stack when selection is changed from another way
var inPicking = false;
// The picking radius
var radius = -1.0;

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
};

/**
 * Compute line-circle intersection
 */
var lineCircleIntersection = function( p1, p2, center, radius )
{
	var dx = p2[0] - p1[0];
	var dy = p2[1] - p1[1];

	var lx = p1[0] - center[0];
	var ly = p1[1] - center[1];
		
	var a = dx * dx + dy * dy ;
	var b = 2* ( lx * dx + ly * dy );
	var c = lx * lx + ly * ly - radius*radius ;

	var discriminant = b*b-4*a*c;
	if( discriminant <= 0 )
	{
	  return false;
	}
	discriminant = Math.sqrt( discriminant );
	var t1 = (-b - discriminant)/(2*a);
	var t2 = (-b + discriminant)/(2*a);
	return ( (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1) );
};

/**
 * Check if a point is inside a line
 */
 var pointInLine = function( point, coords )
{
	// Compute radius
	if ( radius < 0.0 )
	{
		var pixel = Map.getPixelFromLonLat(point[0],point[1]);
		var ul = Map.getLonLatFromPixel(pixel.x+1,pixel.y+1);
		radius = 1.5 * Math.sqrt( (ul[0] - point[0]) * (ul[0] - point[0]) + (ul[1] - point[1]) * (ul[1] - point[1]) );
	}
	
	for ( var i = 0; i < coords.length-1; i++ )
	{
		if ( lineCircleIntersection( coords[i], coords[i+1], point, radius ) )
		{
			return true;
		}
	}
	
	return false;
};

/**
 * Check if the point is inside the given geometry
 */
var pointInGeometry = function( point, geometry )
{
	switch (geometry.type)
	{
	case "MultiPolygon":
		var inside = false;
		for ( var i = 0; i < geometry.coordinates.length && !inside; i++ )
		{
			inside = pointInRing( point, geometry.coordinates[i][0] );
		}
		return inside;
	case "Polygon":
		return pointInRing( point, geometry.coordinates[0] );
	case "LineString":
		return pointInLine( point, geometry.coordinates );
	case "MultiLineString":
		var inside = false;
		for ( var i = 0; i < geometry.coordinates.length && !inside; i++ )
		{
			inside = pointInLine( point, geometry.coordinates[i] );
		}
		return inside;
	default:
		return false;
	}
};


/**
 * Get the feature from a point : test if the point is inside the footprint
 */
var getFeaturesFromPoint = function(lonlat) {

	radius = -1;

	var features = [];
		
	for ( var j = 0; j < featureCollections.length; j++ ) {
		for ( var i = 0; i < featureCollections[j].features.length; i++ ) {
			var feature = featureCollections[j].features[i];
			if ( pointInGeometry(lonlat,feature.geometry) ) {
				feature._featureCollection = featureCollections[j];
				features.push( feature );
			}
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
	if (featureCollections.length == 0)
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
				Map.trigger("pickedFeatures", pickedFeatures, event);
			} else {
				Map.trigger("pickedFeatures", [ pickedFeatures[stackPickingIndex] ], event);
			}
		
		} else {
		
			pickedFeatures = features;
			stackPickingIndex = -1;
			Map.trigger("pickedFeatures", pickedFeatures, event);
			
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

	/**
	 * Initialize the select handler
	 */
	initialize: function(options) {
	//	layer = options.layer;
	},
	
	/**
	 * Add a feature collection to the selectHandler
	 */
	addFeatureCollection: function(fc) {
		featureCollections.push(fc);
	},
	
	/**
	 * Remove a feature collection from the selectHandler
	 */
	removeFeatureCollection: function(fc) {
		var i = featureCollections.indexOf(fc);
		if ( i >= 0 ) {
			featureCollections.splice(i,1);
		}
	},
	
	/**
	 * Start the handler
	 */
	start: function() {		
		mapEngine = Map.getMapEngine();
		
		// Click is not used because OpenLayers is messing up with click when navigation is active
		mapEngine.subscribe( 'mousedown', onMouseDown);
		mapEngine.subscribe( 'mouseup', mapClickHandler);
		
		SearchResults.on('selectFeatures', clearStack);
		SearchResults.on('unselectFeatures', clearStack);

	},
	
	/**
	 * Stop the handler
	 */
	stop: function() {
		mapEngine.unsubscribe( 'mousedown', onMouseDown);
		mapEngine.unsubscribe( 'mouseup', mapClickHandler);
	}
};
		
});