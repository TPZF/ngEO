var Handler = require('map/handler');
var Map = require('map/map');
var MapUtils = require('map/utils');
var Rectangle = require('map/rectangle');

/**
 * Private variables
 */
var layer;
var rectangle;
var feature;
var startPoint;
var endPoint;
var mapEngine;
var started = false;
var onstop = null;
var self = null;

// Current direction of user's mouse
var toEast;

// Used for debug
/*
var params = {
	name: "Points",
	type: "Feature",
	visible: true,
	style: "imported"
};
var pointsLayer = Map.addLayer(params);

// Adds additional points to polygon to handle better wide rectangles
var addPoints = function(polygon) {

	var minX = polygon[0][0][0];
	var minY = polygon[0][0][1];
	var maxX = polygon[0][2][0];
	var maxY = polygon[0][2][1];

	console.log("===");
	var oldOne= polygon[0].slice(0);
	console.log(oldOne);

	var step = Math.abs((maxX - minX) / 3);
	polygon[0].splice(1, 0, [minX + step, minY]);
	polygon[0].splice(2, 0, [minX + 2*step, minY]);
	polygon[0].splice(5, 0, [minX + 2*step, maxY]);
	polygon[0].splice(6, 0, [minX + step, maxY]);

	pointsLayer.clear();

	for ( var i=0; i<polygon[0].length; i++ ) {
		var pFeature = {
			type: 'Feature',
			geometry: {
				type: 'Point',
				coordinates: polygon[0][i]
			},
			properties: {}
		};
		pointsLayer.addFeature(pFeature);
	}
}
*/

/**
 *	Compute if user moves mouse in east direction or not
 */
var updateToEast = function(start, end) {
	if ( rectangle.feature.bbox ) {
		var pCurrent = {
			lat: end[1], 
			lon: end[0]
		};
		var p2 = {
			lat: end[1],
			lon: start[0]
		};

		var distanceDelta = 2007000;
		if ( MapUtils.distanceBetween(pCurrent, p2) < distanceDelta && rectangle.step < 30 ) {
			var seg1 = {
				lat: -1,
				lon: start[0]
			};
			var seg2 = {
				lat: 1,
				lon: start[0]
			};
			var d = MapUtils.crossTrackDistanceBetween(pCurrent, seg1, seg2);
			if ( d > 0 ) {
				toEast = true;
			} else {
				toEast = false;
			}
		}
	}
	return toEast;
}

// Update the feature used to represent the rectangle
function updateFeature(start, end) {

	if ( !start || !end )
		return;

	if ( updateToEast(start, end) ) {
		// Nominal case, user drags to east
		minX = start[0];
		maxX = end[0];
	} else {
		// Inverse start/end if user moves to west
		minX = end[0];
		maxX = start[0];
	}

	var minY = Math.min(start[1], end[1]);
	var maxY = Math.max(start[1], end[1]);
	
	rectangle.feature.bbox = [ minX, minY, maxX, maxY ];

	rectangle.west = minX;
	rectangle.east = maxX;
	rectangle.north = maxY;
	rectangle.south = minY;
	rectangle.updateFeature();

	// addPoints(rectangle.feature.geometry.coordinates);

	// No dateline fix when feature crosses dateline
	var noDateLineFixCallback = function(feature) {
		return feature;
	}
	layer.updateFeature(rectangle.feature, feature.geometry.type == "MultiLineString" ? noDateLineFixCallback : null);
};

// Called when left mouse button is pressed : start drawing the rectangle
function onMouseDown(event) {
	if (event.button == 0) {
		startPoint = Map.getLonLatFromEvent(event);
		endPoint = Map.getLonLatFromEvent(event);
		updateFeature(startPoint, startPoint);
		started = true;
	}
};

// Called when mouse is moved : update the rectangle
function onMouseMove(event) {
	if (started && event.button == 0) {
		// Check if previous point has passed by dateline
		endPoint = Map.getLonLatFromEvent(event);
		updateFeature(startPoint, endPoint);
	}
};

// Called when left mouse button is release : end drawing the rectangle
function onMouseUp(event) {
	if (started && event.button == 0) {
		endPoint = Map.getLonLatFromEvent(event);
		updateFeature(startPoint, endPoint);

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
			rectangle = new Rectangle({
				feature: feature
			});
		} else if (!layer) {
			coords = [];

			rectangle = new Rectangle({
				west: 0,
				east: 1,
				south: 0,
				north: 1
			});

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

module.exports = self;