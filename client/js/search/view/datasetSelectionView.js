"use strict";

var Logger = require('logger');
var DatasetSearch = require('search/model/datasetSearch');
var DatasetAuthorizations = require('search/model/datasetAuthorizations');
var SearchResults = require('searchResults/model/searchResults');
var datasetsSelection_template = require('search/template/datasetsSelectionContent_template');
var datasetsList_template = require('search/template/datasetsListContent_template');

/**
 * The related model is DatasetsPopulationModel
 */
var DatasetSelectionView = Backbone.View.extend({

	/**
	 * Id for view div container
	 */
	id: 'datasetSelection',

	/**
	 * Events to manage on the view
	 */
	events: {

		'click li': function(event) {
			if (!$(event.target).hasClass('ui-icon')) {
				var datasetId = $(event.currentTarget).data("datasetid");
				this.model.fetchDataset(datasetId, function(model) {
					if (model.get('description')) {
						$('#dsPopupDescription').html('<p>' + model.get('description') + '</p>').popup('open', {
							positionTo: "#" + model.tagFriendlyId + " .ui-li-count"
						});
					}
				});
			}
		},

		'click .ui-icon': function(event) {
			var datasetId = $(event.currentTarget.parentElement).data("datasetid");
			if ($(event.currentTarget).hasClass("ui-icon-checkbox-off")) {
				$(event.currentTarget).removeClass("ui-icon-checkbox-off").addClass("ui-icon-checkbox-on");
				this.model.select(datasetId);
			} else {
				$(event.currentTarget).removeClass("ui-icon-checkbox-on").addClass("ui-icon-checkbox-off");
				this.model.unselect(datasetId);
			}
		},

		"click #dsResetKeywords": function() {
			var self = this;
			var index = 0;
			this.model.get('criterias').forEach(function(criteria) {
				criteria.selectedValue = "";
				self.$el.find("#criteria_" + index).val("").change();
				self.$el.find("#criteria_" + index).closest('.ui-select').removeClass('oneValue');
				index++;
			});
			this.updateDatasetsList();
			this.updateSelectCriteria();
		},

		'keyup [data-type="search"]' : 'filterDatasets',

		'change [data-type="search"]': 'filterDatasets'
	},

	/**
	 *	Filter dataset based on input
	 */
	filterDatasets: function(event) {
		var filter = $(event.target).val();

		// Set all datasets to visible
		var $liArray = this.$el.find('#datasetList li').removeClass('ui-screen-hidden')

		if ( filter != "" ) {
			// Hide all datasets with names which doesn't correspond to filter
			$liArray
				.find('.name')
				.filter(function(index, item) { return $(item).text().indexOf(filter) == -1; }).parent()
				.addClass('ui-screen-hidden');
		}
	},

	/**
	 * Constructor
	 */
	initialize: function() {

		this.filteredDatasets = [];

		this.listenTo(this.model, "select", this.onSelect);
		this.listenTo(this.model, "unselect", this.onUnselect);

		// Update the checkbox if no fetch possible
		this.listenTo(this.model, "datasetFetch", function(datasetId, status) {
			if (status == "ERROR") {
				Logger.error("Dataset " + datasetId + " is not available on the server.");
			}
		});
	},

	/**
	 * Call when a dataset is selected
	 */
	onSelect: function(dataset) {
		var $elt = this.$el.find('#' + dataset.tagFriendlyId + ' .ui-icon');
		$elt.removeClass("ui-icon-checkbox-off");
		$elt.addClass("ui-icon-checkbox-on");
	},

	/**
	 * Call when a dataset is unselected
	 */
	onUnselect: function(dataset) {
		var $elt = this.$el.find('#' + dataset.tagFriendlyId + ' .ui-icon');
		$elt.removeClass("ui-icon-checkbox-on");
		$elt.addClass("ui-icon-checkbox-off");
	},

	/**
	 * The template used to build the dataset list
	 */
	datasetsListTemplate: datasetsList_template,

	/**
	 * Call when the view is shown
	 */
	onShow: function() {
		this.updateContentHeight();
	},

	/**
	 * Call to set the height of content when the view size is changed
	 */
	updateContentHeight: function() {
		var newHeight = this.$el.height() - this.$el.find('#ds-footer').outerHeight() - this.$el.find('#ds-keywords').outerHeight() - 10;
		this.$el.find('#ds-content').css('height', newHeight);
	},

	/**
	 * Render the view
	 */
	render: function() {

		//if datasets array has no items that means that the server has sent a response
		//since the fetch was a success (it is called from the dataseSelection widget).
		//However, there was problem since the datsets were not created. 
		if (!this.model.isValid()) {
			this.$el.append("<p>Error: There was a problem when creating the datasets.<p>");
			return this;
		}

		// Build the main content
		var mainContent = datasetsSelection_template(this.model);
		this.$el.append(mainContent);

		// Build the criteria select element and datasets list
		this.updateDatasetsList();
		this.updateSelectCriteria();

		this.$el.trigger('create');

		var self = this;

		//iterate on criteria to add a callback when the user selects a new criteria filter
		_.each(self.model.get('criterias'), function(criteria, index) {

			//bind a change event handler to the select id
			//Fixes the binding after the display of the widget in case of success
			self.$el.find("#criteria_" + index).change(function(event) {
				
				var value = $(this).val() ? $(this).val() : "";
				criteria.selectedValue = value;
				if (value !== '') {
					$(event.currentTarget).closest('.ui-select').addClass('oneValue');
				} else {
					$(event.currentTarget).closest('.ui-select').removeClass('oneValue');
				}

				// Update datasets list and criteria according to the new criteria filter
				self.updateDatasetsList();
				self.updateSelectCriteria(index);
			});
		});

		return this;
	},

	/**
	 * Update the select elements for criterias with the given datasets
	 * The <option>'s should be updated according to filtered datasets
	 */
	updateSelectCriteria: function(idx) {

		// Rebuilt the criterias to select
		var criterias = this.model.get('criterias');

		for (var i = 0; i < criterias.length; i++) {

			var criteriasForAllGroupsExceptThisOne = JSON.parse(JSON.stringify(criterias));
			if (typeof idx !== 'undefined') {
				criteriasForAllGroupsExceptThisOne[i].selectedValue = '';
			}
			var datasetsFilteredForAllGroupsExceptThisOne = this.model.filterDatasets(criteriasForAllGroupsExceptThisOne);

			var criteria = criterias[i];
			var $selectCriteria = this.$el.find("#criteria_" + i);

			$selectCriteria.empty();
			$selectCriteria.append('<option value="">Any ' + criterias[i].title + '</option>');

			var criteriaValues = this.model.filterCriteriaValues( datasetsFilteredForAllGroupsExceptThisOne, criteriasForAllGroupsExceptThisOne[i] );

			for (var j = 0; j < criteriaValues.length; j++) {

				// Add the option to the select element
				var $opt = $('<option value="' + criteriaValues[j] + '">' + criteriaValues[j] + '</option>')
					.appendTo($selectCriteria);

				// Add selected attr to option if is actually selected
				if (criteria.selectedValue == criteriaValues[j]) {
					$opt.attr('selected', 'selected');
				}
			}
		}

	},

	/** 
	 * Update only the list of datasets in the view 
	 */
	updateDatasetsList: function() {

		// Retrieve the datasets according to the current criteria
		var datasets = this.model.filterDatasets(this.model.get('criterias'));

		// NGEO-2129: Sort by name
		datasets = _.sortBy(datasets, function(dataset) { return dataset.name.toLowerCase() });

		// Build the dataset list
		var $dslListContainer = this.$el.find("#datasetListContainer")
		var listContent = this.datasetsListTemplate({
			datasets: datasets
		});
		$dslListContainer.html(listContent);
		$dslListContainer.trigger('create');

		// Apply authorization
		// Warning : need to be done after jQuery Mobile has "enhanced" the markup otherwise images are not correctly placed
		for (var i = 0; i < datasets.length; i++) {
			if (!DatasetAuthorizations.hasDownloadAccess(datasets[i].tagFriendlyId)) {
				$('#' + datasets[i].tagFriendlyId).append('<img src="../images/nodownload.png" />');
			}
			if (!DatasetAuthorizations.hasViewAccess(datasets[i].tagFriendlyId)) {
				$('#' + datasets[i].tagFriendlyId).append('<img src="../images/noview.png" />');
			}
			if (!DatasetAuthorizations.hasSearchAccess(datasets[i].tagFriendlyId)) {
				$('#' + datasets[i].tagFriendlyId).addClass('ui-disabled');
			}
		}

		// Synchronize the selection with dataset list
		_.each(this.model.selection, function(dataset) {
			var $elt = $dslListContainer.find('#' + dataset.tagFriendlyId);
			if ($elt.length == 0) {
				this.model.unselect(dataset.tagFriendlyId);
				this.trigger("sizeChanged");
			} else {
				$elt.find('.ui-icon').addClass('ui-icon-checkbox-on');
				$elt.find('.ui-icon').removeClass('ui-icon-checkbox-off');
			}
		}, this);

		this.filteredDatasets = datasets;
	}

});

module.exports = DatasetSelectionView;