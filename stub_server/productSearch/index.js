/*
 * GET datasetPopulationMatrix
 * IF-ngEO-datasetPopulationMatrix
 */

var fs = require('fs');


function convertToGeojsonPolygon(polygon) {
	polygon=polygon.replace("  "," "); //cleanup polygon
	var inputCoordinates=polygon.split(" ");
	var coordinates = [];
	var j=0;
	while(inputCoordinates[j]!=null) {
		coordinates.push( [ parseFloat(inputCoordinates[j+1]), 
		                    parseFloat(inputCoordinates[j]) ] );
		j=j+2;
	}
	return [ coordinates ];
}

var featureCollection = null;
fs.readFile('./productSearch/results.json', 'utf8', function (err, data) {
	featureCollection = JSON.parse(data);
	fs.readFile('./productSearch/dataFromEOLI.txt', 'utf8', function (err, data) {
		var lines=data.split("\n");
		var columns=lines[1].split("|");
		console.log("columns ("+columns.length+" elements): "+lines[1]);
		var footprintIndex = columns.indexOf('FOOTPRINT');
		console.log("footprint index : " + footprintIndex);
		
		for(var i = 0; i < featureCollection.features.length; i++) {
			var footprintStr = lines[i+2].split('|')[footprintIndex];
			console.log( footprintStr );
			var coords = convertToGeojsonPolygon(footprintStr);
			console.log( coords );
			featureCollection.features[i].geometry.coordinates = convertToGeojsonPolygon(footprintStr);
		}
		
	});
});

module.exports = function(req, res){
  //res.sendfile('./productSearch/results.json');
  res.send(featureCollection);
};