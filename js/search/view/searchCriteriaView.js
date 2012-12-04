

define( ['jquery', 'backbone', 'configuration', 'search/model/datasetSearch', 'search/view/spatialExtentView',
         'search/view/timeExtentView',  'search/view/advancedSearchView', 
         'dataAccess/model/standingOrderDataAccessRequest',  'dataAccess/widget/StandingOrderWidget', 
         'text!search/template/searchCriteriaContent_template.html', "tabs"], 
		function($, Backbone, Configuration, DatasetSearch, SpatialExtentView, TimeExtentView, 
				 AdvancedSearchView, StandingOrderDataAccessRequest, StandingOrderWidget,
				 searchCriteria_template) {

	/**
	 * The model for this view is a backbone model : DataSetSearch 
	 */
var SearchCriteriaView = Backbone.View.extend({

	initialize : function(options){
		
		this.mainView = options.mainView;
	},
	
	events : {
	},
	
	render: function(){
	
		var content = _.template(searchCriteria_template, {datasetId : this.model.get("datasetId")});
		
		// Add a back button to return to dataset selection
		var backButton = this.mainView.$el.ngeowidget('addButton', { id: 'back', name: 'Back', position: 'left' });
		var self = this;
		backButton.click( function() {
			self.mainView.displayDatasets();
		});
			
		// Add a search button to submit the search request
		this.searchButton = this.mainView.$el.ngeowidget('addButton', { id: 'searchRequest', name: 'Submit Search' });
		var self = this;
	
		this.searchButton.click( function() {
			self.mainView.displaySearchResults(self.model);
		});		
				
		// Add a search url button to display the openSearch request url
		this.searchUrlButton = this.mainView.$el.ngeowidget('addButton', { id: 'searchUrl', name: 'Search URL', position: 'left' });
		
		 //Add a standing order button to create a standing order
		this.standingOrderButton = this.mainView.$el.ngeowidget('addButton', { id: 'standingOrder', name: 'Standing Order', position: 'left' });

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
			model : this.model ,
			dataset : this.model.dataset});
		this.advancedCriteriaView.render();
		
		this.$el.trigger('create');
		
		// Remove class added by jQM
		this.$el.find("#tabs").find("a").removeClass('ui-link');

		return this;
	},	
		
	update : function(){
	
		if (this.model.get("startdate") != "" && this.model.get("stopdate") != ""
			&& this.model.get("west") != "" && this.model.get("south") != ""
			&& this.model.get("east") != "" && this.model.get("north") != ""){
		
			this.searchUrlButton.button('enable');
			this.searchButton.button('enable');
		}
	},
	
    close : function() {
 	   this.dateCriteriaView.close();
 	   this.areaCriteriaView.close();
	   this.advancedCriteriaView.close();
       this.undelegateEvents();
	   this.mainView.$el.ngeowidget('removeButton', '#back');
	   this.mainView.$el.ngeowidget('removeButton', '#searchRequest');
	   this.mainView.$el.ngeowidget('removeButton', '#searchUrl');
	   this.mainView.$el.ngeowidget('removeButton', '#standingOrder');
       this.$el.empty();
       if (this.onClose) {
          this.onClose();
       }
    }, 

    onClose : function() {
    	this.model = null;
    },
	
});

return SearchCriteriaView;

});