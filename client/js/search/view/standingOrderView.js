var Configuration = require('configuration');
var DataAccessWidget = require('dataAccess/widget/dataAccessWidget');
var SchedulingOptionsView = require('search/view/schedulingOptionsView');
var SearchView = require('search/view/searchView');
var StandingOrderDataAccessRequest = require('dataAccess/model/standingOrderDataAccessRequest');
var DatasetView = require('search/view/datasetView');
var SharePopup = require('ui/sharePopup');
var DataSetPopulation = require('search/model/dataSetPopulation');
var searchCriteria_template = require('search/template/searchCriteriaContent_template');
var DatasetSearch = require('search/model/datasetSearch');

/**
 * The model for this view is a backbone model : StandingOrder 
 */
var StandingOrderView = SearchView.extend({

	/**
	 * Id for view div container
	 */
	id: "standingOrderView",

	initialize: function() {
		this.listenTo(DataSetPopulation, 'select', this.onDatasetChanged );
		this.listenTo(DataSetPopulation, 'unselect', this.onDatasetChanged );
	},

	onDatasetChanged: function(dataset) {
		if ( this.model.dataset ) {
			this.datasetView = new DatasetView({
				model: this.model,
				dataset: this.model.dataset
			});
			this.datasetView.render();
			this.$el.find(".datasetSearch").append( this.datasetView.el );
			this.$el.trigger("create");
		} else if ( this.datasetView ) {
			var datasetId = dataset.get("datasetId");
			this.datasetView.remove();
			this.datasetView = null;
		}
	},

	events: {
		// Click on search
		"click .scSubmit": function(event) {

			// Reset request
			StandingOrderDataAccessRequest.initialize();

			// Set open search url
			StandingOrderDataAccessRequest.OpenSearchURL = this.model.getOpenSearchURL();

			// Set selected download options
			StandingOrderDataAccessRequest.DownloadOptions = this.model.getSelectedDownloadOptions();

			DataAccessWidget.open(StandingOrderDataAccessRequest);

		},

		// Click on import : import settings from search criteria
		"click .scImport": function() {
			console.log(DatasetSearch);
			console.log(this.model);
			// Import attributes from DatasetSearch
			this.model.set({
				"start": DatasetSearch.get("start"),
				"stop": DatasetSearch.get("stop"),
				"useExtent": DatasetSearch.get("useExtent"),
				"advancedAttributes":  DatasetSearch.get("advancedAttributes"),
			});
			// NB: Can't use the line below since it doesn't fires "change" events for nested models
			// this.model.set(DatasetSearch.attributes);
			// .. so do the manual merge of download options (which is the only nested model)
			var searchDO = DatasetSearch.get("downloadOptions")[this.model.dataset.get("datasetId")];
			this.model.get("downloadOptions")[this.model.dataset.get("datasetId")].updateFrom(searchDO);

			// and search area which isn't included in attributes of model
			this.model.searchArea.setFromWKT( DatasetSearch.searchArea.toWKT() );
			this.model.searchArea.setMode( DatasetSearch.searchArea.getMode() ); // Set mode as well since WKT is always a polygon
			// Update search area only if model doesn't use extent (since layer is removed when extent is used...)
			if ( !this.model.get("useExtent") ) {
				this.model.trigger('change:searchArea');
			}

			this.refresh();
		},

		// To share a search
		"click #share": function() {

			SharePopup.open({
				openSearchUrl: this.model.getOpenSearchURL({
					format: "atom"
				}),
				url: Configuration.serverHostName + (window.location.pathname) + StandingOrderDataAccessRequest.getSharedURL(this.model),
				positionTo: this.$el.find('#share')[0]
			});
		}
	},

	onShow: function() {
		$('#dateRangeSlider').hide(); // Assuming that there is only one slider on page
		//this.dateCriteriaView.removeTimeSlider();
		SearchView.prototype.onShow.apply(this);
	},

	/**
	 * Refresh the view : only for views that does not listen to model changes (for performance reasons)
	 */
	refresh: function() {
		this.schedulingOptionsView.render();
		if ( this.datasetView )
			this.datasetView.refresh();
	},

	/**
	 * Render the view
	 */
	render: function() {

		StandingOrderDataAccessRequest.initialize();

		var content = searchCriteria_template({
			submitText: "Subscribe"
		});
		this.$el.append(content);

		SearchView.prototype.render.apply(this);

		this.$el.find('#sc-content').prepend('<div id="sc-schedlingOptions-container" data-role="collapsible" data-inset="false" data-mini="true" data-collapsed="false">\
												<h3>Scheduling Options</h3>\
												<div id="schedulingOptions"></div>\
											</div>');

		this.schedulingOptionsView = new SchedulingOptionsView({
			el: this.$el.find('#schedulingOptions'),
			request: StandingOrderDataAccessRequest,
			model: this.model
		});
		this.schedulingOptionsView.render();

		this.$el.trigger('create');
		this.$el.find('#sc-schedlingOptions-container h3 .ui-btn-inner').attr("data-help", Configuration.localConfig.contextHelp.schedulingOptions);
		return this;
	}

});

module.exports = StandingOrderView;