
define(['jquery', 'map/map', 'map/selectHandler'], function($, Map, SelectHandler) {
	
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
				coords[ coords.length-2 ] = point;
				coords.splice( coords.length-1, 0, point );
			}
			layer.updateFeature(feature);
		}
	}
};

// Called when mouse is moved : update the polygon
function onMouseMove(event) {
	if ( started && coords.length > 0 && event.button == 0 ) {							
		var point = Map.getLonLatFromEvent( event );
		coords[ coords.length-2 ] = point;
		layer.updateFeature(feature);
	}
	
};

/**
 * Public interface
 */
return {
	// Start the handler
	start: function(options) {
		self = this;
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
		
		// TODO : find a better way to manage the default handler
		SelectHandler.stop();
	},
	
	// Stop the handler
	stop: function() {
		// Restore navigation
		mapEngine.blockNavigation(false);
		// Unsubscribe to mouse events
		mapEngine.unsubscribe("mousemove", onMouseMove);
		mapEngine.unsubscribe("mouseup", onClick);
		
		// TODO : find a better way to manage the default handler
		SelectHandler.start();
		
		if (onstop) {
			onstop();
		}
	}
};
		
});