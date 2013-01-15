/**
  * Layers widget module
  */


define( [ "map/map", "widget" ], function(Map) {

return function(dsa) {
	dsa.append('<div id="layersWidget"/>');

	// Build overlays panel
	var layers = Map.layers;
	var group = $("<fieldset data-role='controlgroup' />");
	for ( var i=0; i < layers.length; i++ ) {
	
		// Build the input
		var input = $("<input data-theme='c' type='checkbox'" + (layers[i].visible ? "checked='checked'" : "") + ">")
			.data('id',i);
		
		// Callback called when the input is changed
		input.change(function() {
			var $this = $(this);
			Map.setLayerVisible($this.data('id'),$this.prop('checked'));
		});
		
		// Build the label for input and add it to the group
		$("<label data-mini='true'>"+layers[i].name+"</label>")
			.prepend(input)
			.appendTo(group);
	}
	
	group.appendTo("#layersWidget");
	
	// Create widget
	$("#layersWidget").ngeowidget({
		activator: '#layers'
	});
};
	
});




