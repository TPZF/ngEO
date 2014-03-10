/*
 * GET datasetPopulationMatrix
 * IF-ngEO-datasetPopulationMatrix
 */

var fs = require('fs');

var datasetPopulationMatrix;
fs.readFile('./datasetPopulationMatrix/datasets.json', 'utf8', function (err, data) {
	datasetPopulationMatrix  = JSON.parse(data);
	 var len = datasetPopulationMatrix.datasetpopulationmatrix.datasetPopulationValues.length;
	  for ( var i = len; i < 1000; i++ ) {
		datasetPopulationMatrix.datasetpopulationmatrix.datasetPopulationValues.push( [ "M" + i, "", "", "test" + i,"100"] );
	  }
});

module.exports = function(req, res){
  //res.sendfile('./datasetPopulationMatrix/datasets.json');
   res.send(datasetPopulationMatrix);
};