
define(['jquery', 'map/map'], function($, Map) {
	
/**
 * Private variables
 */
 var layer;
var feature;
var startPoint;
var mapEngine;
var started = false;

/**
 * Private methods
 */
 
// Update the feature used to represent the rectangle
function updateFeature(pt1,pt2) {
	feature.geometry.coordinates = [[ [ pt1[0], pt1[1] ],
		[ pt2[0], pt1[1] ],
		[ pt2[0], pt2[1] ],
		[ pt1[0], pt2[1] ],
		[ pt1[0], pt1[1] ]
	]];
	Map.updateFeature(layer,feature);
};

// Called when left mouse button is pressed : start drawing the rectangle
function onMouseDown(event) {
	if ( event.button == 0 ) {		
		startPoint = Map.getLonLatFromEvent( event );
		updateFeature( startPoint, startPoint );
		started = true;
	}
};

// Called when mouse is moved  : update the rectangle
function onMouseMove(event) {
	if ( started && event.button == 0 ) {							
		var endPoint = Map.getLonLatFromEvent( event );
		updateFeature(  startPoint, endPoint );
	}
};

// Called when left mouse button is release  : end drawing the rectangle
function onMouseUp(event) {
	if ( started && event.button == 0 ) {
		var endPoint = Map.getLonLatFromEvent( event );
		updateFeature(  startPoint, endPoint );
		
		// end drawing
		$("#draw").click();
		started = false;
	}
};

/**
 * Public interface
 */
return {
	// Start the handler
	start: function() {
		mapEngine = Map.getMapEngine();
		
		// No navigation when drawing a rectangle
		mapEngine.blockNavigation(true);
		
		// Subscribe to mouse events
		mapEngine.subscribe("mousedown", onMouseDown);
		mapEngine.subscribe("mousemove", onMouseMove);
		mapEngine.subscribe("mouseup", onMouseUp);
		
		// Create the layer if not already created
		if (!layer) {
			coords = [];
			feature = {
				id: '0',
				type: 'Feature',
				geometry: {
					type: 'Polygon',
					coordinates: [coords]
				}
			};
			layer = {
					name: "Draw Area",
					type: "GeoJSON",
					visible: true,
					style: "imported",
					data: feature
				};
			Map.addLayer(layer);
		}

	},
	
	// Stop the handler
	stop: function() {
		// Restore navigation
		mapEngine.blockNavigation(false);
		
		// Unsubscribe to mouse events
		mapEngine.unsubscribe("mousedown", onMouseDown);
		mapEngine.unsubscribe("mousemove", onMouseMove);
		mapEngine.unsubscribe("mouseup", onMouseUp);
	}
};
		
});