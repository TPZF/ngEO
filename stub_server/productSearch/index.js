/*
 * GET datasetPopulationMatrix
 * IF-ngEO-datasetPopulationMatrix
 */

var fs = require('fs'),
	wcsCoveragePaser = require('./wcsCoverageParser'),
	eoliParser = require('./EOLIParser');
	
//wcsCoveragePaser.parse('./productSearch/sar_coverage.xml');

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
/*
module.exports = function(req, res){
	sleep.sleep(3);
	res.send(featureCollection);
	//res.status(500).send('');
};*/

//USE THIS CODE TO TEST PAGINATION
fs.readFile('./productSearch/Response.json', 'utf8', function (err, data) {
	featureCollections['ATS_TOA_1P']  = JSON.parse(data);
});

module.exports = function(req, res){
	var featureCollection;
	if ( featureCollections.hasOwnProperty( req.param('datasetId') ) ) {
		featureCollection = featureCollections[req.param('datasetId')];
	} else {
		featureCollection = featureCollections['default'];
	}
	var count = req.query.count || 10;
	var startIndex = req.query.startIndex || 1;
	startIndex = parseInt(startIndex);
	count = parseInt(count);
	var response = {
		type: 'FeatureCollection',
		features: featureCollection.features.slice(startIndex-1,startIndex-1+count)
	};
	setTimeout( function() { res.send(response); }, 1000 );
	
};