

define( ['jquery', 'backbone', 'underscore', 'text!search/template/searchCriteriaContent_template.html'], 
		function($, Backbone, _ , searchCriteria_template) {

var SearchCriteriaView = Backbone.View.extend({

	initialize : function(options){
		
		this.mainView = options.mainView;
		
	},
	
	events :{
		'click #back' : function(){
			 this.mainView.displayDatasets();
		},
	},
	
	render: function(){
	
		var content = _.template(searchCriteria_template, {datasetId : this.model.datasetId});
		
		console.log ("content of the dataset selection template : ");
		console.log(content);
		
		$(this.el).append($(content));
		
		this.$el = $(this.el);
		
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

return SearchCriteriaView;

});