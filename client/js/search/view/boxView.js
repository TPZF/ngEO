var Map = require('map/map');
var RectangleHandler = require('map/rectangleHandler');

function isValidLon(lon) {
	if (isNaN(lon))
		return false;

	return lon >= -180 && lon <= 180;
}

function isValidLat(lat) {
	if (isNaN(lat))
		return false;

	return lat >= -90 && lat <= 90;
}

/**
 * Will verify first if the value is a number or not,
 * if so then parse the value into float.
 * See issue NGEO-1370
 */
function filterFloat(value) {
	if (isNaN(value))
		return NaN;
	return parseFloat(value);
}

/**
 * The BoxView manages the view to define the search area as a box.
 * Embedded in the SpatialExtentView.
 */
var BoxView = Backbone.View.extend({

	// The model is a DatasetSearch

	// Constructor
	initialize: function(options) {
		this.parentView = options.parentView;

		// Listen when useExtent is changed to update the view
		this.model.on("change:useExtent", function() {
			var $cb = this.$el.find('.mapExtentCheckBoxLabel');
			var useExtent = $cb.hasClass('ui-checkbox-on');
			if (useExtent != this.model.get('useExtent')) {
				$cb.trigger('click');
			}
		}, this);
	},

	events: {
		'click #drawbbox': function(event) {
			this.model.set('useExtent', false);
			var self = this;
			var $button = $(event.target);
			$button.attr("disabled", "disabled").button("refresh");
			RectangleHandler.start({
				layer: this.parentView.searchAreaLayer,
				feature: this.model.searchArea.getFeature(),
				stop: function() {
					var bbox = self.model.searchArea.getBBox();

					bbox.south = Math.max(bbox.south, -90);
					bbox.north = Math.min(bbox.north, 90);
					self.model.searchArea.setBBox(bbox);

					self.$el.find("#west").val(bbox.west);
					self.$el.find("#south").val(bbox.south);
					self.$el.find("#east").val(bbox.east);
					self.$el.find("#north").val(bbox.north);

					$button.removeAttr("disabled").button("refresh");
				}
			});
		},

		//blur insure that values has been manually changed by the user
		//change the bbox in the model only and inly if it is valid
		'blur input': function(event) {

			var bbox = {
				west: filterFloat(this.$el.find("#west").val()),
				south: filterFloat(this.$el.find("#south").val()),
				east: filterFloat(this.$el.find("#east").val()),
				north: filterFloat(this.$el.find("#north").val())
			};


			if (isValidLon(bbox.west) && isValidLon(bbox.east) &&
				isValidLat(bbox.south) && isValidLat(bbox.north)) {
				this.model.searchArea.setBBox(bbox);
			} else {
				bbox = this.model.searchArea.getBBox();
				this.$el.find("#west").val(bbox.west);
				this.$el.find("#south").val(bbox.south);
				this.$el.find("#east").val(bbox.east);
				this.$el.find("#north").val(bbox.north);
			}

			this.parentView.updateSearchAreaLayer();

		},

		'click .mapExtentCheckBoxLabel': function(event) {
			var $target = $(event.currentTarget);
			var useExtent = !($(event.currentTarget).hasClass('ui-checkbox-on'));
			this.model.set({
				"useExtent": useExtent
			}, {
				silent: true
			});
			if (useExtent) {
				this.activateUseExtent();
			} else {
				this.deactivateUseExtent();
			}
		},


	},

	// Update from the model
	updateFromModel: function() {
		var bbox = this.model.searchArea.getBBox();
		this.$el.find("#west").val(bbox.west);
		this.$el.find("#south").val(bbox.south);
		this.$el.find("#east").val(bbox.east);
		this.$el.find("#north").val(bbox.north);
		
		// Update useExtent according to model
		// Used when clicked on "Get Criteria" importing the layer from gazetter
		// FIXME: find better solution..
		var mapExtent = Map.getViewportExtent();
		if ( mapExtent[0] != bbox.west || mapExtent[1] != bbox.south || mapExtent[2] != bbox.east || mapExtent[3] != bbox.north ) {
			this.model.set('useExtent', false);
		} else {
			this.model.set('useExtent', true);
		}
	},

	// Change the use extent
	onUseExtentChanged: function() {
		var $cb = this.$el.find('.mapExtentCheckBoxLabel');
		var useExtent = $cb.hasClass('ui-checkbox-on');
		if (useExtent != this.model.get('useExtent')) {
			$cb.trigger('click');
		}
	},

	activateUseExtent: function() {
		Map.on("extent:change", this.synchronizeWithMapExtent, this);
		this.synchronizeWithMapExtent();
		// Remove the search area layer when using extent
		if (this.parentView.searchAreaLayer) {
			Map.removeLayer(this.parentView.searchAreaLayer);
			this.parentView.searchAreaLayer = null;
		}
		this.$el.find("input").addClass("ui-disabled");
	},

	deactivateUseExtent: function() {
		Map.off("extent:change", this.synchronizeWithMapExtent, this);
		if (this.parentView.searchAreaLayer) {
			this.parentView.searchAreaLayer.clear(); // Remove all features before adding new layer
			this.parentView.searchAreaLayer = Map.addLayer(this.parentView.searchAreaLayer.params);
		}
		this.parentView.updateSearchAreaLayer();
		this.$el.find("input").removeClass("ui-disabled");
	},

	// Open the view
	open: function() {
		if (this.model.get("useExtent")) {
			this.activateUseExtent();
		} else {

			var bbox = {
				west: filterFloat(this.$el.find("#west").val()),
				south: filterFloat(this.$el.find("#south").val()),
				east: filterFloat(this.$el.find("#east").val()),
				north: filterFloat(this.$el.find("#north").val())
			};
			this.model.searchArea.setBBox(bbox);
			this.parentView.updateSearchAreaLayer();
		}
		this.$el.show();
	},

	// Close the view
	close: function() {
		// Stop listening to map extent
		if (this.model.get("useExtent")) {
			this.deactivateUseExtent();
		}
		this.$el.hide();
	},

	// Synchronize map extent
	synchronizeWithMapExtent: function() {
		var mapExtent = Map.getViewportExtent();

		var bbox = {
			west: mapExtent[0],
			south: mapExtent[1],
			east: mapExtent[2],
			north: mapExtent[3]
		};
		this.model.searchArea.setBBox(bbox);

		this.$el.find("#west").val(bbox.west);
		this.$el.find("#south").val(bbox.south);
		this.$el.find("#east").val(bbox.east);
		this.$el.find("#north").val(bbox.north);
	}

});

module.exports = BoxView;