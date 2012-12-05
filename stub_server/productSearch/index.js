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
fs.readFile('./productSearch/results.json', 'utf8', function (err, data) {
	var inputFeatureCollection = JSON.parse(data);
	//featureCollection = eoliParser.parse('./productSearch/dataFromEOLI.txt',inputFeatureCollection);
	featureCollection = wcsCoveragePaser.parse('./productSearch/sar_coverage.xml',inputFeatureCollection);
});

module.exports = function(req, res){
  res.send(featureCollection);
};