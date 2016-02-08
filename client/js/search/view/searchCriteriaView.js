var Configuration = require('configuration');
var Logger = require('logger');
var SearchView = require('search/view/searchView');
var SearchResults = require('searchResults/model/searchResults');
var CorrInterView = require('search/view/corrInterView');
var DatasetView = require('search/view/datasetView');
var SharePopup = require('ui/sharePopup');
var DataSetPopulation = require('search/model/dataSetPopulation');
var searchCriteria_template = require('search/template/searchCriteriaContent_template');


/**
 * The model for this view is a backbone model : DatasetSearch 
 */
var SearchCriteriaView = SearchView.extend({

	/**
	 * Id for view div container
	 */
	id: "datasetSearchCriteria",

	initialize: function() {
		SearchView.prototype.initialize.apply(this);
		this.listenTo(DataSetPopulation, 'select', this.onDatasetSelected );
		this.listenTo(DataSetPopulation, 'unselect', this.onDatasetUnselected );

		// Table containing the views which are dynamically added depending on selected datasets
		this.datasetDependingViews = {};
	},

	refresh: function() {
		for ( var x in this.datasetDependingViews ) {
			this.datasetDependingViews[x].refresh();
		}
	},

	onDatasetSelected: function(dataset) {
		var datasetView = new DatasetView({
			model: this.model,
			dataset: dataset
		});
		this.$el.find(".datasetSearch").append( datasetView.el );
		datasetView.render();
		this.$el.trigger("create");
		// Store the view to be able to remove later
		this.datasetDependingViews[dataset.get("datasetId")] = datasetView;
	},

	onDatasetUnselected: function(dataset) {
		var datasetId = dataset.get("datasetId");
		this.datasetDependingViews[datasetId].remove();
		delete this.datasetDependingViews[datasetId];
	},

	events: {
		// Click on search
		"click .scSubmit": function(event) {
			var rangeIsValid = this.model.get("start") <= this.model.get("stop");
			if (rangeIsValid) {
				SearchResults.launch(this.model);
			} else {
				// Prevent user that the range isn't valid
				$("#dateWarningPopup")
					.popup("open");
			}
		},

		// To share a search
		"click #share": function() {
			SharePopup.open({
				openSearchUrl: this.model.getOpenSearchURL({
					format: "atom"
				}),
				url: Configuration.serverHostName + (window.location.pathname) + this.model.getSharedSearchURL(),
				positionTo: this.$el.find('#share')[0]
			});
		},

		// To change the mode between simple, correlation and interferometry
		"change #sc-mode": function() {
			var value = this.$el.find('#sc-mode').val();

			// Remove previous accordion and view if any
			this.$el.find('#sc-corrinf-container').remove();
			if (this.corrInterView) {
				this.corrInterView.remove();
				this.corrInterView = null;
			}

			//this.model.set("mode",value);
			this.model.setMode(value);

			// Add the accordion for correlation/inteferometry
			if (value != "Simple") {
				this.$el.find('#sc-area-container').after(
					'<div id="sc-corrinf-container" data-role="collapsible" data-inset="false" data-mini="true">\
						<h3>' + value + '</h3>\
						<div id="sc-corrinf">	</div>\
					</div>'
				);

				this.corrInterView = new CorrInterView({
					el: this.$el.find("#sc-corrinf"),
					model: this.model
				});
				this.corrInterView.render();

			}
			this.$el.find('#sc-content').trigger('create');
			this.$el.find('#sc-corrinf-container h3 .ui-btn-inner').attr('data-help', Configuration.localConfig.contextHelp.interferometry);

		},
	},

	/**
	 * Update the Select to choose the search mode (Simple, Correlation or Interferometry)
	 */
	updateSelectMode: function() {

		this.$el.find('#sc-corrinf-container').remove();
		this.$el.find('#sc-mode-containter').remove();

		// Only interferometry supported for Task4
		//if ( this.model.datasetIds.length > 1 && this.model.datasetIds.length <= 4 ) {
		if (this.model.isInterferometrySupported()) {

			var $mode = $('<div id="sc-mode-containter" data-role="fieldcontain">\
				<label for="sc-mode">Mode: </label>\
				<select id="sc-mode" data-mini="true">\
					<option value="Simple">Simple</option>\
					<option value="Interferometry">Interferometry</option>\
				</select>\
			</div>');

			/*// Check correlation and interferometry
			if ( this.model.datasetIds.length == 2 ) {
				$mode.find('#sc-mode').append('<option value="Interferometry">Interferometry</option>');
			}*/

			this.$el.find('#sc-content')
				.prepend($mode)
				.trigger('create');
		}

	},

	/**
	 * Call when the view is shown
	 */
	onShow: function() {
		this.updateSelectMode();
		if (this.model.get("useTimeSlider")) {
			$('#dateRangeSlider').show(); // Assuming that there is only one slider on page
			//this.dateCriteriaView.addTimeSlider();
		}
		SearchView.prototype.onShow.apply(this);
	},

	/**
	 * Render the view
	 */
	render: function() {

		var content = searchCriteria_template({
			submitText: "Search",
			useDate: true
		});
		this.$el.append(content);

		SearchView.prototype.render.apply(this);

		// Update the date view when the dateRange is changed
		this.dateCriteriaView.listenTo(this.model, "change:dateRange", this.dateCriteriaView.updateDateRange);

		return this;
	}

});

module.exports = SearchCriteriaView;