
define(['jquery', 'map/map', 'toolbar'], function($,Map,ToolBar) {

var mode2D = true;

return function (dsa) {
	
	var dsa = $('#dataServicesArea');
	
	dsa.find("#zoomIn").click( function() { Map.zoomIn(); } );
	dsa.find("#zoomOut").click( function() { Map.zoomOut(); } );
	dsa.find("#home").click( function() { Map.zoomToMaxExtent(); } );
	
	dsa.find("#switch").click( function() {
		mode2D = !mode2D;
		if (!Map.switchMapEngine(mode2D ? '2d' : '3d')) {
			// Create a pop-up to warn the user
			$('<div><p>3D map is not available because WebGL is not supported by your browser, see <a href="http://get.webgl.org/">here</a> for more details.</p></div>')
				.appendTo('#mapContainer')
				.popup()
				.popup('open');
			mode2D = true;
			// Switch back to 2D
			Map.switchMapEngine('2d'); 
		}
	});

};

});