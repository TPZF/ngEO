

//TODO LATER / HANDLE THE ADVANCED SEARCH CRITERIA
define( ['jquery', 'backbone',  'search/model/dataset', 'search/model/datasetSearch', 
         'text!search/template/advancedCriteriaContent.html', "jqm-datebox-calbox"], 
		function($, Backbone, DatasetSearch , advancedCriteria_template) {

var AdvancedSearchView = Backbone.View.extend({

	// the model is the DatasetSearch (the search model containing search params)
	// this.datset is the model for advanced search attributes model 
	
	initialize : function(options){
		
		this.searchCriteriaView = options.searchCriteriaView;
		this.dataset = options.dataset;
	},
	
	events :{		
	},
	
	render: function(){
	
		this.$el.append($(advancedCriteria_template));
		this.delegateEvents();
		return this;
	},	
	
	// TODO move to Backbone.View.prototype
    close : function() {
       this.undelegateEvents();
       this.$el.empty();
       if (this.onClose) {
          this.onClose();
       }
    }, 

    onClose : function() {
    },
	
});

return AdvancedSearchView;

});
