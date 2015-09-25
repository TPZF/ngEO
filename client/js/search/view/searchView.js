var Configuration = require('configuration');
var SpatialExtentView = require('search/view/spatialExtentView');
var TimeExtentView = require('search/view/timeExtentView');
var AdvancedSearchView = require('search/view/advancedSearchView');
var DownloadOptionsView = require('search/view/downloadOptionsView');
var OpenSearchURLView = require('search/view/openSearchURLView');
var DataSetPopulation = require('search/model/dataSetPopulation');


/**
 * Basic search view designed to contain the common parts between StandingOrder or SearchCriteriaView
 * So the backbone for this view can be : DatasetSearch or StandingOrder respectively
 */
var SearchView = Backbone.View.extend({

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
	},

	/**
	 * Refresh the view : only for views that does not listen to model changes (for performance reasons)
	 */
	refresh: function() {
		this.advancedCriteriaView.render();
		this.downloadOptionsView.render();
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

		this.advancedCriteriaView = new AdvancedSearchView({
			el: this.$el.find("#searchCriteria"),
			model: this.model
		});
		this.advancedCriteriaView.render();

		//add download options view as a tab
		this.downloadOptionsView = new DownloadOptionsView({
			el: this.$el.find("#downloadOptions"),
			model: this.model
		});
		this.downloadOptionsView.render();

		// OpenSearch URL view
		this.openSearchURLView = new OpenSearchURLView({
			el: this.$el.find("#osUrl"),
			model: this.model
		});
		this.openSearchURLView.render();

		this.$el.trigger('create');

		// Init help attributes on created jqm composants
		this.$el.find("#sc-date-container h3 .ui-btn-inner").attr("data-help", Configuration.localConfig.contextHelp.date).end()
			.find("#sc-area-container h3 .ui-btn-inner").attr("data-help", Configuration.localConfig.contextHelp.area).end()
			.find("#sc-advanced-container h3 .ui-btn-inner").attr("data-help", Configuration.localConfig.contextHelp.advancedOptions).end()
			.find("#sc-do-container h3 .ui-btn-inner").attr("data-help", Configuration.localConfig.contextHelp.downloadOptions).end()
			.find("#osUrl h3 .ui-btn-inner").attr("data-help", Configuration.localConfig.contextHelp.openSearch);

		return this;
	}

});

module.exports = SearchView;