/*
 * GET datasetPopulationMatrix
 * IF-ngEO-datasetPopulationMatrix
 */

var fs = require('fs'),
	terraformer = require('terraformer'),
	wkt = require('terraformer-wkt-parser'),
	wcsCoveragePaser = require('./wcsCoverageParser'),
	eoliParser = require('./EOLIParser'),
	find = require('lodash.find')
	conf = require('../webClientConfigurationData/configuration'),
	logger = require('../utils/logger');

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
	featureCollections['landsat'] = wcsCoveragePaser.parse('./productSearch/landsat_coverage.xml',inputFeatureCollection);
});
// New json format
fs.readFile('./productSearch/S2MSI1A_response.json', 'utf8', function(err, data) {
	featureCollections['S2MSI1A']  = JSON.parse(data);
});
fs.readFile('./productSearch/S1_SAR_EW_DUAL_POL_response.json', 'utf8', function(err, data) {
	featureCollections['S1_SAR_EW_DUAL_POL']  = JSON.parse(data);
});
fs.readFile('./productSearch/ENVISAT_ASA_IM__0P_response.json', 'utf8', function (err, data) {
	featureCollections['ENVISAT_ASA_IM__0P']  = JSON.parse(data);
});

// Old json format
fs.readFile('./productSearch/ATS_TOA_1P_response.json', 'utf8', function (err, data) {
	featureCollections['ATS_TOA_1P']  = conf.toNewJsonFormat(JSON.parse(data));
});
fs.readFile('./productSearch/ASA_WS__0P_response.json', 'utf8', function (err, data) {
	featureCollections['ASA_WS__0P']  = conf.toNewJsonFormat(JSON.parse(data));
});
fs.readFile('./productSearch/Sentinel2_response.json', 'utf8', function (err, data) {
	featureCollections['Sentinel2']  = conf.toNewJsonFormat(JSON.parse(data));
});
fs.readFile('./productSearch/Line_response.json', 'utf8', function (err, data) {
	featureCollections['Line']  = conf.toNewJsonFormat(JSON.parse(data));
});
fs.readFile('./productSearch/Crossing_response.json', 'utf8', function (err, data) {
	featureCollections['Crossing']  = conf.toNewJsonFormat(JSON.parse(data));
});
fs.readFile('./productSearch/Browses_response.json', 'utf8', function (err, data) {
	featureCollections['Browses']  = conf.toNewJsonFormat(JSON.parse(data));
});
fs.readFile('./productSearch/Global_response.json', 'utf8', function (err, data) {
	featureCollections['Global']  = conf.toNewJsonFormat(JSON.parse(data));
});
fs.readFile('./productSearch/MultiLine_response.json', 'utf8', function (err, data) {
	featureCollections['MultiLine']  = conf.toNewJsonFormat(JSON.parse(data));
});
fs.readFile('./productSearch/HalfOrbit_response.json', 'utf8', function (err, data) {
	featureCollections['HalfOrbit']  = conf.toNewJsonFormat(JSON.parse(data));
});
fs.readFile('./productSearch/Correlation_response.json', 'utf8', function (err, data) {
	featureCollections['Correlation']  = conf.toNewJsonFormat(JSON.parse(data));
});
fs.readFile('./productSearch/ATS_TOA_1P_response.json', 'utf8', function (err, data) {
	featureCollections['DATASET_WITH_A_LONG_LONG_VEEERY_LONG_NAME']  = JSON.parse(data);
});

// Graticules related files
var graticules;
var dummyProperties;

// Use UTM grid as graticules base for test
fs.readFile('./productSearch/utm.json', 'utf8', function(err, data) {
	graticules = JSON.parse(data);
});
fs.readFile('./productSearch/dummyProperties.json', 'utf8', function(err, data) {
	dummyProperties = JSON.parse(data);
});

var initialized = false;

/**
 * Time filter
 */
var timeInsideFeature = function(feature, start, stop) {
	var startFeature = feature.properties.EarthObservation.phenomenonTime.TimePeriod.beginPosition;
	var stopFeature = feature.properties.EarthObservation.phenomenonTime.TimePeriod.endPosition;
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
	var starta = new Date(a.properties.EarthObservation.phenomenonTime.TimePeriod.beginPosition);
	var startb = new Date(b.properties.EarthObservation.phenomenonTime.TimePeriod.beginPosition);
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
		// HACK: for new json format we check id with "&format=atom" as well
		if ( fc.features[i].id == decodeURIComponent(id) || fc.features[i].id.indexOf(decodeURIComponent(id)+"&format=atom") >= 0 ) {
			return fc.features[i];
		}
	}
};

