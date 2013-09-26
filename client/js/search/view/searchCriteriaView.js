

define( ['jquery', 'backbone', 'configuration', 'logger', 'searchResults/model/searchResults', 'search/view/spatialExtentView',
         'search/view/timeExtentView',  'search/view/advancedSearchView', 'search/view/downloadOptionsView',
         'dataAccess/model/standingOrderDataAccessRequest',  'dataAccess/widget/standingOrderWidget', 
         'text!search/template/searchCriteriaContent_template.html', "tabs"], 
		function($, Backbone, Configuration, Logger, SearchResults, SpatialExtentView, TimeExtentView, 
				 AdvancedSearchView, DownloadOptionsView, StandingOrderDataAccessRequest, StandingOrderWidget,
				 searchCriteria_template) {

/**
 * The model for this view is a backbone model : DatasetSearch 
 */
var SearchCriteriaView = Backbone.View.extend({

	/**
	 * Id for view div container
	 */
	id: "datasetSearchCriteria",
	
	/**
	 * Constructor
	 * Connect to model change and dataset loaded events
	 */
	initialize : function() {
		// Listen to change on dataset to rebuild the advanced and download option views
		this.model.on("change:dataset", this.displayDatasetRelatedViews, this);
	},
	
	/**
	 * Callback method to display the advanced search criteria and the download options
	 * for the selected dataset once they are loaded
	 */
	displayDatasetRelatedViews : function(dataset){
		this.$el.find("#searchCriteria").empty();
		this.$el.find("#downloadOptions").empty();
		if ( dataset ) {
			this.advancedCriteriaView.render();
			this.downloadOptionsView.render();
		} else {
			this.$el.find("#searchCriteria").append("<div class='ui-error-message'><p><b>Failure: The dataset has not been loaded. No criteria available.</b></p></div>");
			this.$el.find("#downloadOptions").append("<div class='ui-error-message'><p><b>Failure: The dataset has not been loaded. No download options available.</b></p></div>");
		}
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
	 * Render the view
	 */
	render: function(){
	
		var content = _.template(searchCriteria_template, {datasetId : this.model.get("datasetId")});
		
		this.$el.append(content);
		
		// Move footer to parent widget
		var $footer = this.$el.find('#sc-footer')
			.insertAfter(this.$el)
			.trigger('create');
					
		var self = this;
			
		// Launch a search when the user clicks on the button
		$footer.find('#searchRequest').click( function() {
			SearchResults.launch( self.model.getOpenSearchURL() );
			self.$el.ngeowidget('hide');
		});		
				
			
		 // To create a standing order
		$footer.find('#standingOrder').click( function() {
			
			StandingOrderDataAccessRequest.initialize();
			//set open search url
			StandingOrderDataAccessRequest.OpenSearchURL = self.model.getOpenSearchURL();
			//set selected download options
			StandingOrderDataAccessRequest.DownloadOptions = self.model.getSelectedDownloadOptions();
			
			var standingOrderWidget = new StandingOrderWidget();
			standingOrderWidget.open();
		});
				
		// Open the searchURL popup when the user click on the button
		$footer.find('#searchUrl').click( function() {
			// Set the openSearch url
			var url = Configuration.serverHostName + self.model.getOpenSearchURL();
			$("#popupText").val( url );	
			$('#openSearchUrlPopup').popup("open");
		});	
			
		// To share a search
		$footer.find('#shareSearch').click( function() {
			// Set the opensearch url
			$("#sharedUrlText").html( '<b>' + Configuration.serverHostName + (window.location.pathname) + self.model.getSharedSearchURL() + '<b>');	
			$('#sharedUrlPopup').popup("open");
			$('#sharedUrlPopup').trigger('create');
		});
	
		
		// Create the tabs
		var $tabs = this.$el.find("#sc-tabs").tabs();
		
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
			model : this.model });
		this.areaCriteriaView.render();
		
		this.advancedCriteriaView = new AdvancedSearchView({
			el : this.$el.find("#searchCriteria"), 
			model : this.model});
		this.advancedCriteriaView.render();
		
		this.$el.trigger('create');
		
		//add download options view as a tab
		this.downloadOptionsView = new DownloadOptionsView({
			el : this.$el.find("#downloadOptions"), 
			model : this.model});
		this.downloadOptionsView.render();
		
		this.$el.trigger('create');
		
		// Remove class added by jQM
		$tabs.find("a").removeClass('ui-link');
		
		// Bind the popupafterclose event on the SearchURL popup
		// Must be called after this.$el.trigger('create'); to have the popup created.
		$('#openSearchUrlPopup').bind("popupafterclose", function(event, ui) {
			var newUrl = $("#popupText").val();
			var prevUrl = Configuration.serverHostName + self.model.getOpenSearchURL();
			if ( newUrl != prevUrl ) {
				self.applyOpenSearchUrl(newUrl);
			}
		});
		
		return this;
	}
	
});

return SearchCriteriaView;

});