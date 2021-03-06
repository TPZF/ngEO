var Logger = require('logger');
var DatasetSearch = require('search/model/datasetSearch');
var searchResultsViewContent_template = require('searchResults/template/searchResultsViewContent');

/**
 * The view for search results
 * The model of this view is FeatureCollection
 */
var SearchResultsView = Backbone.View.extend({

	id: 'resultsBar',

	/**
	 * Constructor
	 */
	initialize: function() {

		this.listenTo(this.model, 'startLoading', this.onStartLoading);
		this.listenTo(this.model, 'reset:features', this.onResetFeatures);
		this.listenTo(this.model, 'add:features', this.onAddFeatures);
		this.listenTo(this.model, 'error:features', function(searchUrl) {
			Logger.error('An error occured when retrieving the products with the search url :<br>' + searchUrl);
			this.$el.find('#resultsMessage').removeClass("pulsating").html("No product found");
		});
	},

	/**
	 * Manage events on the view
	 */
	events: {
		// Manage paging through buttons
		'click #paging_first': function() {
			this.model.changePage(1);
		},
		'click #paging_last': function() {
			this.model.changePage(this.model.lastPage);
		},
		'click #paging_next': function() {
			this.model.changePage(this.model.currentPage + 1);
		},
		'click #paging_prev': function() {
			this.model.changePage(this.model.currentPage - 1);
		}
	},

	/**
	 * Called when the model start loading
	 */
	onStartLoading: function() {

		this.$el.find('#paging a').addClass('ui-disabled');

		var $resultsMessage = this.$el.find('#resultsMessage');
		$resultsMessage.html("Searching...");
		$resultsMessage.addClass("pulsating")
		$resultsMessage.show();
	},

	/**
	 * Called when features are added
	 */
	onAddFeatures: function(features) {

		var $resultsMessage = this.$el.find('#resultsMessage');
		$resultsMessage.removeClass("pulsating");

		if (this.model.totalResults > 0) {
			var startIndex = 1 + (this.model.currentPage - 1) * this.model.countPerPage;
			$resultsMessage.html('Showing ' + startIndex + ' to ' + (startIndex + features.length - 1) + " of " + this.model.totalResults + " products.");

			// Updage paging button according to the current page
			this.$el.find('#paging a').removeClass('ui-disabled');
			if (this.model.currentPage == 1) {
				this.$el.find('#paging_prev').addClass('ui-disabled');
				this.$el.find('#paging_first').addClass('ui-disabled');
			}
			if (this.model.currentPage == this.model.lastPage) {
				this.$el.find('#paging_next').addClass('ui-disabled');
				this.$el.find('#paging_last').addClass('ui-disabled');
			}
		} else if (this.model.totalResults == 0) {
			this.$el.find('#paging a').addClass('ui-disabled');
			$resultsMessage.html('No product found.');
		} else {
			$resultsMessage.html('No search done.');
		}
	},

	/**
	 * Called when the model is reset
	 */
	onResetFeatures: function() {

		this.$el.find('#paging a').addClass('ui-disabled');
		var $resultsMessage = this.$el.find('#resultsMessage');
		$resultsMessage.hide();
	},

	/**
	 * Render the view
	 */
	render: function() {

		this.$el
			//.addClass('ui-grid-c')
			.html(searchResultsViewContent_template());
		this.$el.trigger('create');

		// Set the dataset
		if (DatasetSearch.get('mode') == "Simple") {
			this.$el.find('#datasetMessage').html('Dataset : ' + this.model.id).attr("title", this.model.id);
		} else {
			var datasetName = DatasetSearch.get('master') + ' with ' + DatasetSearch.slaves.join(',');
			this.$el.find('#datasetMessage').html('Dataset : ' + datasetName).attr("title", datasetName);

			// Update message when master has changed
			DatasetSearch.on('change:master', function() {
				var datasetName = DatasetSearch.get('master') + ' with ' + DatasetSearch.slaves.join(',');
				this.$el.find('#datasetMessage').html('Dataset : ' + datasetName).attr("title", datasetName);
			}, this);
		}

		// To start paging is disable
		this.$el.find('#paging a').addClass('ui-disabled');
	}
});

module.exports = SearchResultsView;