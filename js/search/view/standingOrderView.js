

define( ['jquery', 'backbone', 'configuration', 'logger', 'search/view/spatialExtentView', 'dataAccess/widget/dataAccessWidget', 'search/view/timeExtentView',
         'search/view/advancedSearchView', 'search/view/downloadOptionsView', 'search/view/schedulingOptionsView', 'search/view/openSearchURLView',
         'dataAccess/model/standingOrderDataAccessRequest',  'dataAccess/model/downloadManagers', 'dataAccess/view/downloadManagersListView', 'ui/sharePopup',
         'text!search/template/searchCriteriaContent_template.html'], 
		function($, Backbone, Configuration, Logger, SpatialExtentView, DataAccessWidget, TimeExtentView,
				 AdvancedSearchView, DownloadOptionsView, SchedulingOptionsView, OpenSearchURLView, StandingOrderDataAccessRequest, DownloadManagers, DownloadManagersListView, SharePopup,
				 searchCriteria_template) {

/**
 * The model for this view is a backbone model : StandingOrder 
 */
var StandingOrderView = Backbone.View.extend({

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
				url: Configuration.serverHostName + (window.location.pathname) + StandingOrderDataAccessRequest.getSharedURL(this.model),
				positionTo: this.$el.find('#share')[0]
			});
		}
	},
		
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
		this.$el.find('#sc-content').css('height', this.$el.height() - this.$el.find('#sc-footer').outerHeight() );
	},
	
	/**
	 * Refresh the view : only for views that does not listen to model changes (for performance reasons)
	 */
	refresh: function() {
		this.schedulingOptionsView.render();
		this.advancedCriteriaView.render();
		this.downloadOptionsView.render();
	},
		
	/**
	 * Render the view
	 */
	render: function(){
		
		StandingOrderDataAccessRequest.initialize();

		var content = _.template(searchCriteria_template, { submitText: "Order"});
		this.$el.append(content);
		
		// Create the views for each criteria : time, spatial, advanced and for download options
		this.dateCriteriaView = new TimeExtentView ({
			el : this.$el.find("#date"), 
			searchCriteriaView : this,
			model : this.model
			});
		this.dateCriteriaView.render();
				
		this.areaCriteriaView = new SpatialExtentView({
			el : this.$el.find("#area"), 
			searchCriteriaView : this,
			model : this.model
		});
		this.areaCriteriaView.render();
		
		this.advancedCriteriaView = new AdvancedSearchView({
			el : this.$el.find("#searchCriteria"), 
			model : this.model
		});
		this.advancedCriteriaView.render();		
		
		//add download options view as a tab
		this.downloadOptionsView = new DownloadOptionsView({
			el : this.$el.find("#downloadOptions"), 
			model : this.model
		});
		this.downloadOptionsView.render();

		// Append scheduling content
		this.$el.find('#sc-content').prepend('<div data-role="collapsible" data-inset="false" data-mini="true" data-collapsed="false">\
												<h3>Scheduling Options</h3>\
												<div id="schedulingOptions"></div>\
											</div>');

		this.schedulingOptionsView = new SchedulingOptionsView({
			el : this.$el.find('#schedulingOptions'),
			request : StandingOrderDataAccessRequest,
			model : this.model
		});
		this.schedulingOptionsView.render();
		
		// OpenSearch URL view
		this.openSearchURLView = new OpenSearchURLView({
			el: this.$el.find("#osUrl"), 
			model : this.model });
		this.openSearchURLView.render();

		this.$el.trigger('create');
		
									
		return this;
	}
	
});

return StandingOrderView;

});