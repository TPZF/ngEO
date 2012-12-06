

//TODO LATER / HANDLE THE ADVANCED SEARCH CRITERIA
define( ['jquery', 'backbone',  'search/model/dataset',
         'text!search/template/advancedCriteriaContent.html', "jqm-datebox-calbox"], 
		function($, Backbone, Dataset, advancedCriteria_template) {

var AdvancedSearchView = Backbone.View.extend({

	// the model is the DatasetSearch (the search model containing search params)
	
	initialize : function(options){
		
		this.searchCriteriaView = options.searchCriteriaView;
	},
	
	events :{		
	},
	
	render: function(){
	
		this.$el.append(advancedCriteria_template);
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
