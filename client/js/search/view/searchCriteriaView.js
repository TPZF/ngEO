

define( ['jquery', 'backbone', 'underscore', 'text!search/template/searchCriteriaContent_template.html',
         'text!search/template/dateCriteriaContent.html', 'text!search/template/areaCriteriaContent.html'], 
		function($, Backbone, _ , searchCriteria_template, dateCriteria_template, areaCriteria_template) {

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
	
		var content = _.template(searchCriteria_template, {datasetId : this.model.get("datasetId")});
		
		console.log ("content of the dataset selection template : ");
		console.log(content);
		
		$(this.el).append($(content));
		
		this.$el = $(this.el);
		
		this.showDateCriteria();
		
		this.delegateEvents();
		
		return this;
	},
	

	
	showDateCriteria : function(){
		
		this.$el.find("#date").append($(dateCriteria_template));
		this.$el.trigger('create');
//		this.$el.find.$('#dateBoxLink').live("click", function() {
//			this.$el.find.$('#from').datebox('open');
//		});
		
		
	},

	showAreaCriteria : function(){
		
		this.$el.find("#area").append($(areaCriteria_template));
		
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