/*
 * Parse coverage from EOX
 */

var fs = require('fs');
var DOMParser = require('xmldom').DOMParser;
var Configuration = require('../webClientConfigurationData/configuration');

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

		Configuration.setMappedProperty(feature, "start", timeStart.textContent);
		Configuration.setMappedProperty(feature, "stop", timeStart.textContent);
		Configuration.setMappedProperty(feature, "browses", [{
			"BrowseInformation" : {
				eop_type: "wmts",
				eop_layer: "ESA.EECF.ERS_SAR_xS",
				eop_url: 'http://brow01.v1.ngeo.eox.at/c/wmts/'
			}
		}]);
		Configuration.setMappedProperty(feature, "links", []);
		feature.geometry.coordinates = convertToGeojsonPolygon(posList.textContent);
		featureCollection.features.push( feature ); 

	}
	
	return featureCollection;

};

