define( ['jquery', 'backbone',
         'search/model/dataset','search/view/datasetSelectionView', 
         'search/view/searchCriteriaView'], 
		function($, Backbone, Dataset, 
				DatasetSelectionView, SearchCriteriaView) {

	/** 
	 * main search view : responsible for handling the dataset selection 
	 * and search criteria sub views
	 */
var MainSearchView = Backbone.View.extend({
			
	id: "searchWidget",
	
	initialize: function() {
		this.$el.append('<div id="datasetsSelection"></div>');
		this.$el.append('<div id="datasetSearchCriteria"></div>');
	},
	
	render: function(){
		this.displayDatasets();	
		return this;
	},
	
	displaySearchCriteria : function(datasetId){

		var dataset = new Dataset({datasetId : datasetId});		
		dataset.load();		
		
		var searchCriteriaView = new SearchCriteriaView({
			el : this.$el.find("#datasetSearchCriteria"),
			model : dataset,
			mainView : this
		});
		
		this.showView(searchCriteriaView);
	},
	
	displayDatasets : function(){
		
		var datasetsView = new DatasetSelectionView({
			el : this.$el.find("#datasetsSelection"),
			model : this.model,
			mainView : this
		});
		
		this.showView(datasetsView);
	},
	
	showView : function(view) {
	       
		var needToUpdate = false;
		if (this.currentView && this.currentView != view) {
           this.currentView.close();
		   needToUpdate = true;
        }

        this.currentView = view;
        this.currentView.render();
		
		if (needToUpdate) {
			this.$el.ngeowidget('update');
		}
     }
	
});

return MainSearchView;

});