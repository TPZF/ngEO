define( ['jquery', 'backbone', 'underscore','search/model/dataSetPopulation', 
         'search/model/dataset','search/view/datasetSelectionView', 
         'search/view/searchCriteriaView', 'text!search/template/mainSearchContent_template.html'], 
		function($, Backbone, _ , DataSetPopulation, Dataset, 
				DatasetSelectionView, SearchCriteriaView, mainView_template) {

	/** 
	 * main search view : responsible for handling the dataset selection 
	 * and search criteria sub views
	 */
var MainSearchView = Backbone.View.extend({
			
	render: function(){
	
		var content = _.template(mainView_template, {});

		console.log("the rendered template of the main search view : " + content);

		this.el = $(content);
		console.log("the main search view root el : ");
		console.log(this.el);
		
		this.$el = $(this.el);

		console.log("the main search view root $el : ");
		console.log(this.$el);
		
		this.displayDatasets();
		
		this.delegateEvents();
		
		return this;
	},
	
	displaySearchCriteria : function(datasetId){

		var dataset = new Dataset({datasetId : datasetId});
		
		console.log("Started loading dataset population matrix....");
		
		dataset.load();		
		
		var searchCriteriaView = new SearchCriteriaView({
			el : this.$el.find("#datasetSearchCriteria"),
			model : dataset,
			mainView : this
		});
		
		this.showView(searchCriteriaView);
	},
	
	displayDatasets : function(){
		
		var listModel = new DataSetPopulation();
		
		console.log("Started loading of dataset population matrix....");			
		listModel.fetch();	
		var datasetsView = new DatasetSelectionView({
			el : this.$el.find("#datasetsSelection"),
			model : listModel,
			mainView : this
		});
		
		this.showView(datasetsView);
	},
	
	showView : function(view) {
	       
		if (this.currentView && this.currentView != view) {
           this.currentView.close();
        }

        this.currentView = view;
        this.currentView.render();
     }
	
});

return MainSearchView;

});