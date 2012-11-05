

define( ['jquery', 'backbone', 'search/model/datasetSearch', 
         'text!search/template/dateCriteriaContent.html', "jqm-datebox-calbox"], 
		function($, Backbone, DatasetSearch , dateCriteria_template, advancedCriteria_template) {

var TimeExtentView = Backbone.View.extend({

	initialize : function(options){
		
		this.mainView = options.mainView;
	},
	
	events :{

		'change #from' : function(event){
			this.searchModel.set({"startdate" : $(event.currentTarget).val()});
		},
		'change #to' : function(event){
			this.searchModel.set({"stopdate" : $(event.currentTarget).val()});
		}		
	},
	
	render: function(){
	
		var content = _.template(dateCriteria_template, this.model);
		console.log(content);
		this.$el.append($(content));
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

return TimeExtentView;

});