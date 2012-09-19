/**
  * Configuration module
  */


define( [], function() {

var configuration = {
	
	// Map configuration
	map: {
		backgroundLayers: [{
			name: "Open Street Map (Official)",
			type: "OSM",
			baseUrl: "http://tile.openstreetmap.org",
		}, {
			name: "Open Street Map (Mapquest)",
			type: "OSM",
			baseUrl: "http://otile1.mqcdn.com/tiles/1.0.0/osm"
		}, {
			name: "Open Street Map (OpenCycleMap)",
			type: "OSM",
			baseUrl: "http://a.tile.opencyclemap.org/cycle"
		}, {
			name: "Blue Marble (TPZ-WMS)",
			type: "WMS",
			baseUrl: "http://demonstrator.telespazio.com/wmspub",
			layers: "BlueMarble"
		}, {
			name: "Bing Road",
			type: "Bing",
			key: "Ar7-_U1iwNtChqq64tAQsOfO8G7FwF3DabvgkQ1rziC4Z9zzaKZlRDWJTKTOPBPV",
			imageSet: "Road"
		}, {
			name: "Bing Aerial",
			type: "Bing",
			key: "Ar7-_U1iwNtChqq64tAQsOfO8G7FwF3DabvgkQ1rziC4Z9zzaKZlRDWJTKTOPBPV",
			imageSet: "Aerial"
		}]
	}
};

return configuration;

});



