var Configuration = require('configuration');
var SpatialExtentView = require('search/view/spatialExtentView');
var TimeExtentView = require('search/view/timeExtentView');
var DataSetPopulation = require('search/model/dataSetPopulation');

/**
 * Basic search view designed to contain the common parts between StandingOrder or SearchCriteriaView
 * So the backbone model for this view can be : DatasetSearch or StandingOrder respectively
 */
var SearchView = Backbone.View.extend({

	initialize: function() {
		this.dateCriteriaView = null;
		this.areaCriteriaView = null;
	},

	/**
	 * Call to set the height of content when the view size is changed
	 */
	updateContentHeight: function() {
		this.$el.find('#sc-content').css('height', this.$el.height() - this.$el.find('#sc-footer').outerHeight());
	},

	/**
	 * Call when the view is shown
	 */
	onShow: function() {
		this.updateContentHeight();
		if ( this.areaCriteriaView.searchAreaLayer ) {
			this.areaCriteriaView.searchAreaLayer.setVisible(true);
		}
	},

	/**
	 *	Call when the view is hidden
	 */
	onHide: function() {
		if ( this.areaCriteriaView.searchAreaLayer ) {
			this.areaCriteriaView.searchAreaLayer.setVisible(false);
		}
	},

	/**
	 * Render the view
	 */
	render: function() {

		// Create the views for each criteria : time, spatial and opensearch url view
		this.dateCriteriaView = new TimeExtentView({
			el: this.$el.find("#date"),
			hasTimeSlider: this.model.name == "Search" ? true : false, // Standing order date doesn't have timeslider !
			model: this.model
		});
		this.dateCriteriaView.render();

		this.areaCriteriaView = new SpatialExtentView({
			el: this.$el.find("#area"),
			searchCriteriaView: this,
			model: this.model
		});
		this.areaCriteriaView.render();

		this.$el.trigger('create');

		// Init help attributes on created jqm composants
		this.$el.find("#sc-date-container h3 .ui-btn-inner").attr("data-help", Configuration.localConfig.contextHelp.date).end()
			.find("#sc-area-container h3 .ui-btn-inner").attr("data-help", Configuration.localConfig.contextHelp.area).end()

		return this;
	}

});

module.exports = SearchView;