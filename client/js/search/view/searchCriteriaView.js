

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
		'click #radio-date-label' : function(){
			 this.showDateCriteria();
		},
		'click #radio-area-label' : function(){
			 this.showAreaCriteria();
		},
		'click #radio-searchCriteria-label' : function(){
			 this.showAdvancedCriteria();
		}
		
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
		
		if (this.currentEl != undefined && this.currentEl != this.$el.find("#date")){
			console.log($(this.currentEl));
			$(this.currentEl).empty();
			console.log($(this.currentEl));
			$(this.currentEl).unbind();
		}

		this.$el.find("#date").append($(dateCriteria_template));
		this.currentEl = this.$el.find("#date");
		this.$el.trigger('create');
	},

	showAreaCriteria : function(){
		
		if (this.currentEl != undefined && this.currentEl != this.$el.find("#area")){
			$(this.currentEl).empty();
			console.log($(this.currentEl));
			$(this.currentEl).unbind();
		}
		this.$el.find("#area").append($(areaCriteria_template));
		this.currentEl = this.$el.find("#area");
		this.$el.trigger('create');
	},
	
	showAdvancedCriteria : function(){
		
		if (this.currentEl != undefined && this.currentEl != this.$el.find("#searchCriteria")){
			$(this.currentEl).empty();
			console.log($(this.currentEl));
			$(this.currentEl).unbind();
		}
		this.$el.find("#searchCriteria").append($(areaCriteria_template));
		this.currentEl = this.$el.find("#searchCriteria");
		this.$el.trigger('create');	
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