/*
 * GET datasetPopulationMatrix
 * IF-ngEO-datasetPopulationMatrix
 */

var fs = require('fs'),
	terraformer = require('terraformer'),
	wkt = require('terraformer-wkt-parser'),
	wcsCoveragePaser = require('./wcsCoverageParser'),
	eoliParser = require('./EOLIParser');

/**
 * Store the feature collections for each datasets
 */ 
var featureCollections = {
};

/*
 * Fill the features with 'good' properties
 */
fs.readFile('./productSearch/results.json', 'utf8', function (err, data) {
	var inputFeatureCollection = JSON.parse(data);
	featureCollections['ND_OPT_1'] = eoliParser.parse('./productSearch/dataFromEOLI.txt',inputFeatureCollection);
	featureCollections['default'] = wcsCoveragePaser.parse('./productSearch/sar_coverage.xml',inputFeatureCollection);
});
fs.readFile('./productSearch/ATS_TOA_1P_response.json', 'utf8', function (err, data) {
	featureCollections['ATS_TOA_1P']  = JSON.parse(data);
});
fs.readFile('./productSearch/ASA_WS__0P_response.json', 'utf8', function (err, data) {
	featureCollections['ASA_WS__0P']  = JSON.parse(data);
});
fs.readFile('./productSearch/Sentinel2_response.json', 'utf8', function (err, data) {
	featureCollections['Sentinel2']  = JSON.parse(data);
});
fs.readFile('./productSearch/Line_response.json', 'utf8', function (err, data) {
	featureCollections['Line']  = JSON.parse(data);
});
fs.readFile('./productSearch/Crossing_response.json', 'utf8', function (err, data) {
	featureCollections['Crossing']  = JSON.parse(data);
});
fs.readFile('./productSearch/Global_response.json', 'utf8', function (err, data) {
	featureCollections['Global']  = JSON.parse(data);
});
fs.readFile('./productSearch/Correlation_response.json', 'utf8', function (err, data) {
	featureCollections['Correlation']  = JSON.parse(data);
});

var initialized = false;


/**
 * Time filter
 */
var timeInsideFeature = function(feature,start,stop) {
	var startFeature = feature.properties.EarthObservation.gml_beginPosition;
	var stopFeature = feature.properties.EarthObservation.gml_endPosition;
	//console.log(startFeature + ' ' + stopFeature);
	
	if ( stopFeature < start )
		return false;
	else if ( startFeature > stop )
		return false;
	else
		return true;
};

/**
 * Time sorting
 */
var sortBytTime = function(a,b) {
	var starta = new Date(a.properties.EarthObservation.gml_beginPosition);
	var startb = new Date(b.properties.EarthObservation.gml_beginPosition);
	return startb - starta;
};

/**
 * Geometry contains
 */
var contains = function(g1,g2) {
	if ( g2.type == "LineString" )
		return true;
		
	var coords = g2.type == "MultiPolygon" ? g2.coordinates[0][0] : g2.coordinates[0];
	for ( var i =0; i < coords.length; i++ ) {
		if ( g1.contains( new terraformer.Point( coords[i] ) ) )
			return true;
	}
	return false;
}

var findFeature = function(fc,id) {
	for ( var i = 0; i < fc.features.length; i++ ) {
		if ( fc.features[i].id == id )
			return fc.features[i];
	}
};

var initializeFeatureCollection = function(featureCollection,id) {
	for ( var i = 0; i < featureCollection.features.length; i++ )  {
		var feature = featureCollection.features[i];
		feature.properties.productUrl = "http://localhost:3000/ngeo/catalogue/" + id + "/search?id=" + feature.id;
	}
};

module.exports = function(req, res){

	// Find the feature collection
	var featureCollection;
	if ( featureCollections.hasOwnProperty( req.param('datasetId') ) ) {
		featureCollection = featureCollections[req.param('datasetId')];
	} else {
		featureCollection = featureCollections['default'];
	}

	// Process feature collection to add productUrl
	if (!initialized) {
		for ( var x in featureCollections ) {
			if ( featureCollections.hasOwnProperty(x) ) {
				initializeFeatureCollection( featureCollections[x], x );
			}
		}
		initialized = true;
	}
	
	// Find with id or not
	if ( req.query.id ) {
		res.send( findFeature(featureCollection,req.query.id) );
		return;
	}
	
	var searchArea;
	if ( req.query.bbox ) {
		var bbox = req.query.bbox.split(',');
		bbox = bbox.map( parseFloat );
		searchArea = new terraformer.Polygon([ [ [bbox[0],bbox[1]],
				[bbox[0],bbox[3]], [bbox[2],bbox[3]], [bbox[2],bbox[1]], [bbox[0],bbox[1]] ] ]);
	} else if ( req.query.g ) {
		searchArea = wkt.parse(req.query.g);
		for ( var i =0; i < searchArea.coordinates[0].length; i++ ) {
			var x = searchArea.coordinates[0][i][1];
			var y = searchArea.coordinates[0][i][0];
			searchArea.coordinates[0][i][0] = x;
			searchArea.coordinates[0][i][1] = y;
		}
	}
	
	var inside = function(feature) {
		if (feature.geometry) {
			var geom = new terraformer.Primitive( feature.geometry );
			return ( searchArea.intersects(geom) ||  contains(searchArea,geom) )
			&& timeInsideFeature(feature,req.query.start,req.query.stop);
		} else {
			return timeInsideFeature(feature,req.query.start,req.query.stop);
		}
	};
	
	var filterFeatures = [];
	for ( var i = 0; i < featureCollection.features.length; i++ ) {
		var feature = featureCollection.features[i];
		if ( inside(feature) ) {
			filterFeatures.push( feature );
		}
	}
	
	filterFeatures.sort( sortBytTime );

	// Fix product download
	for ( var i = 0; i < filterFeatures.length; i++ ) {
		var feature = filterFeatures[i];
		var eop = feature.properties.EarthObservation;
		if ( eop && eop.EarthObservationResult.eop_ProductInformation
			&& eop.EarthObservationResult.eop_ProductInformation.eop_filename ) {
			eop.EarthObservationResult.eop_ProductInformation.eop_filename = eop.EarthObservationResult.eop_ProductInformation.eop_filename.replace('localhost:3000',req.headers.host);
		}
	}
	
	var count = req.query.count || 10;
	var startIndex = req.query.startIndex || 1;
	startIndex = parseInt(startIndex);
	count = parseInt(count);
	var response = {
		type: 'FeatureCollection',
		properties: {
			totalResults : filterFeatures.length
		},
		features: filterFeatures.slice(startIndex-1,startIndex-1+count)
	};
	setTimeout( function() { res.send(response); }, 1000 );
	
};