

define( ['jquery', 'backbone', 'map/map',
         'text!search/template/areaCriteriaContent.html', "jqm-datebox-calbox"], 
		function($, Backbone, Map, areaCriteria_template) {

var SpatialExtentView = Backbone.View.extend({

	//the model is a DatasetSearch
	
	initialize : function(options){
		
		this.searchCriteriaView = options.searchCriteriaView;
		this.model.on("change", this.searchCriteriaView.update, this.searchCriteriaView);
		Map.on("endNavigation", this.synchronizeWithMapExtent, this);
	},
	
	events :{
		
		'change #west' : function(event){
			this.model.set({"west" : $(event.currentTarget).val()});
		},
		
		'change #south' : function(event){
			this.model.set({"south" : $(event.currentTarget).val()});
		},
		
		'change #east' : function(event){
			this.model.set({"east" : $(event.currentTarget).val()});
		},
		
		'change #north' : function(event){
			this.model.set({"north": $(event.currentTarget).val()});
		},
		
		'click #mapExtentCheckBoxLabel' : function(event){
			
			var $target = $(event.currentTarget);
			var useExtent = !($(event.currentTarget).hasClass('ui-checkbox-on'));
			this.model.set({"useExtent" : useExtent});
			this.synchronizeWithMapExtent();
		}		
	},
	
	render: function(){

		this.$el.append(_.template(areaCriteria_template, this.model));
		//forces the update of the checkbox status according to model
		$("input[type='checkbox']").prop("checked",this.model.get("useExtent"));
		this.synchronizeWithMapExtent();
		this.delegateEvents();
		return this;
	},	

	
	// TODO move to Backbone.View.prototype
    close : function() {
    	this.$el.empty();
    	this.undelegateEvents();
       if (this.onClose) {
          this.onClose();
       }
    }, 
    
    synchronizeWithMapExtent : function(){
    	
    	if(this.model.get("useExtent")){
	    	
    		var mapExtent = Map.getViewportExtent();
			this.model.set({"west" : mapExtent[0]});
			this.model.set({"south" : mapExtent[1]});
			this.model.set({"east" : mapExtent[2]});
			this.model.set({"north" : mapExtent[3]});
			
			$("#west").val(mapExtent[0]);
			$("#south").val(mapExtent[1]);
			$("#east").val(mapExtent[2]);
			$("#north").val(mapExtent[3]);
    	}
    },

    onClose : function() {
    	this.model.off("change", this.searchCriteriaView.update, this.searchCriteriaView);
   		Map.off("endNavigation", this.synchronizeWithMapExtent, this);	
    },
	
});

return SpatialExtentView;

});