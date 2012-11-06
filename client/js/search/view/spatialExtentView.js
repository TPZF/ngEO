

define( ['jquery', 'backbone', 'search/model/datasetSearch', 'map/map',
         'text!search/template/areaCriteriaContent.html', "jqm-datebox-calbox"], 
		function($, Backbone, DatasetSearch, Map, areaCriteria_template) {

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
	    	
    		var mapExtentString = new String(Map.getViewportExtent());
			//console.log("SpatialExtentView : use map extent check box " : mapExtentString);
			var coords = mapExtentString.split(',');
			this.model.set({"west" : coords[0]});
			this.model.set({"south" : coords[1]});
			this.model.set({"east" : coords[2]});
			this.model.set({"north" : coords[3]});
			
			$("#west").val(coords[0]);
			$("#south").val(coords[1]);
			$("#east").val(coords[2]);
			$("#north").val(coords[3]);
    	}
    },

    onClose : function() {
    	this.model.off("change", this.searchCriteriaView.update, this.searchCriteriaView);
   		Map.off("endNavigation", this.synchronizeWithMapExtent, this);	
    },
	
});

return SpatialExtentView;

});