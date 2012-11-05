

define( ['jquery', 'backbone', 'search/model/datasetSearch', 
         'text!search/template/advancedCriteriaContent.html', "jqm-datebox-calbox"], 
		function($, Backbone, DatasetSearch , advancedCriteria_template) {

var AdvancedSearchView = Backbone.View.extend({

	// the model is the dataset 
	
	initialize : function(options){
		
		this.searchCriteriaView = options.searchCriteriaView;
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
    	//this.model.off("change", this.searchCriteriaView.update(), this.searchCriteriaView);
    },
	
});

return AdvancedSearchView;

});