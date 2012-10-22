
define(['jquery', 'map/ngeo.map', 'ngeo.toolbar'], function($,Map,ToolBar) {

var mode2D = true;

return function (dsa) {
/*	var $toolbar = $("#toolbar");
	$toolbar.toolbar("addSeparator");
	
	$toolbar.toolbar("addAction", {id: 'home', text: 'Start View'});
	$toolbar.toolbar("addAction", {id: 'left', text: 'Previous'});
	$toolbar.toolbar("addAction", {id: 'right', text: 'Next'});
	$toolbar.toolbar("addAction", {id: 'zoomOut', text: 'Zoom Out'});
	$toolbar.toolbar("addAction", {id: 'zoomIn', text: 'Zoom In'});
	$toolbar.toolbar("addAction", {id: 'background', text: 'Background'});
	$toolbar.toolbar("addAction", {id: 'switch', text: '2D/3D'});*/
		
	/*$("#toolbar").append('<div class="tb-separator"></div>');
	ToolBar.addAction('home','Start View');
	ToolBar.addAction('left','Previous');
	ToolBar.addAction('right','Next');
	ToolBar.addAction('zoomOut','Zoom Out');
	ToolBar.addAction('zoomIn','Zoom In');
	ToolBar.addAction('background','Background');
	ToolBar.addAction('switch','2D/3D');*/
	
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
	dsa.find("#left").click( function() { 
		if ( viewIndex > 0 ) {
			viewIndex--;
			block = true;
			Map.zoomTo( views[viewIndex] );
			block = false;
		}
	});
	dsa.find("#right").click( function() {
		if ( viewIndex < views.length-1 ) {
			viewIndex++;
			block = true;
			Map.zoomTo( views[viewIndex] );
			block = false;
		}
	});

};

});