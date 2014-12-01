
define(['map/handler', 'map/map'], function(Handler, Map) {
	
/**
 * Private variables
 */
var layer;
var feature;
var startPoint;
var mapEngine;
var coords;
var started = false;
var lastClickTime = -1;
var lastX = -1;
var lastY = -1;
var onstop = null;
var self = null;

// Called when a double click is detected
function finishHandler() {
	// Remove duplicated point (used for mouse move drawing)
	coords.splice( coords.length-2, 1 );
	self.stop();
}

// Detect a double-click event. Cannot use browser double-click to avoid multiple point added, and because of problem with OpenLayers and double click
function isDoubleClick(event) {

	var clickTime = Date.now();
	
	var isDoubleClick = (clickTime - lastClickTime) < 250
		&& Math.abs( event.pageX - lastX ) < 1
		&& Math.abs( event.pageY - lastY ) < 1;
		
	lastClickTime = clickTime;
	lastX = event.pageX;
	lastY = event.pageY;
	
	return isDoubleClick;
}

function updateFeature() {
	feature.geometry.type = "Polygon";
	feature.geometry.coordinates = [coords];
	// If there is any bbox, clear it, it is no longer valid.
	// Sometimes the map backend can compute the bbox for rendering purposes
	feature.bbox = null;
	layer.updateFeature(feature);
};

// Called on a click : add a new point in the polygon
function onClick(event) {
	if ( started && event.button == 0 ) {
		
		if ( isDoubleClick(event) ) {
			started = false;
			setTimeout(finishHandler,50);
		} else {
			var point = Map.getLonLatFromEvent( event );
			if ( coords.length == 0 ) {
				coords.push( point, point, point );
			} else {
				// Update the last point
				coords[ coords.length-2 ] = point;
				// Duplicate the last point for mouse move update
				coords.splice( coords.length-1, 0, point );
			}
			updateFeature();
		}
	}
};

// Called when mouse is moved : update the polygon
function onMouseMove(event) {
	if ( started && coords.length > 0 && event.button == 0 ) {							
		var point = Map.getLonLatFromEvent( event );
		coords[ coords.length-2 ] = point;
		updateFeature();
	}
	
};

/**
 * Public interface
 */
self = new Handler({
	// Start the handler
	start: function(options) {
		mapEngine = Map.getMapEngine();
		
		// Create the layer if not already created
		if (options.layer) {
			layer = options.layer;
			feature = options.feature;
			coords = feature.geometry.coordinates[0];
		} else if (!layer) {
			coords = [];
			feature = {
				id: '0',
				type: 'Feature',
				geometry: {
					type: 'Polygon',
					coordinates: [coords]
				}
			};
			var params = {
					name: "Draw Area",
					type: "Feature",
					visible: true,
					style: "imported",
					data: feature
				};
			layer = Map.addLayer(params);
		}
		
		// No navigation when drawing a polygon
		mapEngine.blockNavigation(true);
		
		// Subscribe to mouse events
		mapEngine.subscribe("mousemove", onMouseMove);
		mapEngine.subscribe("mouseup", onClick);
		
		onstop = options.stop;
				
		// Prepare mouse listening and reset coordinates
		coords.length = 0;
		started = true;
	},
	
	// Stop the handler
	stop: function() {
		// Restore navigation
		mapEngine.blockNavigation(false);
		// Unsubscribe to mouse events
		mapEngine.unsubscribe("mousemove", onMouseMove);
		mapEngine.unsubscribe("mouseup", onClick);

		if (onstop) {
			feature.geometry.type = "Polygon";
			feature.geometry.coordinates = [coords];
			onstop();
		}
	}
});

return self;
		
});