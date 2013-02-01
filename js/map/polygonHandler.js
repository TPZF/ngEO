
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
var onstop = null;
var self = null;

// Called when a double click is detected
function finishHandler() {
	self.stop();
}

// Called on a click : add a new point in the polygon
function onClick(event) {
	var clickTime = Date.now();
	if ( started && event.button == 0 ) {
		
		if ( (clickTime - lastClickTime) < 250 ) {
			started = false;
			setTimeout(finishHandler,50);
		} else {
			lastClickTime = clickTime;
			var point = Map.getLonLatFromEvent( event );
			if ( coords.length == 0 ) {
				coords.push( point, point, point );
			} else {
				coords[ coords.length-2 ] = point;
				coords.splice( coords.length-1, 0, point );
			}
			Map.updateFeature(layer,feature);
		}
	}
};

// Called when mouse is moved : update the polygon
function onMouseMove(event) {
	if ( started && coords.length > 0 && event.button == 0 ) {							
		var point = Map.getLonLatFromEvent( event );
		coords[ coords.length-2 ] = point;
		Map.updateFeature(layer,feature);
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
			feature = layer.data;
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
			layer = {
					name: "Draw Area",
					type: "GeoJSON",
					visible: true,
					style: "imported",
					data: feature
				};
			Map.addLayer(layer);
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