var MapUtils = require('map/utils');

/**
 *	Rectangle class allowing to handle WIDE polygon issues
 *	
 *	By adding some points in nominal case
 *	Changing type to MultiLineString when crossing dateline
 */
var Rectangle = function(options) {
    if ( options.feature ) {
    	// Compute bbox from feature

    	this.feature = options.feature;
    	var bbox = MapUtils.computeBbox(this.feature.geometry);
    	this.west = bbox[0];
    	this.south = bbox[1];
    	this.east = bbox[2];
    	this.north = bbox[3];
    	this.computeStep();
    	this.updateFeature({type: this.feature.geometry.type});
    } else {
    	// Compute feature from bbox coordinates
	    this.west = options.west;
	    this.south = options.south;
	    this.east = options.east;
	    this.north = options.north;
	    this.feature = {
	    	id: "Dynamic rectangle",
	    	type: "Feature",
	    	geometry: {}, // Will be computed afterwards
	    	properties: {}
	    }
	    this.updateFeature({type: options.type});
    }
}

/**
 *	Compute step for additional points depending if we cross dateline or not
 */
Rectangle.prototype.computeStep = function() {
	var nbSegments = 4;
	this.step = this.west > this.east ? ((180 - this.west) + 180 + this.east)/nbSegments : (this.east - this.west)/nbSegments;
}

/**
 *	Update feature according to new bbox parameters
 */
Rectangle.prototype.updateFeature = function(options) {
	var type = this.west > this.east ? "MultiLineString" : "Polygon"; // By default
	if ( options && options.type ) {
		type = options.type;
	}

	// Update step depending on crossing dateline attribut
	this.computeStep();

	this.feature.geometry.type = type;
	if ( type == "MultiLineString" ) {
		// MultiLine string
		this.feature.geometry.coordinates = [
			[ [ -180, this.north ], [ this.east, this.north ], [ this.east, this.south ], [ -180, this.south ] ],
			[ [ 180, this.north ], [ this.west, this.north ], [ this.west, this.south ], [ 180, this.south] ],
			[ [ -180, this.north ], [ this.west - 360, this.north ], [ this.west - 360, this.south ], [ -180, this.south] ],
			[ [ 180, this.north ], [ this.east + 360, this.north ], [ this.east + 360, this.south ], [ 180, this.south] ]
		];
	} else {
		// Polygon
	    this.feature.geometry.coordinates = [
	        [
	            [this.west, this.south],
	            [MapUtils.normalizeLon(this.west + this.step), this.south],
	            [MapUtils.normalizeLon(this.west + this.step * 2), this.south],
	            [MapUtils.normalizeLon(this.west + this.step * 3), this.south],
	            [this.east, this.south],
	            [this.east, this.north],
	            [MapUtils.normalizeLon(this.west + this.step * 3), this.north],
	            [MapUtils.normalizeLon(this.west + this.step * 2), this.north],
	            [MapUtils.normalizeLon(this.west + this.step), this.north],
	            [this.west, this.north],
	            [this.west, this.south]
	        ]
	    ];
	}
}

module.exports = Rectangle;