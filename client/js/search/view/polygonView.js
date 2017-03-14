var Map = require('map/map');
var PolygonHandler = require('map/polygonHandler');
var degreeConvertor = require('map/degreeConvertor');

/**
 * The PolygonView manages the view to define the search area as a polygon.
 * Embedded in the SpatialExtentView.
 */
var PolygonView = Backbone.View.extend({

	// The model is a DatasetSearch

	// Constructor
	initialize: function(options) {
		this.searchArea = options.searchArea;
		this.parentView = options.parentView;
	},

	events: {

		'click #drawpolygon': function(event) {
			this.$el.find('#polygonTextError').hide();
			var self = this;
			$button = $(event.target);
			$button.attr("disabled", "disabled").button("refresh");
			PolygonHandler.start({
				layer: this.parentView.searchAreaLayer,
				feature: this.model.searchArea.getFeature(),
				stop: function() {
					$button.removeAttr("disabled").button("refresh");
					self.$el.find('#polygontext').val(self.model.searchArea.getPolygonText()).keyup();
					self.model.searchArea.setMode(1);
				}
			});
		},

		'focus #polygontext': function(event) {
			this.$el.find('#polygonTextError').hide();
		},

		'change #polygontext': function(event) {
			var text = $(event.currentTarget).val();
			if (/[a-zA-Z]+/.exec(text) || !this.model.searchArea.setPolygonFromText(text)) {
				// Restore input
				this.updateFromModel();
				// Erase content
				//$(event.currentTarget).val('');
				this.$el.find('#polygonTextError')
					.html("Please enter valid coordinates : D°M'S\"")
					.show();
			} else {
				// Format the entered values to DMS (in case when decimal values were entred)
				// NB: can't use update from model due to precision issue...
				var positions = text.trim().split('\n');
				res = "";
				for ( var i=0; i<positions.length; i++ ) {
					var position = positions[i].split(" ");
					res += this.getDMS(position[0] + " ");
					res += this.getDMS(position[1]) + "\n";
				}
				this.$el.find('#polygontext').val(res);
			}
			this.parentView.updateSearchAreaLayer();

		},

	},

	// Get DMS-formatted value
	getDMS(value) {
		if ( value.indexOf("°") >= 0 || value.indexOf("'") >= 0 || value.indexOf("\"") >= 0) {
			return value;
		} else {
			return degreeConvertor.toDMS(value);
		}
	},

	// Update from the model
	updateFromModel: function() {
		this.$el.find('#polygontext').val(this.model.searchArea.getPolygonText()).keyup();
	},

	// Open the view : show it and update the model
	open: function() {
		var text = this.$el.find('#polygontext').val();
		this.$el.find('#polygonTextError').hide();
		this.model.searchArea.setPolygonFromText(text);
		this.parentView.updateSearchAreaLayer();
		this.$el.show();
	},

	// Close the view : hide it
	close: function() {
		this.$el.hide();
	},

});

module.exports = PolygonView;