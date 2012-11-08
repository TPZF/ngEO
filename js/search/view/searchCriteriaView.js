

define( ['jquery', 'backbone', 'search/model/datasetSearch', 'search/view/spatialExtentView',
         'search/view/timeExtentView',  'search/view/advancedSearchView', "search/widget/searchResultsWidget",
         'text!search/template/searchCriteriaContent_template.html',
         'text!search/template/advancedCriteriaContent.html', "jqm-datebox-calbox"], 
		function($, Backbone, DatasetSearch, SpatialExtentView, TimeExtentView, 
				AdvancedSearchView, SearchResultsWidget,
				searchCriteria_template, dateCriteria_template, 
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
			 this.showDateCriteria();
		},
		'click #radio-area-label' : function(){
			 this.showAreaCriteria();
		},
		'click #radio-searchCriteria-label' : function(){
			 this.showAdvancedCriteria();
		},
		//TODO remove since the click is not catched
		'click #closePopup' : function(){
			$("#popupText").empty();
		}
	},
	
	render: function(){
	
		var content = _.template(searchCriteria_template, {datasetId : this.model.get("datasetId")});
		
		// Add a back button to return to dataset selection
		var backButton = this.mainView.$el.ngeowidget('addButton', { id: 'back', name: 'Back' });
		var self = this;
		backButton.click( function() {
			self.mainView.displayDatasets();
		});
			
		// Add a search button to submit the search request
		this.searchButton = this.mainView.$el.ngeowidget('addButton', { id: 'searchRequest', name: 'Search' });
		var self = this;
		this.searchButton.click( function() {
			SearchResultsWidget(self.model);
		});		
		
		// Search button is disable when no search criteria are is selected
		//this.searchButton.button('disable');
		
		// Add a search url button to display the openSearch request url
		//this.searchUrlButton = this.mainView.$el.ngeowidget('addLink', { divId : '#openSearchUrlPopup' , id: 'searchUrl', name: 'Search URL' });
		this.searchUrlButton = this.mainView.$el.ngeowidget('addButton', { id: 'searchUrl', name: 'Search URL' });
		
		var self = this;
		
		this.searchUrlButton.click( function() {
			//work around to remove the previous url since the click on the close button of the popup is not catched... 
			$("#popupText").empty();
			//append the current url
			$("#popupText").append(self.model.getOpenSearchURL());	
			$('#openSearchUrlPopup').popup("open",  $( {} )
				    .jqmData( "position-to", "window" )
				    .jqmData( "transition", "slide" ));
			$('#openSearchUrlPopup').trigger('create');

		});	
		
		
		//TODO fix the update according to criteria selection
		// Search button is disable when no search criteria are is selected
		//this.searchUrlButton.button('disable');
		
		//console.log ("content of the dataset selection template : ");
		//console.log(content);
		
		$(this.el).append($(content));
		
		this.$el = $(this.el);
		
		this.showDateCriteria();

		this.delegateEvents();
		
		return this;
	},	
	
	showDateCriteria : function(){
		
		var timeView = new TimeExtentView ({
			el : this.$el.find("#date"), 
			searchCriteriaView : this,
			model : this.model
			});
		this.showView(timeView);		
	},

	showAreaCriteria : function(){
		
		var spatialExtent = new SpatialExtentView({
			el : this.$el.find("#area"), 
			searchCriteriaView : this,
			model : this.model });
		this.showView(spatialExtent);

	},
	
	showAdvancedCriteria : function(){
		
		var advancedSearchView = new AdvancedSearchView({
			el : this.$el.find("#searchCriteria"), 
			searchCriteriaView : this,
			model : this.model ,
			dataset : this.dataset});
		this.showView(advancedSearchView);

	},
	
	showView : function(view){

		if (this.currentView != undefined && this.currentView.el != view.el){
			this.currentView.close();
		}
		this.currentView = view;
		view.render();
		this.$el.trigger('create');
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