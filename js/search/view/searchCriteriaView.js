

define( ['jquery', 'backbone', 'configuration', 'search/model/datasetSearch', 'search/model/searchResults', 'search/view/spatialExtentView',
         'search/view/timeExtentView',  'search/view/advancedSearchView', 
         'dataAccess/model/standingOrderDataAccessRequest',  'dataAccess/widget/standingOrderWidget', 
         'text!search/template/searchCriteriaContent_template.html', "tabs"], 
		function($, Backbone, Configuration, DatasetSearch, SearchResults, SpatialExtentView, TimeExtentView, 
				 AdvancedSearchView, StandingOrderDataAccessRequest, StandingOrderWidget,
				 searchCriteria_template) {

/**
 * The model for this view is a backbone model : DataSetSearch 
 */
var SearchCriteriaView = Backbone.View.extend({

	/**
	 * Id for view div container
	 */
	id: "datasetSearchCriteria",
	
	/**
	 * Constructor
	 * Connect to model change
	 */
	initialize : function() {
		this.model.on("change:datasetId", this.onDataSetChanged, this);
	},
	
	/**
	 * Update the view when the datasetId have been changed
	 */
	onDataSetChanged: function() {
		//this.$el.find("h1").html( "Selected dataset : " + this.model.get("datasetId") );
		if ( this.model.get("datasetId") ) {
			this.searchButton.button('enable');
			this.searchUrlButton.button('enable');
			this.standingOrderButton.button('enable');
		} else {
			this.searchButton.button('disable');
			this.searchUrlButton.button('disable');
			this.standingOrderButton.button('disable');
		}
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
			SearchResults.url = DatasetSearch.getOpenSearchURL();
			SearchResults.set({"features" : [] }, {silent : true});
			SearchResults.fetch();
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
			StandingOrderDataAccessRequest.DownloadOptions = self.model.get("selectedDownloadOptions");
			
			var standingOrderWidget = new StandingOrderWidget();
			standingOrderWidget.open();
		});
		
		var self = this;
		
		this.searchUrlButton.click( function() {
			// Set the opensearch url
			$("#popupText").html( '<b>' + Configuration.serverHostName + self.model.getOpenSearchURL() + '<b>');	
			$('#openSearchUrlPopup').popup("open",  $( {} )
				    .jqmData( "position-to", "window" )
				    .jqmData( "transition", "slide" ));
			$('#openSearchUrlPopup').trigger('create');

		});	
		
		this.$el.append(content);
		
		// Create the tabs
		this.$el.find("#tabs").tabs();
		
		// Create the views for each criteria : time, spatial and advanced
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
			searchCriteriaView : this,
			model : this.model});
		this.advancedCriteriaView.render();
		
		this.$el.trigger('create');
		
		// Remove class added by jQM
		this.$el.find("#tabs").find("a").removeClass('ui-link');
		
		// Disable all button if no dataset
		if ( !this.model.get("datasetId") ) {
			this.searchButton.button('disable');
			this.searchUrlButton.button('disable');
			this.standingOrderButton.button('disable');
		}

		return this;
	}
	
});

return SearchCriteriaView;

});