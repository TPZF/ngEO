/*
 * GET datasetPopulationMatrix
 * IF-ngEO-datasetPopulationMatrix
 */

var fs = require('fs');

var datasetPopulationMatrix;
fs.readFile('./datasetPopulationMatrix/datasets.json', 'utf8', function (err, data) {
	datasetPopulationMatrix  = JSON.parse(data);
	for ( var i = 17; i <= 1000; i++ ) {
		datasetPopulationMatrix.datasetpopulationmatrix.datasetPopulationValues.push( [ "M" + i, "", "", "false", "test" + i,"100"] );
	  }
});

module.exports = function(req, res){
  //res.sendfile('./datasetPopulationMatrix/datasets.json');
   res.send(datasetPopulationMatrix);
};