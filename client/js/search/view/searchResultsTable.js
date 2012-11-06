define( ['jquery', 'backbone', 'search/model/datasetSearch', 
         'text!search/template/areaCriteriaContent.html', "jqm-datebox-calbox"], 
		function($, Backbone, Map, areaCriteria_template) {

var SearchResultsTable = Backbone.View.extend({

	//the model is a SearchResults backbone model
	
	initialize : function(options){
		
		this.searchResultsView = options.searchResultsView;
		this.model.on("sync", this.render, this);
	},

	render: function(){

		//TODO create the datatable
		//this.$el.dataTable(this.model.get("features"));

		//return this;
	},	

	
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

return SearchResultsTable;

});