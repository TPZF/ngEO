/*
 * Parse coverage from EOX
 */

var fs = require('fs');
var DOMParser = require('xmldom').DOMParser;

function convertToGeojsonPolygon(polygon) {
	var inputCoordinates=polygon.split(/\s+/);
	var coordinates = [];
	var j=0;
	while (inputCoordinates[j]!=null) {
		coordinates.push( [ parseFloat(inputCoordinates[j+1]), 
		                    parseFloat(inputCoordinates[j]) ] );
		j=j+2;
	}
	return [ coordinates ];
}

module.exports.parse = function(file,fc) {

	var data = fs.readFileSync(file, 'utf8');
	var doc = new DOMParser().parseFromString(data);
	var nodes = doc.getElementsByTagName('wcs:CoverageDescription');
	
	var featureCollection = {
		type: "FeatureCollection",
		features: []
	};

	for ( var i = 0; i < nodes.length; i++ ) {
		var node = nodes[i];
		
		var timeStart = node.getElementsByTagName('gml:beginPosition')[0];
		var timeStop = node.getElementsByTagName('gml:endPosition')[0];
		
		var posList = node.getElementsByTagName('gml:posList')[0];

		// "Clone" feature
		var feature = JSON.parse( JSON.stringify(fc.features[ i % fc.features.length ]) );
		feature.properties.EarthObservation.gml_beginPosition = timeStart.textContent;
		feature.properties.EarthObservation.gml_endPosition = timeStop.textContent;
		feature.geometry.coordinates = convertToGeojsonPolygon(posList.textContent);
		feature.properties.EarthObservation.EarthObservationResult.eop_BrowseInformation = {
			eop_type: "wmts",
			eop_layer: "TEST_SAR",
			eop_url: 'http://ngeo.eox.at/c/wmts/'
		};
		featureCollection.features.push( feature ); 

	}
	
	return featureCollection;

};

