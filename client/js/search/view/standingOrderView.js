define( ['jquery', 'backbone', 'configuration', 'logger', 'dataAccess/widget/dataAccessWidget',
         'search/view/schedulingOptionsView', 'search/view/searchView',
         'dataAccess/model/standingOrderDataAccessRequest', 'ui/sharePopup',
         'text!search/template/searchCriteriaContent_template.html'], 
		function($, Backbone, Configuration, Logger, DataAccessWidget,
				 SchedulingOptionsView, SearchView, StandingOrderDataAccessRequest, SharePopup,
				 searchCriteria_template) {

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

			DataAccessWidget.open( StandingOrderDataAccessRequest );

		},
					
		// To share a search
		"click #share" : function() {

			SharePopup.open({
				openSearchUrl: this.model.getOpenSearchURL({ format: "atom" }),
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
	render: function(){
		
		StandingOrderDataAccessRequest.initialize();

		var content = _.template(searchCriteria_template, {
			submitText: "Order"
		});
		this.$el.append(content);
		
		SearchView.prototype.render.apply(this);

		this.$el.find('#sc-content').prepend('<div id="sc-schedlingOptions-container" data-role="collapsible" data-inset="false" data-mini="true" data-collapsed="false">\
												<h3>Scheduling Options</h3>\
												<div id="schedulingOptions"></div>\
											</div>');

		this.schedulingOptionsView = new SchedulingOptionsView({
			el : this.$el.find('#schedulingOptions'),
			request : StandingOrderDataAccessRequest,
			model : this.model
		});
		this.schedulingOptionsView.render();

		this.$el.trigger('create');
		this.$el.find('#sc-schedlingOptions-container h3 .ui-btn-inner').attr("data-help", Configuration.localConfig.contextHelp.schedulingOptions);
		return this;
	}
	
});

return StandingOrderView;

});