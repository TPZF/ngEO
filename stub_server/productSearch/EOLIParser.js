/*
 * Parse from EOLI
 */

var fs = require('fs'),
	Configuration = require('../webClientConfigurationData/configuration');

var dataSet2wmsLayers = { "ESA.EECF.SPOT_ESA_MULTI" : "urn:ogc:def:EOP:ESA:ESA.EECF.SPOT_ESA_MULTI",
"ESA.EECF.SPOT_ESA_PAN" : "urn:ogc:def:EOP:ESA:ESA.EECF.SPOT_ESA_PAN",
"ESA.EECF.EOS_MOD_xS" : "urn:ogc:def:EOP:ESA:ESA.EECF.EOS_MOD_xS",
"ESA.EECF.SEASTAR_SWF_xS" : "urn:ogc:def:EOP:ESA:ESA.EECF.SEASTAR_SWF_xS",
"ESA.EECF.PROBA_HRC_xS" : "urn:ogc:def:EOP:ESA:ESA.EECF.PROBA_HRC_xS",
"ESA.EECF.PROBA_CHR_xS" : "urn:ogc:def:EOP:ESA:ESA.EECF.PROBA_CHR_xS",
"ESA.EECF.NOAA_AVH_xS" : "urn:ogc:def:EOP:ESA:ESA.EECF.NOAA_AVH_xS",
"ESA.EECF.NIMBUS_CZC_xS-I" : "urn:ogc:def:EOP:ESA:ESA.EECF.NIMBUS_CZC_xS-I",
"ESA.EECF.LANDSAT_RBV_xF-I" : "urn:ogc:def:EOP:ESA:ESA.EECF.LANDSAT_RBV_xF-I",
"ESA.EECF.LANDSAT_MSS_xF" : "urn:ogc:def:EOP:ESA:ESA.EECF.LANDSAT_MSS_xF",
"ESA.EECF.LANDSAT_TM__xF" : "urn:ogc:def:EOP:ESA:ESA.EECF.LANDSAT_TM__xF",
"ESA.EECF.KOMPSAT_EOC_H" : "urn:ogc:def:EOP:ESA:ESA.EECF.KOMPSAT_EOC_H",
"ESA.EECF.IRS_MOS_xS" : "urn:ogc:def:EOP:ESA:ESA.EECF.IRS_MOS_xS",
"ESA.EECF.ALOS_PSR_P-X" : "urn:ogc:def:EOP:ESA:ESA.EECF.ALOS_PSR_P-X",
"ESA.EECF.ALOS_PSR_FL-X" : "urn:ogc:def:EOP:ESA:ESA.EECF.ALOS_PSR_FL-X",
"ESA.EECF.ALOS_PSR_FD-X" : "urn:ogc:def:EOP:ESA:ESA.EECF.ALOS_PSR_FD-X",
"ESA.EECF.ALOS_PSR_FH-X" : "urn:ogc:def:EOP:ESA:ESA.EECF.ALOS_PSR_FH-X",
"ESA.EECF.ALOS_PSR_SH-X" : "urn:ogc:def:EOP:ESA:ESA.EECF.ALOS_PSR_SH-X",
"ESA.EECF.ALOS_PSR_SL-X" : "urn:ogc:def:EOP:ESA:ESA.EECF.ALOS_PSR_SL-X",
"ESA.EECF.ALOS_AVNIR_X" : "urn:ogc:def:EOP:ESA:ESA.EECF.ALOS_AVNIR_X",
"ESA.EECF.ALOS_PSM_O3-X" : "urn:ogc:def:EOP:ESA:ESA.EECF.ALOS_PSM_O3-X",
"ESA.EECF.ALOS_PSM_O2-X" : "urn:ogc:def:EOP:ESA:ESA.EECF.ALOS_PSM_O2-X",
"ESA.EECF.ALOS_PSM_O1-X" : "urn:ogc:def:EOP:ESA:ESA.EECF.ALOS_PSM_O1-X",
"ESA.EECF.ERS_ATS_xS" : "urn:ogc:def:EOP:ESA:ESA.EECF.ERS_ATS_xS",
"ESA.EECF.ERS_SAR_xS" : "urn:ogc:def:EOP:ESA:ESA.EECF.ERS_SAR_xS",
"ESA.EECF.ENVISAT_SCI_C" : "urn:ogc:def:EOP:ESA:ESA.EECF.ENVISAT_SCI_C",
"ESA.EECF.ENVISAT_MIP_NL__xC" : "urn:ogc:def:EOP:ESA:ESA.EECF.ENVISAT_MIP_NL__xC",
"ESA.EECF.ENVISAT_ATS_xxx_xS" : "urn:ogc:def:EOP:ESA:ESA.EECF.ENVISAT_ATS_xxx_xS",
"ESA.EECF.ENVISAT_MER_RR__xS" : "urn:ogc:def:EOP:ESA:ESA.EECF.ENVISAT_MER_RR__xS",
"ESA.EECF.ENVISAT_MER_FR__xS" : "urn:ogc:def:EOP:ESA:ESA.EECF.ENVISAT_MER_FR__xS",
"ESA.EECF.ENVISAT_ASA_WSx_xS" : "urn:ogc:def:EOP:ESA:ESA.EECF.ENVISAT_ASA_WSx_xS",
"ESA.EECF.ENVISAT_ASA_APC_0S" : "urn:ogc:def:EOP:ESA:ESA.EECF.ENVISAT_ASA_APC_0S",
"ESA.EECF.ENVISAT_ASA_APV_0S" : "urn:ogc:def:EOP:ESA:ESA.EECF.ENVISAT_ASA_APV_0S",
"ESA.EECF.ENVISAT_ASA_APH_0S" : "urn:ogc:def:EOP:ESA:ESA.EECF.ENVISAT_ASA_APH_0S",
"ESA.EECF.ENVISAT_ASA_IMx_xS" : "urn:ogc:def:EOP:ESA:ESA.EECF.ENVISAT_ASA_IMx_xS",
"ESA.EECF.ENVISAT_ASA_GMI_1S" : "urn:ogc:def:EOP:ESA:ESA.EECF.ENVISAT_ASA_GMI_1S"
};

