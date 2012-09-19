
require.config({
    //baseUrl: "/another/path",
    paths: {
        "jquery": "externs/jquery-1.7.1.min",
		"jquery.ui": "externs/jquery-ui-1.8.18.custom.min",
        "underscore": "externs/underscore",
		"backbone": "externs/backbone"
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
		"underscore": {
            deps: [],
            exports: '_'
		},
		"backbone": {
            deps: ["underscore"],
            exports: 'Backbone'
		}
	}
  });

require( ["jquery.ui", "ngeo.map", "ngeo.configuration", "ngeo.widget"], function($, Map, Configuration) {

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
	
	var layers = Configuration.map.backgroundLayers;
	for ( var i=0; i < layers.length; i++ ) {
		$("#backgroundImageries").append("<option value='" + i + "'>"+layers[i].name+"</option>");
	}
	$("#backgroundImageries").change( function() {
		var val = $(this).val();
		Map.setBackgroundLayer( Configuration.map.backgroundLayers[val] );
	});
	
	$("#layersWidget").ngeowidget({
		title: 'Layers',
		activator: '#layers'
	});
	
	
	// Quick and dirty previous/next management
	var views = [ Map.getViewportExtent() ];
	var viewIndex = 0;
	var block = false;
	
	Map.on("endNavigation", function() {
		if (!block) {
			viewIndex++; 
			views[viewIndex] = Map.getViewportExtent();  
			views.length = viewIndex + 1;
		}
	});
	$("#left").click( function() { 
		if ( viewIndex > 0 ) {
			viewIndex--;
			block = true;
			Map.zoomTo( views[viewIndex] );
			block = false;
		}
	});
	$("#right").click( function() {
		if ( viewIndex < views.length-1 ) {
			viewIndex++;
			block = true;
			Map.zoomTo( views[viewIndex] );
			block = false;
		}
	});

});

});