var setupProductUrl = function(featureCollection,id) {
	for ( var i = 0; i < featureCollection.features.length; i++ )  {
		var feature = featureCollection.features[i];
		var fid = feature.id;
		//here it is used by tfhe direct download
		conf.setMappedProperty(feature, "productUri", "http://localhost:3000/ngeo/catalogue/" + id + "/search?id=" + encodeURIComponent(fid));
		//here will be used by the download manager
		conf.setMappedProperty(feature, "productUrl", "http://localhost:3000/ngeo/catalogue/" + id + "/search?id=" + encodeURIComponent(fid));
	}
};

/**
* return a default bbox covering entire world by default
*/
var defaultSearchAreaBbox = function(){
	var bbox = [-180,-90,180,90];
	var defaultSearchArea = new terraformer.Polygon([ [ [bbox[0],bbox[1]],
				[bbox[0],bbox[3]], [bbox[2],bbox[3]], [bbox[2],bbox[1]], [bbox[0],bbox[1]] ] ]);
	return defaultSearchArea;
};

module.exports = function(req, res){

	// Find the feature collection
	var fcId = 'default';
/*	if ( req.param('with') ) {
		fcId = 'Correlation';
	} else if ( featureCollections.hasOwnProperty( req.param('datasetId') ) ){
		fcId = req.param('datasetId');
	}*/
	
	if ( featureCollections.hasOwnProperty( req.param('datasetId') ) ){
		fcId = req.param('datasetId');
	}
	logger.debug("Search on : " + fcId);
	
	var featureCollection = featureCollections[fcId];
	
	setupProductUrl( featureCollection, req.param('datasetId') );
	
	// Find with id or not
	if ( req.query.id ) {
		var feature = findFeature(featureCollection, req.query.id);

		// Graticules request
		// TODO: this code is here cuz productUrl comes with "id=" (see setupProductUrl method) -> refactor it to no more use of "id"
		if ( req.query.enableSourceproduct ) {
			var instersectedFeatures = [];
			// Send only intersected graticules as "sources"
			for ( var i=0; i<graticules.features.length; i++ ) {
				graticule = graticules.features[i];
				if ( new terraformer.Primitive(feature.geometry).intersects( new terraformer.Primitive(graticule.geometry) ) ) {
					graticule.properties = dummyProperties;
					graticule.id = "graticule_" + i;
					instersectedFeatures.push( graticule );
				}
			}
			feature.properties.sources = instersectedFeatures;
		}
		res.send( feature );
		return;
	}
	
	//by default the search area is entire world
	var searchArea = defaultSearchAreaBbox();
	
	if ( req.query.bbox ) {
		var bbox = req.query.bbox.split(',');
		bbox = bbox.map( parseFloat );
		searchArea = new terraformer.Polygon([ [ [bbox[0],bbox[1]],
				[bbox[0],bbox[3]], [bbox[2],bbox[3]], [bbox[2],bbox[1]], [bbox[0],bbox[1]] ] ]);
	} else if ( req.query.geom ) {
		searchArea = wkt.parse(req.query.geom);
		// No need to inverse lon/lat ! Wkt already parses in lon/lat specification
		// for ( var i =0; i < searchArea.coordinates[0].length; i++ ) {
		// 	var x = searchArea.coordinates[0][i][1];
		// 	var y = searchArea.coordinates[0][i][0];
		// 	searchArea.coordinates[0][i][0] = x;
		// 	searchArea.coordinates[0][i][1] = y;
		// }
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
		var productUri = conf.getMappedProperty(feature, "productUri", null);
		if ( productUri ) {
			conf.setMappedProperty(feature, "productUri", productUri.replace('localhost:3000', req.headers.host));
		}
		
		// OLD FORMAT
		// var slaveUrl = req.param('with');
		// feature.properties.rel = req.param('with');
		
		// NEW FORMAT
		var slaveUrl = req.param('correlatedTo');
		conf.setMappedProperty(feature, "interferometryUrl", slaveUrl);

		// Update @rel property for interferometry link
		var links = conf.getMappedProperty(feature, "links");
		var interferometryLink = find(links, function(link) {
			return link['@title'] == "interferometry";
		});
		interferometryLink['@rel'] = "related";
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