define( ['jquery', 'backbone', 'search/model/datasetSearch',  'search/model/searchResultsTable', 
         'search/view/searchResultsTableView',  'text!search/template/searchResultViewContent_template.html',
         'jquery.dataTables'], 
		function($, Backbone, DatasetSearch, SearchResultsTable, SearchResultsTableView, searchResultsView_temp) {

	/** the model is a SearchResults model */
var SearchResultsView = Backbone.View.extend({
	
	initialize : function(options){
	
		this.model.on("change", this.displayResultsTable, this);
		
		this.datasetSearch = options.datasetSearch;
		this.mainView = options.mainView;
	},

	render: function(){
		
		this.$el.append(searchResultsView_temp);
		//this.$el.find("#results").hide();
		var itemsCount = this.model.get("features").length; 
		if (itemsCount == 0){
			this.$el.find("#searchMessage").append("Searching....");
		}
		this.$el.trigger("create");
		return this;
	},	

	displayResultsTable : function(){
		
		this.$el.find("#searchMessage").empty();
		
		var searchResultsTable = new SearchResultsTable({"features" : this.model.attributes.features});
		
		var searchResultsTableView = new SearchResultsTableView({
			el : this.$el.find("#results"), 
			model : searchResultsTable,
			searchResults : this.model,
			searchResultsView : this,
			mainView : this.mainView
		});
			
		searchResultsTableView.render();
	},
	
	//this.model.on("sync", this.render, this);
	// TODO move to Backbone.View.prototype
    close : function() {
    	
    	this.$el.empty();
    	this.undelegateEvents();
    	if (this.onClose) {
          this.onClose();
       }
    }, 
    
    onClose : function() {
    	this.model.off("change", this.displayResultsTable, this);
    },
	
});

return SearchResultsView;

});