define( ['jquery', 'backbone', 'search/model/datasetSearch', 'search/view/SearchResultsTable', 'jquery.dataTables'], 
		function($, Backbone, DatasetSearch, SearchResultsTable) {

var SearchResultsView = Backbone.View.extend({
	
	initialize : function(options){
		this.model.on("change", this.displayResultsTable, this);
		this.$el.append('<div id="searchMessage"></div>');
		this.$el.append('<div id="tableToolBar"></div>');
		this.$el.append('<table cellpadding="0" cellspacing="0" border="0" class="display" id="datatable"></table>');
	},

	render: function(){

		var itemsCount = this.model.get("items").length; 
		if (itemsCount == 0){
			this.$el.find("#searchMessage").append("Searching....");
		}
		
		return this;
	},	

	displayResultsTable : function(){
		
		this.$el.find("#searchMessage").empty();
		
		var self = this;
		var searchResultsTable = new SearchResultsTable({
			el : this.$el.find("#datatable"), 
			model : this.model,
			searchResultsView : self
			});
			
		searchResultsTable.render();
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
    },
	
});

return SearchResultsView;

});