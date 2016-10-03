var MapUtils = require('map/utils');

/**
 *	Rectangle class allowing to handle WIDE polygon issues
 *	
 *	By adding some points in nominal case
 *	Changing type to MultiLineString when crossing dateline
 */
var Rectangle = function(options) {
    if ( options.feature ) {
    	this.feature = options.feature
    	var bbox = MapUtils.computeBbox(this.feature.geometry);
    	this.west = bbox[0];
    	this.south = bbox[1];
    	this.east = bbox[2];
    	this.north = bbox[3];
    } else {
	    this.west = options.west;
	    this.south = options.south;
	    this.east = options.east;
	    this.north = options.north;
	    this.feature = {
	        id: "Dynamic",
	        type: "Feature",
	        geometry: {
	            type: "Polygon",
	            coordinates: [
	                [
	                    [this.west, this.south],
			            [MapUtils.normalizeLon(this.west + step), this.south],
			            [MapUtils.normalizeLon(this.west + step * 2), this.south],
			            [MapUtils.normalizeLon(this.west + step * 3), this.south],
			            [this.east, this.south],
			            [this.east, this.north],
			            [MapUtils.normalizeLon(this.west + step * 3), this.north],
			            [MapUtils.normalizeLon(this.west + step * 2), this.north],
			            [MapUtils.normalizeLon(this.west + step), this.north],
			            [this.west, this.north],
			            [this.west, this.south]
	                ]
	            ]
	        },
	        properties : {}
	    };
    }
    this.updateFeature();
}

/**
 *	Update feature according to new bbox parameters
 */
Rectangle.prototype.updateFeature = function() {

	var step;
	if ( this.west > this.east ) {
		this.feature.geometry.type = "MultiLineString";
		step = ((180 - this.west) + 180 + this.east)/4;
		this.feature.geometry.coordinates = [
			[ [ -180, this.north ], [ this.east, this.north ], [ this.east, this.south ], [ -180, this.south ] ],
			[ [ 180, this.north ], [ this.west, this.north ], [ this.west, this.south ], [ 180, this.south] ],
			[ [ -180, this.north ], [ this.west - 360, this.north ], [ this.west - 360, this.south ], [ -180, this.south] ],
			[ [ 180, this.north ], [ this.east + 360, this.north ], [ this.east + 360, this.south ], [ 180, this.south] ]
		];
	} else {

		this.feature.geometry.type = "Polygon";
		step = (this.east - this.west)/4;
		this.feature.geometry.coordinates = [
	        [
	            [this.west, this.south],
	            [MapUtils.normalizeLon(this.west + step), this.south],
	            [MapUtils.normalizeLon(this.west + step * 2), this.south],
	            [MapUtils.normalizeLon(this.west + step * 3), this.south],
	            [this.east, this.south],
	            [this.east, this.north],
	            [MapUtils.normalizeLon(this.west + step * 3), this.north],
	            [MapUtils.normalizeLon(this.west + step * 2), this.north],
	            [MapUtils.normalizeLon(this.west + step), this.north],
	            [this.west, this.north],
	            [this.west, this.south]
	        ]
    	];
	}
	this.step = step;
}

/**
 *	DEPRECATED
 */
Rectangle.prototype.updateFeaturePolygon = function() {
    var step;
    if ( this.west > this.east ) {
        this.feature.geometry.type = "Polygon";
        step = ((180 - this.west) + 180 + this.east)/4;
    } else {
        this.feature.geometry.type = "Polygon";
        step = (this.east - this.west)/4;
    }

    this.feature.geometry.coordinates = [
        [
            [this.west, this.south],
            [MapUtils.normalizeLon(this.west + step), this.south],
            [MapUtils.normalizeLon(this.west + step * 2), this.south],
            [MapUtils.normalizeLon(this.west + step * 3), this.south],
            [this.east, this.south],
            [this.east, this.north],
            [MapUtils.normalizeLon(this.west + step * 3), this.north],
            [MapUtils.normalizeLon(this.west + step * 2), this.north],
            [MapUtils.normalizeLon(this.west + step), this.north],
            [this.west, this.north],
            [this.west, this.south]
        ]
    ];
    console.log("Updated feature", this.feature);
    this.step = step;
};

module.exports = Rectangle;