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

		var dataset = new Dataset({datasetId : datasetId});		
		
		dataset.fetch();		
		
		//get only date part (without time)
		var today = (new Date()).toISOString();
		var dateOnly = today.substring(0, today.indexOf('T'));
		console.log(dateOnly);
		var datasetSearch = new DatasetSearch({"datasetId" : datasetId  , "startdate" : dateOnly , "stopdate" : dateOnly});
		
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
		
		this.searchResults = new SearchResults();
		//TODO use the openSearch url when the service is implemented
		//searchResults.url = self.DatasetSearch.getOpenSearchURL();
		//For the moment used only host string to communicate with the stub server 
		this.searchResults.url = datasetSearch.get("host");
		
		this.searchResults.fetch();

		var searchResultsView =  new SearchResultsView({ 
			el : this.$el.find("#searchResults"),
			model : this.searchResults,
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
			this.$el.ngeowidget('update');
		}
     }
	
});

return MainSearchView;

});