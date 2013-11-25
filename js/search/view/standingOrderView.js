

define( ['jquery', 'backbone', 'configuration', 'logger', 'search/view/spatialExtentView',
         'search/view/advancedSearchView', 'search/view/downloadOptionsView', 'search/view/schedulingOptionsView',
         'dataAccess/model/standingOrderDataAccessRequest',  'dataAccess/model/downloadManagers', 'dataAccess/view/downloadManagersListView', 'ui/sharePopup',
         'text!search/template/searchCriteriaContent_template.html'], 
		function($, Backbone, Configuration, Logger, SpatialExtentView, 
				 AdvancedSearchView, DownloadOptionsView, SchedulingOptionsView, StandingOrderDataAccessRequest, DownloadManagers, DownloadManagersListView, SharePopup,
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
		// Update the search criteria from the OpenSearch URL
		"blur #osUrlText": function(event) {
			var newUrl = $(event.currentTarget).val();
			var prevUrl = Configuration.serverHostName + this.model.getOpenSearchURL();
			if ( newUrl != prevUrl ) {
				this.applyOpenSearchUrl(newUrl);
			}
		},
		
		// Click on search
		"click .scSubmit": function(event) {
		
			// reset request
			StandingOrderDataAccessRequest.initialize();

			//set open search url
			StandingOrderDataAccessRequest.OpenSearchURL = this.model.getOpenSearchURL();
						
			//set selected download options
			StandingOrderDataAccessRequest.DownloadOptions = this.model.getSelectedDownloadOptions();

			var element = $('<div id="standingOrderPopup">');
			element.appendTo('.ui-page-active');

			element.ngeowidget({
				title: "Select download manager",
				hide: function() {
					element.remove();
				}
			});

			DownloadManagers.fetch().done(function() {
					
				var downloadManagersListView = new DownloadManagersListView({
					model : DownloadManagers,
					el: element,
					selectedDownloadManager : "",
					request : StandingOrderDataAccessRequest
				});
				
				downloadManagersListView.render();
				element.trigger('create');
				element.ngeowidget("show");
				
			});

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
	 * Update the opensearch URL
	 */
	displayOpenSearchURL: function() {
		if ( this.model.dataset ) {
			var url = this.model.getOpenSearchURL();
			this.$el.find("#osUrlText").val( url );	
		} else {
			this.$el.find("#osUrlText").val( '' );	
		}
	},
	
	/**
	 * Constructor
	 * Connect to model change and dataset loaded events
	 */
	initialize : function() {
	},
		
	/**
	 * Apply a new OpenSearch URL to the view
	 */
	applyOpenSearchUrl: function(newUrl) {
	
		try {
			// Check if url is ok
			var re = new RegExp('^'  + Configuration.serverHostName + Configuration.baseServerUrl + '/catalogue/([^/]+)/search\\?(.+)');
			var m  = re.exec(newUrl);
			if ( m ) {
				// Url is ok, check if we need to change the dataset
				var datasetId = m[1];
				var currentDatasetId = this.model.get("datasetId");
				
				if ( datasetId == currentDatasetId ) {
					// Directly populate the DatasetSearch with the URL parameters
					this.model.populateModelfromURL( m[2] );
				} else {
					// First wait for the new dataset to be loaded, otherwise fallback to previous dataset, and do not update the parameters
					this.model.once('change:dataset', function(dataset) {
						if ( dataset ) {
							this.model.populateModelfromURL( m[2] );
						} else {
							Logger.error("Invalid OpenSearch URL : cannot load the dataset " + datasetId + ".");
							this.model.set('datasetId', currentDatasetId);
						}
					}, this);
					this.model.set('datasetId', datasetId);
				}
			} else {
				Logger.error("Invalid OpenSearch URL.");
			}
			
		} catch (err) {
			Logger.error("Invalid OpenSearch URL : " + err);
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
	 * Render the view
	 */
	render: function(){
		
		StandingOrderDataAccessRequest.initialize();

		var content = _.template(searchCriteria_template, { submitText: "Order", useDate: false});
		this.$el.append(content);			
				
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
		
		this.$el.trigger('create');
		
		// Refresh the OpenSearch URL when the textarea is visible
		var self = this;
		this.$el.find('#osUrl')
			.bind('collapse', function() {
					self.stopListening( self.model, 'change', self.displayOpenSearchURL );
				})
			.bind('expand', function() {
					self.displayOpenSearchURL();
					self.listenTo( self.model, 'change', self.displayOpenSearchURL );
				});
									
		return this;
	}
	
});

return StandingOrderView;

});