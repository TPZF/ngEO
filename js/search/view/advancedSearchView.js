

define( ['jquery', 'backbone',  'search/model/dataset',
         'text!search/template/advancedCriteriaContent.html', "jqm-datebox-calbox"], 
		function($, Backbone, Dataset, advancedCriteria_template) {

var AdvancedSearchView = Backbone.View.extend({

	// the model is the DatasetSearch (the search model containing search params)
	//the dataset attribute is the Dataset backbone model containing the advanced criteria 
	
	initialize : function(options){
		
		this.searchCriteriaView = options.searchCriteriaView;
	},
	
	events :{		
	},
	
	render: function(){

		var content = _.template(advancedCriteria_template, this.model);
		this.$el.append(content);
		this.$el.trigger('create');
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
