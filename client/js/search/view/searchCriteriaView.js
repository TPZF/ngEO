

define( ['jquery', 'backbone', 'configuration', 'searchResults/model/searchResults', 'search/view/spatialExtentView',
         'search/view/timeExtentView',  'search/view/advancedSearchView', 'search/view/downloadOptionsView',
         'dataAccess/model/standingOrderDataAccessRequest',  'dataAccess/widget/standingOrderWidget', 
         'text!search/template/searchCriteriaContent_template.html', "tabs"], 
		function($, Backbone, Configuration, SearchResults, SpatialExtentView, TimeExtentView, 
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
		this.model.on("change:datasetId", this.onDataSetChanged, this);
		this.model.on("datasetLoaded", this.displayDatasetRelatedViews, this);
		this.model.on("datasetNotLoadError", this.displayErrorMessages, this);
	},
	
	/**
	 * Update the view when the datasetId have been changed
	 */
	onDataSetChanged: function() {
		
		if ( this.model.get("datasetId") ) {
			//load the selected dataset from the server
			this.searchButton.button('enable');
			this.searchUrlButton.button('enable');
			this.standingOrderButton.button('enable');
			this.shareButton.button('enable');
		} else {
			this.searchButton.button('disable');
			this.searchUrlButton.button('disable');
			this.shareButton.button('disable');
		}
		//if the dataset is defined load it from the server unless it is set to undefined
		this.model.updateDatasetModel();		
	},
	/**
	 * Callback method to display the advanced search criteria and the download options
	 * for the selected dataset once they are loaded
	 */
	displayDatasetRelatedViews : function(){
		this.$el.find("#searchCriteria").empty();
		this.advancedCriteriaView.render();
		this.$el.find("#downloadOptions").empty();
		this.downloadOptionsView.render();
	},
	
	displayErrorMessages: function(){
		this.$el.find("#searchCriteria").empty();
		this.$el.find("#searchCriteria").append("<div id='searchCriteriaMessage'><p><b>The dataset has not been loaded. No criteria available.</b></p></div>");
		this.$el.find("#downloadOptions").empty();
		this.$el.find("#downloadOptions").append("<div id='downloadOptionsMessage'><p><b>The dataset has not been loaded. No download options available.</b></p></div>");
	},
		
	/**
	 * Render the view
	 */
	render: function(){
	
		var content = _.template(searchCriteria_template, {datasetId : this.model.get("datasetId")});
					
		// Add a search button to submit the search request
		this.searchButton = this.$el.ngeowidget('addButton', { id: 'searchRequest', name: 'Submit Search' });
		var self = this;
	
		this.searchButton.click( function() {
			SearchResults.launch( self.model.getOpenSearchURL() );
			self.$el.ngeowidget('hide');
		});		
				
		// Add a search url button to display the openSearch request url
		this.searchUrlButton = this.$el.ngeowidget('addButton', { id: 'searchUrl', name: 'Search URL', position: 'left' });
		
		 //Add a standing order button to create a standing order
		this.standingOrderButton = this.$el.ngeowidget('addButton', { id: 'standingOrder', name: 'Standing Order', position: 'left' });

		this.standingOrderButton.click( function() {
			
			StandingOrderDataAccessRequest.initialize();
			//set open search url
			StandingOrderDataAccessRequest.OpenSearchURL = self.model.getOpenSearchURL();
			//set selected download options
			StandingOrderDataAccessRequest.DownloadOptions = self.model.getSelectedDownloadOptions();
			
			var standingOrderWidget = new StandingOrderWidget();
			standingOrderWidget.open();
		});
		
		this.searchUrlButton.click( function() {
			// Set the openSearch url
			$("#popupText").html( '<b>' + Configuration.serverHostName + self.model.getOpenSearchURL() + '<b>');	
			$('#openSearchUrlPopup').popup("open",  $( {} )
				    .jqmData( "position-to", "window" )
				    .jqmData( "transition", "slide" ));
			$('#openSearchUrlPopup').trigger('create');

		});	
		
		//add share button to share search criteria widget
		this.shareButton = this.$el.ngeowidget('addButton', { id: 'shareSearch', name: 'Share', position: 'left' });
	
		this.shareButton.click( function() {
			
			// Set the opensearch url
			$("#sharedUrlText").html( '<b>' + Configuration.serverHostName + (window.location.pathname) + self.model.getSharedSearchURL() + '<b>');	
			$('#sharedUrlPopup').popup("open",  $( {} )
				    .jqmData( "position-to", "window" )
				    .jqmData( "transition", "slide" ));
			$('#sharedUrlPopup').trigger('create');
			
		});
		
		this.$el.append(content);
		
		// Create the tabs
		this.$el.find("#tabs").tabs();
		
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
		this.$el.find("#tabs").find("a").removeClass('ui-link');
		
		// Disable all button if no dataset
		if ( !this.model.get("datasetId") ) {
			this.searchButton.button('disable');
			this.searchUrlButton.button('disable');
			this.standingOrderButton.button('disable');
			this.shareButton.button('disable');
		}

		return this;
	}
	
});

return SearchCriteriaView;

});