var browseWMSBaseUrl =  "/wms2eos?SERVICE=WMS&REQUEST=GetMap&EXCEPTIONS=application/vnd.ogc.se_xml&TRANSPARENT=TRUE&STYLES=ellipsoid&VERSION=1.1.1&SRS=EPSG:4326&FORMAT=image/png&BGCOLOR=0xffffff";


/*
 * Convert the coordinates into GeoJSON polygon
 */
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

module.exports.parse = function(file,fc) {

	var data = fs.readFileSync(file, 'utf8');

	var lines=data.split("\n");
	var columns=lines[1].split("|");
	//console.log("columns ("+columns.length+" elements): "+lines[1]);
	var footprintIndex = columns.indexOf('FOOTPRINT');
	var startIndex = columns.indexOf('Start');
	var stopIndex = columns.indexOf('Stop');
	var collectionIndex = columns.indexOf('COLLECTION');
	
	var missionIndex = columns.indexOf('Mission');
	var sensorIndex = columns.indexOf('Sensor');
	var swathIndex = columns.indexOf('Swath');
	var orbitIndex = columns.indexOf('Orbit');
	var passIndex = columns.indexOf('Pass');
	var statusIndex = columns.indexOf('Status');
	var prodTypeIndex = columns.indexOf('PRODUCT_TYPE');

	var featureCollection = {
		type: "FeatureCollection",
		features: []
	};
	
	for(var i = 0; i < lines.length - 2; i++) {
		var cells = lines[i+2].split('|');
		var footprintStr = cells[footprintIndex];
		var coords = convertToGeojsonPolygon(footprintStr);
		var feature = JSON.parse( JSON.stringify(fc.features[ i % fc.features.length ]) );
		feature.id = i+1;
		feature.geometry.coordinates = convertToGeojsonPolygon(footprintStr);

		Configuration.setMappedProperty(feature, "start", cells[startIndex].replace(' ','T') + '0Z');
		Configuration.setMappedProperty(feature, "stop", cells[stopIndex].replace(' ','T') + '0Z');

		var layer = dataSet2wmsLayers[ cells[collectionIndex] ];

		var browseUrl = "/wms2eos/servlets/wms?layers="+ layer +"&service=wms";
		// NGEO-2164 : New JSON format for browse information
		Configuration.setMappedProperty(feature, "browses",
			[{
				"BrowseInformation" : {
					"type": "QUICKLOOK",
					"referenceSystemIdentifier": {
						"@codeSpace": "EPSG",
						"#text": "EPSG:4326" // Currently not taken into account
					},
					"fileName": {
						"ServiceReference": {
							"@href": browseUrl,
							"RequestMessage": null
						}
					}
				}
			}]
		);

		Configuration.setMappedProperty(feature, "mission", cells[missionIndex]);
		Configuration.setMappedProperty(feature, "sensor", cells[sensorIndex]);
		Configuration.setMappedProperty(feature, "swath", cells[swathIndex]);
		Configuration.setMappedProperty(feature, "orbit", cells[orbitIndex]);
		Configuration.setMappedProperty(feature, "pass", cells[passIndex]);
		Configuration.setMappedProperty(feature, "status", cells[statusIndex]);
		Configuration.setMappedProperty(feature, "productType", cells[prodTypeIndex]);
		Configuration.setMappedProperty(feature, "imageQualityReportURL", "http://www.eo.esa.int/mayqualityReportUrl"+i);

		featureCollection.features.push( feature ); 
	}
	
	return featureCollection;

};