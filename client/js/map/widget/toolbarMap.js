var Map = require('map/map');
var LayersWidget = require('map/widget/layers');
var BackgroundWidget = require('map/widget/background');
var UserPrefs = require('userPrefs');

var mode2D = UserPrefs.get('Map mode') ? UserPrefs.get('Map mode') == '2d' : true;

module.exports = function(dsa) {

	this.layersWidget = new LayersWidget(dsa);

	// Create widget
	this.layersWidget.$el.ngeowidget({
		activator: '#layers'
	});

	new BackgroundWidget(dsa);

	$("#zoomIn").click(function() {
		Map.zoomIn();
	});
	$("#zoomOut").click(function() {
		Map.zoomOut();
	});
	$("#home").click(function() {
		Map.zoomToMaxExtent();
	});

	$("#switch").click(function() {
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

	// TEMPO : use draw button to launch drawing, useful for testing
	/*	dsa.find("#draw").click( function(event) {
			var $this = $(this);
			$this.toggleClass('toggle');
			mapEngine = Map.getMapEngine();
			if ( $this.hasClass('toggle') ) {
				RectangleHandler.start({
					stop: function() {
						$this.toggleClass('toggle');
					}
				});
			} else {
				RectangleHandler.stop();
			}
		});*/

};