define( ['jquery', 'backbone', 'search/model/datasetSearch', 'search/view/SearchResultsTable', 
         'text!search/template/areaCriteriaContent.html'], 
		function($, Backbone, Map, areaCriteria_template) {

var SearchResultsView = Backbone.View.extend({
	
	initialize : function(options){
		this.searchTableModel = options.searchTableModel;
		this.$el.append('<div id="searchMessage"></div>');
		this.$el.append('<div id="tableToolBar"></div>');
		this.$el.append('<div id="datatable"></div>');
	},

	render: function(){

		var itemsCount = this.searchTableModel.get("features").length; 
		if (itemsCount == 0){
			this.$el.find("#searchMessage").append("Searching....");
		}else{
			this.$el.find("#searchMessage").append("Retrieved " + itemsCount + "results.");
			//this.displayToolBar();
			this.displayResultsTable();
			
		}
		//this.$el.append(_.template(, this.model));

		return this;
	},	

	displayResultsTable : function(){
		var searchResultsTable = new SearchResultsTable({
			el : this.$el.find("#datatable"), 
			model : this.searchTableModel
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