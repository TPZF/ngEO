
define(['map/handler', 'map/map'], function(Handler, Map) {
	
/**
 * Private variables
 */
var layer;
var feature;
var startPoint;
var mapEngine;
var started = false;
var onstop = null;
var self = null;
var startX;
var endX;

/**
 * Private methods
 */
 
// Update the feature used to represent the rectangle
function updateFeature(pt1,pt2) {
	if (pt1 && pt2) {
		
		var minX = (endX > startX) ? pt1[0] : pt2[0];
		var maxX = (endX > startX) ? pt2[0] : pt1[0];
		
		var minY = Math.min( pt1[1], pt2[1] );
		var maxY = Math.max( pt1[1], pt2[1] );
		
		feature.bbox = [ minX, minY, maxX, maxY ];
		feature.geometry.type = "Polygon";
		feature.geometry.coordinates = [[ [ minX, minY ],
			[ maxX, minY ],
			[ maxX, maxY ],
			[ minX, maxY ],
			[ minX, minY ]
		]];
		layer.updateFeature(feature);
	}
};

// Called when left mouse button is pressed : start drawing the rectangle
function onMouseDown(event) {
	if ( event.button == 0 ) {
		startX = event.pageX;
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
		endX = event.pageX;
		var endPoint = Map.getLonLatFromEvent( event );
		updateFeature(  startPoint, endPoint );
		
		// end drawing
		self.stop();
		started = false;
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
		
		// No navigation when drawing a rectangle
		mapEngine.blockNavigation(true);
		
		// Subscribe to mouse events
		mapEngine.subscribe("mousedown", onMouseDown);
		mapEngine.subscribe("mousemove", onMouseMove);
		mapEngine.subscribe("mouseup", onMouseUp);
		
		onstop = options.stop;
	},
	
	// Stop the handler
	stop: function() {
		// Restore navigation
		mapEngine.blockNavigation(false);
		
		// Unsubscribe to mouse events
		mapEngine.unsubscribe("mousedown", onMouseDown);
		mapEngine.unsubscribe("mousemove", onMouseMove);
		mapEngine.unsubscribe("mouseup", onMouseUp);
		
		if (onstop) {
			onstop();
		}
	}
});

return self;

		
});