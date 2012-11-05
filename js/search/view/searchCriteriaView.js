

define( ['jquery', 'backbone', 'search/model/datasetSearch', 'search/view/spatialExtentView',
         'search/view/timeExtentView', 'text!search/template/searchCriteriaContent_template.html',
         'text!search/template/advancedCriteriaContent.html', "jqm-datebox-calbox"], 
		function($, Backbone, DatasetSearch , SpatialExtentView, TimeExtentView, 
				searchCriteria_template, dateCriteria_template, 
				areaCriteria_template, advancedCriteria_template) {

var SearchCriteriaView = Backbone.View.extend({

	initialize : function(options){
		
		this.mainView = options.mainView;
		this.searchModel = options.searchModel;
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
			
		});		
		// Search button is disable when no search criteria are is selected
		this.searchButton.button('disable');
		
		// Add a search url button to display the openSearch request url
		this.searchUrlButton = this.mainView.$el.ngeowidget('addButton', { id: 'searchUrl', name: 'Search URL' });
		var self = this;
		this.searchUrlButton.click( function() {
			//display pop up with openSearch url
		});		
		// Search button is disable when no search criteria are is selected
		this.searchUrlButton.button('disable');
		
		//console.log ("content of the dataset selection template : ");
		//console.log(content);
		
		$(this.el).append($(content));
		
		this.$el = $(this.el);
		
		this.showDateCriteria();
		
		//bind the serach model change here to avoiding calling the update method
		this.searchModel.on("change", this.update(), this);
		
		this.delegateEvents();
		
		return this;
	},	
	
	showDateCriteria : function(){
		
		var timeView = new TimeExtentView ({
			el : this.$el.find("#date"), 
			model : this.searchModel
			});
		this.showView(timeView);		
	},

	showAreaCriteria : function(){
		
		var spatialExtent = new SpatialExtentView({
			el : this.$el.find("#area"), 
			model : this.searchModel });
		this.showView(spatialExtent);

	},
	
	showAdvancedCriteria : function(){
		
		if (this.currentEl != undefined && this.currentEl != this.$el.find("#searchCriteria")){
			$(this.currentEl).empty();
			console.log($(this.currentEl));
			$(this.currentEl).unbind();
		}
		this.$el.find("#searchCriteria").append($(advancedCriteria_template));
		this.currentEl = this.$el.find("#searchCriteria");
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
	
		if (this.searchModel.get("startdate") != "" && this.searchModel.get("stopdate") != ""){
		
			this.searchUrlButton.button('enable');
			this.searchButton.button('enable');
		}
		
	},
	
	// TODO move to Backbone.View.prototype
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

    },
	
});

return SearchCriteriaView;

});