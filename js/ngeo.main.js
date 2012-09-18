
require.config({
    //baseUrl: "/another/path",
    paths: {
        "jquery": "externs/jquery-1.7.1.min",
		"jquery.ui": "externs/jquery-ui-1.8.18.custom.min"
    },
	shim: {
		'jquery': {
            deps: [],
            exports: 'jQuery'
        },
		'jquery.ui': {
            deps: ['jquery'],
            exports: 'jQuery'
        },
		"http://jqueryui.com/themeroller/themeswitchertool/": {
            deps: ['jquery'],
            exports: 'jQuery.fn.themeswitcher'
        },
		"externs/mustache": {
            deps: [],
            exports: 'Mustache'
		}
	}
  });

require( ["jquery.ui", "ngeo.map", "ngeo.widget"], function($,Map) {

//** Main function : called when the document is ready
$(document).ready(function() {
	
	// Initialize the map
	Map.initialize('mapContainer');
	
	// Manage window resize
	$(window).resize( function() {
		Map.updateViewportSize();
	});
	
	function addToolbarAction( id, text ) {
		var html = '<div class="tb-elt"><img id="' + id + '" class="tb-button button" src="images/' + id + '.png" /><div class="tb-text">' + text + '</div></div>';
		$("#toolbar").append(html);
	}
	
	addToolbarAction('search','Search');
	addToolbarAction('shopcart','Shopcart');
	addToolbarAction('layers','Layers');
	$("#toolbar").append('<div class="tb-separator"></div>');
	addToolbarAction('home','Start View');
	addToolbarAction('left','Previous');
	addToolbarAction('right','Next');
	addToolbarAction('zoomOut','Zoom Out');
	addToolbarAction('zoomIn','Zoom In');
	addToolbarAction('pencil','Draw');
	addToolbarAction('switch','2D/3D');

	$("#zoomIn").click( function() { Map.zoomIn(); } );
	$("#zoomOut").click( function() { Map.zoomOut(); } );
	$("#switch").click( function() { Map.switchMapEngine(); } );
	$("#home").click( function() { Map.zoomToMaxExtent(); } );
	
	$("#searchWidget").ngeowidget({
		title: 'Search',
		activator: '#search',
		buttons: [ "Button1", "Button2" ]
	});
	
	$("#shopcartWidget").ngeowidget({
		title: 'Shopcart',
		activator: '#shopcart',
		buttons: [ "Button1" ]
	});

});

});