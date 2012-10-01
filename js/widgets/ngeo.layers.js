/**
  * Layers widget module
  */


define( [ "ngeo.configuration", "ngeo.map", "ngeo.toolbar", "ngeo.widget" ], function(Configuration, Map, ToolBar) {

return function() {

	ToolBar.addAction('layers','Layers');

	// Build overlays panel
	var layers = Configuration.map.layers;
	var group = $("<fieldset data-role='controlgroup' />");
	for ( var i=0; i < layers.length; i++ ) {
		var input = $("<input data-theme='c' type='checkbox'" + (layers[i].visible ? "checked='checked'" : "") + ">")
			.data('id',i)
			.change(function() {
			Map.setLayerVisible($(this).data('id'),$(this).attr('checked') == 'checked');
		});
		$("<label>"+layers[i].name+"</label>")
			.prepend(input)
			.appendTo(group);
	}
	
	group.appendTo("#layersWidget");
	
	// Create widget
	$("#layersWidget").ngeowidget({
		title: 'Layers',
		activator: '#layers'
	});
};
	
});





