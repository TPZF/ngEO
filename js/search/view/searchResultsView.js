define( ['jquery', 'backbone', 'search/view/searchResultsTableView',  'text!search/template/searchResultViewContent_template.html'], 
		function($, Backbone, SearchResultsTableView, searchResultsView_temp) {

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
		
		var searchResultsTableView = new SearchResultsTableView({
			el : this.$el.find("#results"), 
			model : this.model,
			searchResultsView : this,
			mainView : this.mainView
		});
			
		searchResultsTableView.render();
	},


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