

define( ['jquery', 'backbone', 'search/model/datasetSearch', 
         'text!search/template/areaCriteriaContent.html', "jqm-datebox-calbox"], 
		function($, Backbone, DatasetSearch, areaCriteria_template) {

var SpatialExtentView = Backbone.View.extend({

	//the model is a DatasetSearch
	
	initialize : function(options){
		
		this.mainView = options.mainView;

	},
	
	events :{
		
		'change #west' : function(event){
			this.searchModel.set({"west" : $(event.currentTarget).val()});
		},
		
		'change #south' : function(event){
			this.searchModel.set({"south" : $(event.currentTarget).val()});
		},
		
		'change #east' : function(event){
			this.searchModel.set({"east" : $(event.currentTarget).val()});
		},
		
		'change #north' : function(event){
			this.searchModel.set({"north": $(event.currentTarget).val()});
		},
		
		'click #mapExtentCheckBox' : function(event){
			
			var $target = $(event.currentTarget);
			//TODO DISPALY COORDINATES FROM MAP
		}		
	},
	
	render: function(){

		this.$el.append($(areaCriteria_template));
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
    	//this.model
    },
	
});

return SpatialExtentView;

});