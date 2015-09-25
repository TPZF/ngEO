var Map = require('map/map');
var BoxView = require('search/view/boxView');
var PolygonView = require('search/view/polygonView');
var GazetteerView = require('search/view/gazetteerView');
var ImportView = require('search/view/importView');
var areaCriteria_template = require('search/template/areaCriteriaContent');

/**
 * The SpatialExtentView manages the different views to define the search area (or zone of interest).
 */
var SpatialExtentView = Backbone.View.extend({

	// Constructor
	initialize: function(options) {

		this.searchAreaLayer = null;
		this.mode = "bbox";

		// Listen when the searchArea has changed to update the view
		this.model.on("change:searchArea", this.onModelChanged, this);
	},

	// Events
	events: {
		'change #toolsChoice': function(event) {
			var val = $(event.currentTarget).find('input:radio:checked').val();

			this.tools[this.mode].close();
			this.tools[val].open();

			this.mode = val;
		}
	},

	/**
	 * Update the search area layer
	 */
	updateSearchAreaLayer: function() {
		// Create the layer if not already done
		if (!this.searchAreaLayer) {
			// Create a layer for the search area
			var searchAreaParams = {
				name: this.model.name + " Area",
				type: "Feature",
				visible: true,
				style: "search-area",
				greatCircle: false
			};
			this.searchAreaLayer = Map.addLayer(searchAreaParams);
			this.searchAreaLayer.addFeature(this.model.searchArea.getFeature());
		} else {
			this.searchAreaLayer.updateFeature(this.model.searchArea.getFeature());
		}

		// TODO maybe a 'smart' zoomTo is needed?
		//Map.zoomTo( this.model.searchArea.getFeature().bbox );
	},

	// Called when model has changed from outside the view, i.e. when a search URL is given by the user
	onModelChanged: function() {
		if (this.model.searchArea.getMode() == 0) {
			this.tools['bbox'].updateFromModel();
			this.$el.find('#radio-bbox-label').trigger('click');
		} else if (this.model.searchArea.getMode() == 1) {
			this.tools['polygon'].updateFromModel();
			this.$el.find('#radio-polygon-label').trigger('click');
		}
	},

	// Build the view
	render: function() {

		this.$el.append(areaCriteria_template(this.model));

		// Create the view for the different tools
		this.tools = {
			'bbox': new BoxView({
				model: this.model,
				parentView: this,
				el: this.$el.find('#bbox').get(0)
			}),
			'polygon': new PolygonView({
				model: this.model,
				parentView: this,
				el: this.$el.find('#polygon').get(0)
			}),
			'gazetteer': new GazetteerView({
				model: this.model,
				parentView: this,
				el: this.$el.find('#gazetteer').get(0)
			}),
			'import': new ImportView({
				model: this.model,
				parentView: this,
				el: this.$el.find('#import').get(0)
			})
		};

		// Close all the tools except the current one
		for (var t in this.tools) {
			if (this.tools.hasOwnProperty(t)) {
				if (t != this.mode) {
					this.tools[t].close();
				}
			}
		}

		// Open the current tools
		this.tools[this.mode].open();

		return this;
	},

});

module.exports = SpatialExtentView;