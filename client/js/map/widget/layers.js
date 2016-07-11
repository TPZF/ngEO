/**
 * Layers widget module
 */

var Map = require('map/map');
var ngeoWidget = require('ui/widget');
var SelectHandler = require('map/selectHandler');

/**
 * Callback called when a layer is checked
 */
var layerCheckedCallback = function() {
	var layer = $(this).data('layer');
	var isVisible = !layer.params.visible;
	layer.setVisible(isVisible);	
};

var LayersWidget = function(element) {

	var $layersWidget = $('<div id="layersWidget"/>').appendTo(element);

	// Build overlays panel
	this.container = $("<fieldset data-role='controlgroup'></fieldset>");

	var layers = Map.layers;

	// Update checkboxes when layers visibility has changed
	Map.on("visibility:changed", function(layer) {
		var $input = null;
		// Fins input according to layer
		self.container.find('input').each(function() {
			if ($(this).data('layer') == layer) {
				$input = $(this);
				return;
			}
		});

		if ($input) {
			var isVisible = layer.params.visible;
			if ( isVisible ) {
				$input.prop('checked', 'checked').checkboxradio("refresh");
			} else {
				$input.removeProp('checked').checkboxradio("refresh");
			}
			SelectHandler.setPickable(layer, isVisible);
		}
	});

	for (var i = 0; i < layers.length; i++) {
		this.buildHTML(layers[i]);
	}
	this.container.appendTo($layersWidget);

	var self = this;
	// Callback when a layer is added on the map
	Map.on('layerAdded', function(layer) {
		if ( layer.type != "Browses" && layer.params.name.indexOf("Footprints") == -1 ) {
			self.buildHTML(layer);
			$layersWidget.trigger('create');
		}
	});

	// Callback when a layer is removed from the map
	Map.on('layerRemoved', function(layer) {
		if ( layer.type != "Browses" && layer.params.name.indexOf("Footprints") == -1 ) {
			self.container.find('input').each(function() {
				if ($(this).data('layer') == layer) {
					$(this).parent().remove();
				}
			});
			$layersWidget.trigger('create');
		}
	});

	this.$el = $layersWidget;
};

/**
 * Build the HTML for a layer
 */
LayersWidget.prototype.buildHTML = function(layer) {

	if ( layer.params.name.indexOf('Footprints') == -1 ) {
		// Build the input
		var input = $("<input type='checkbox'" + (layer.params.visible ? "checked='checked'" : "") + ">")
			.data('layer', layer);

		// Callback called when the input is changed
		input.change(layerCheckedCallback);

		// Build the label for input and add it to the group
		$("<label data-mini='true'>" + (layer.params.title ? layer.params.title : layer.params.name) + "</label>")
			.prepend(input)
			.appendTo(this.container);
	}
};

/**
 *	Refresh visibility of layers
 */
LayersWidget.prototype.refresh = function() {
	// Not the best solution ever.. satisfying for now
	this.container.empty();
	var layers = Map.layers;
	for (var i = 0; i < layers.length; i++) {
		this.buildHTML(layers[i]);
	}
	this.$el.trigger('create');

};

module.exports = LayersWidget;