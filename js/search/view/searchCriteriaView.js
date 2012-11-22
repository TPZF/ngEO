

define( ['jquery', 'backbone', 'configuration', 'search/model/datasetSearch', 'search/view/spatialExtentView',
         'search/view/timeExtentView',  'search/view/advancedSearchView', 
         'text!search/template/searchCriteriaContent_template.html',
         'text!search/template/advancedCriteriaContent.html', "jqm-datebox-calbox"], 
		function($, Backbone, Configuration, DatasetSearch, SpatialExtentView, TimeExtentView, 
				AdvancedSearchView, searchCriteria_template, dateCriteria_template, 
				areaCriteria_template, advancedCriteria_template) {

var SearchCriteriaView = Backbone.View.extend({

	initialize : function(options){
		
		this.mainView = options.mainView;
		this.dataset = options.dataset;
					
	//bind the search model change here to avoiding calling the update method
		//this.searchModel.on("change", this.update, this);
	},
	
	events : {
		'click #radio-date-label' : function(){
			 this.dateCriteriaView.$el.show();
			 this.areaCriteriaView.$el.hide();
			 this.advancedCriteriaView.$el.hide();
		},
		'click #radio-area-label' : function(){
			 this.dateCriteriaView.$el.hide();
			 this.areaCriteriaView.$el.show();
			 this.advancedCriteriaView.$el.hide();
		},
		'click #radio-searchCriteria-label' : function(){
			 this.dateCriteriaView.$el.hide();
			 this.areaCriteriaView.$el.hide();
			 this.advancedCriteriaView.$el.show();
		},
		//TODO remove since the click is not catched
		'click #closePopup' : function(){
			$("#popupText").empty();
		}
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
		
		// Search button is disable when no search criteria are is selected
		//this.searchButton.button('disable');
		
		// Add a search url button to display the openSearch request url
		//this.searchUrlButton = this.mainView.$el.ngeowidget('addLink', { divId : '#openSearchUrlPopup' , id: 'searchUrl', name: 'Search URL' });
		this.searchUrlButton = this.mainView.$el.ngeowidget('addButton', { id: 'searchUrl', name: 'Search URL', position: 'left' });
		
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
		this.areaCriteriaView.$el.hide();	
		
		this.advancedCriteriaView = new AdvancedSearchView({
			el : this.$el.find("#searchCriteria"), 
			searchCriteriaView : this,
			model : this.model ,
			dataset : this.dataset});
		this.advancedCriteriaView.render();
		this.advancedCriteriaView.$el.hide();	
		
		this.$el.trigger('create');
		
		
		
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