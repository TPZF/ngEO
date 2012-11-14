define( ['jquery', 'backbone',
         'search/model/dataset', 'search/model/datasetSearch', 'search/model/searchResults',
         'search/view/datasetSelectionView', 'search/view/searchCriteriaView', 'search/view/searchResultsView', ], 
		function($, Backbone, Dataset, DatasetSearch, SearchResults,
				DatasetSelectionView, SearchCriteriaView, SearchResultsView) {

	/** 
	 * main search view : responsible for handling the dataset selection 
	 * and search criteria sub views
	 */
var MainSearchView = Backbone.View.extend({
			
	id: "searchWidget",
	
	initialize: function(options) {
		this.datasetSelectionModel = options.datasetSelectionModel;
		this.$el.append('<div id="datasetsSelection"></div>');
		this.$el.append('<div id="datasetSearchCriteria"></div>');
		this.$el.append('<div id="searchResults"></div>');
	},
	
	render: function(){
		this.displayDatasets();	
		return this;
	},
	
	displaySearchCriteria : function(datasetId){

		// Retreive the dataset information
		var dataset = new Dataset({id : datasetId});			
		dataset.fetch();		
		
		// Get only date part (without time)
		// TODO : the startDate and endDate should be taken from the DataSet informations
		var today = (new Date()).toISOString();
		var dateOnly = today.substring(0, today.indexOf('T'));

		var datasetSearch = new DatasetSearch({ 
				"datasetId" : datasetId,
				"startdate" : dateOnly,
				"stopdate" : dateOnly
		});
		
		var searchCriteriaView = new SearchCriteriaView({
			el : this.$el.find("#datasetSearchCriteria"),
			model : datasetSearch,
			mainView : this,
			dataset : dataset,
		});
		
		this.showView(searchCriteriaView);
	},
	
	displayDatasets : function(){
		
		var datasetsView = new DatasetSelectionView({
			el : this.$el.find("#datasetsSelection"),
			model : this.datasetSelectionModel,
			mainView : this
		});
		
		this.showView(datasetsView);
	},
	
	displaySearchResults : function(datasetSearch){
		
		SearchResults.url = datasetSearch.getOpenSearchURL();
		SearchResults.fetch();

		var searchResultsView =  new SearchResultsView({ 
			el : this.$el.find("#searchResults"),
			model : SearchResults,
			mainView : this
		});
		
		this.showView(searchResultsView);
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
		//	this.$el.ngeowidget('update');
		}
     }
	
});

return MainSearchView;

});