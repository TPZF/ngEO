

define( ['jquery', 'backbone', 'text!search/template/dateCriteriaContent.html', 
         'jqm-datebox-calbox', 'jqm-datebox-datebox'], 
		function($, Backbone , dateCriteria_template, advancedCriteria_template) {

var TimeExtentView = Backbone.View.extend({

	initialize : function(options){
		
		this.searchCriteriaView = options.searchCriteriaView;
		//bind the search model change here to avoiding calling the update method
		this.model.on("change", this.searchCriteriaView.update, this.searchCriteriaView);
	},
	
	events :{

		'change #fromDateInput' : function(event){
			this.model.set({"startdate" : $(event.currentTarget).val()});
		},
		'change #toDateInput' : function(event){
			this.model.set({"stopdate" : $(event.currentTarget).val()});
		},
		
		'change #fromTimeInput' : function(event){
			this.model.set({"startTime" : $(event.currentTarget).val()});
		},
		'change #toTimeInput' : function(event){
			this.model.set({"stopTime" : $(event.currentTarget).val()});
		}		
	},
	
	render: function(){
	
		var content = _.template(dateCriteria_template, this.model);
		//console.log(content);
		this.$el.append($(content));
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
    	this.model.off("change", this.searchCriteriaView.update(), this.searchCriteriaView);
    },
	
});

return TimeExtentView;

});