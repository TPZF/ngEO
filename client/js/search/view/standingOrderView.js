var Configuration = require('configuration');
var Logger = require('logger');
var DataAccessWidget = require('dataAccess/widget/dataAccessWidget');
var SchedulingOptionsView = require('search/view/schedulingOptionsView');
var SearchView = require('search/view/searchView');
var StandingOrderDataAccessRequest = require('dataAccess/model/standingOrderDataAccessRequest');
var SharePopup = require('ui/sharePopup');
var searchCriteria_template = require('search/template/searchCriteriaContent_template');

/**
 * The model for this view is a backbone model : StandingOrder 
 */
var StandingOrderView = SearchView.extend({

	/**
	 * Id for view div container
	 */
	id: "standingOrderView",

	events: {
		// Click on search
		"click .scSubmit": function(event) {

			// reset request
			StandingOrderDataAccessRequest.initialize();

			//set open search url
			StandingOrderDataAccessRequest.OpenSearchURL = this.model.getOpenSearchURL();

			//set selected download options
			StandingOrderDataAccessRequest.DownloadOptions = this.model.getSelectedDownloadOptions();

			DataAccessWidget.open(StandingOrderDataAccessRequest);

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
		SearchView.prototype.refresh.apply(this);
	},

	/**
	 * Render the view
	 */
	render: function() {

		StandingOrderDataAccessRequest.initialize();

		var content = searchCriteria_template({
			submitText: "Order"
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