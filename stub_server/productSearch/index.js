/*
 * GET datasetPopulationMatrix
 * IF-ngEO-datasetPopulationMatrix
 */

var fs = require('fs'),
	wcsCoveragePaser = require('./wcsCoverageParser'),
	eoliParser = require('./EOLIParser');
	
//wcsCoveragePaser.parse('./productSearch/sar_coverage.xml');

/*
 * Fill the features with 'good' properties
 */
var featureCollection = null;
/*fs.readFile('./productSearch/results.json', 'utf8', function (err, data) {
	var inputFeatureCollection = JSON.parse(data);
	//featureCollection = eoliParser.parse('./productSearch/dataFromEOLI.txt',inputFeatureCollection);
	featureCollection = wcsCoveragePaser.parse('./productSearch/sar_coverage.xml',inputFeatureCollection);
});*/
fs.readFile('./productSearch/Response.json', 'utf8', function (err, data) {
	featureCollection = JSON.parse(data);
});
module.exports = function(req, res){
	var count = req.query.count || 10;
	var startIndex = req.query.startIndex || 1;
	startIndex = parseInt(startIndex);
	count = parseInt(count);
	var response = {
		type: 'FeatureCollection',
		features: featureCollection.features.slice(startIndex-1,startIndex-1+count)
	};
	res.send(response);
};