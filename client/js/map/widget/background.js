/**
 * Background widget module
 */

var Map = require('map/map');
var ngeoWidget = require('ui/widget');

/**
 * The background widget
 */
var backbroundWidget;

/**
 * Function to change the background when selected
 */
var changeBackground = function() {
	var layer = $(this).closest('fieldset').find('input[name="background-choice"]:checked').data("layer")
	Map.setBackgroundLayer(layer);
	backbroundWidget.ngeowidget("hide");
};

var BackgroundWidget = function(dsa) {
	// Add the background widget to the data services area
	dsa.append('<div id="backgroundWidget"/>');

	// Build background layers panel 
	this.container = $('<fieldset data-role="controlgroup"></fieldset>');
	var bgLayers = Map.backgroundLayers;
	for (var i = 0; i < bgLayers.length; i++) {
		this.buildHtml(bgLayers[i]);
	}

	backbroundWidget = $("#backgroundWidget")
		.append(this.container).ngeowidget({
			activator: '#background'
		});

	var self = this;
	Map.on('backgroundLayerAdded', function(layer) {
		self.buildHtml(layer);
		$(backgroundWidget).trigger("create");
	})
	Map.on('backgroundLayerRemoved', function(layer) {
		self.container.find('input').each(function() {
			if ($(this).data('layer') == layer) {
				$(this).parent().remove();
			}
		});
		$(backgroundWidget).trigger('create');
	});
	Map.on('backgroundLayerSelected', function(layer) {
		var input = _.find(self.container.find('input'), function(input) {
			return $(input).data("layer") == layer;
		});
		$(input).prop("checked", true).checkboxradio("refresh");
	});

	// Select the background used from the preferences unless select the first one
	var selector = '#' + Map.getBackgroundLayer().id;
	//check the background layer radio box 
	$(dsa).find(selector).prop('checked', 'checked').checkboxradio("refresh");
};

/**
 *	Build the HTML for background layer
 */
BackgroundWidget.prototype.buildHtml = function(layer) {

	// Add radio button + attribute callback on change
	var isChecked = layer.visible ? 'checked="checked"' : "";
	var id = layer.id ? layer.id : layer.name.replace(/\s+/g,"_");
	var input = $('<input id="' + id + '" type="radio" name="background-choice" '+ isChecked +' />')
		.data("layer", layer)
		.change(changeBackground);

	// Build the label for input and add it to the group
	$('<label for="'+id+'" data-mini="true">' + layer.name + '</label>')
		.append(input)
		.appendTo(this.container);
};

module.exports = BackgroundWidget