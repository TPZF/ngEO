/**
  * Layers widget module
  */


define( [ "ngeo.configuration", "ngeo.map", "ngeo.toolbar", "ngeo.widget" ], function(Configuration, Map, ToolBar) {

return function() {

	ToolBar.addAction('layers','Layers');

	// Build background layers panel
	var bgLayers = Configuration.map.backgroundLayers;
	for ( var i=0; i < bgLayers.length; i++ ) {
		$("#backgroundImageries").append("<option value='" + i + "'>"+bgLayers[i].name+"</option>");
	}
	
	// Build overlays panel
	var layers = Configuration.map.layers;
	for ( var i=0; i < layers.length; i++ ) {
		var input = $("<input type='checkbox'" + (layers[i].visible ? "checked='checked'" : "") + ">")
			.data('id',i)
			.change(function() {
			Map.setLayerVisible($(this).data('id'),$(this).attr('checked'));
		});
		$("<p>"+layers[i].name+"</p>")
			.prepend(input)
			.appendTo("#overlays");
	}
	
	// Implement background imageries change
	$("#backgroundImageries").change( function() {
		var val = $(this).val();
		Map.setBackgroundLayer( Configuration.map.backgroundLayers[val] );
	});
	
	// Create widget
	$("#layersWidget").ngeowidget({
		title: 'Layers',
		activator: '#layers'
	});
};
	
});





