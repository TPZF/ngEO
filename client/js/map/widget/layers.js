/**
  * Layers widget module
  */


define( [ "map/map", "widget" ], function(Map) {

/**
 * The HTML element that contains the layer list
 */
var container;

/**
 * Callback called when a layer is checked
 */
var layerCheckedCallback = function() {
	var $this = $(this);
	Map.setLayerVisible($this.data('id'),$this.prop('checked'));
};

/**
 * Build the HTML for a layer
 */
var buildHTML = function(layer,i) {

	// Build the input
	var input = $("<input data-theme='c' type='checkbox'" + (layer.visible ? "checked='checked'" : "") + ">")
		.data('id',i);
	
	// Callback called when the input is changed
	input.change(layerCheckedCallback);
	
	// Build the label for input and add it to the group
	$("<label data-mini='true'>" + layer.name + "</label>")
		.prepend(input)
		.appendTo(container);
};

return function(dsa) {
	dsa.append('<div id="layersWidget"/>');

	// Build overlays panel
	container = $("<fieldset data-role='controlgroup' />");
	
	var layers = Map.layers;
	for ( var i=0; i < layers.length; i++ ) {
		buildHTML( layers[i], i );
	}
	container.appendTo("#layersWidget");
	
	// Callback when a layer is added on the map
	Map.on('layerAdded', function(layer,i) {
		buildHTML(layer,i);
		$('#layersWidget').trigger('create');
	});
	
	// Create widget
	$("#layersWidget").ngeowidget({
		activator: '#layers'
	});
};
	
});





