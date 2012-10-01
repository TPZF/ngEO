
define(['jquery', 'ngeo.map', 'ngeo.toolbar'], function($,Map,ToolBar) {

return function () {
	$("#toolbar").append('<div class="tb-separator"></div>');
	ToolBar.addAction('home','Start View');
	ToolBar.addAction('left','Previous');
	ToolBar.addAction('right','Next');
	ToolBar.addAction('zoomOut','Zoom Out');
	ToolBar.addAction('zoomIn','Zoom In');
	ToolBar.addAction('background','Background');
	ToolBar.addAction('switch','2D/3D');
	
	$("#zoomIn").click( function() { Map.zoomIn(); } );
	$("#zoomOut").click( function() { Map.zoomOut(); } );
	$("#switch").click( function() { Map.switchMapEngine(); } );
	$("#home").click( function() { Map.zoomToMaxExtent(); } );
	
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

};

});