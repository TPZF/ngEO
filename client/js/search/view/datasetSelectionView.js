define( ['jquery', 'backbone', 'underscore', 
         'text!search/template/datasetsSelectionContent_template.html'], 
		function($, Backbone, _ , datasetsList_template) {

	/**
	 * The related model is DatasetsPopulationModel
	 */
	
var DatasetSelectionView = Backbone.View.extend({

	initialize : function(options){

		this.mainView = options.mainView;
		this.model.on("change", this.render, this);
	},
	
	events : {
	
		//handling filters
		'select #missions' : function(){},
		'select #sensors' : function(){},
		'select #keywords' : function(){},
		'click #next' : function(){this.mainView.displaySearchCriteria(this.selectedDatasetId);},
		'click li' : function(event){
			this.selectedDatasetId = event.currentTarget.id;
			$(event.currentTarget).toggleClass('ui-btn-active');
		}
	},
	
	render: function(){
	
		 if (this.model.get("datasets").length == 0){
			// $(this.el).append("<p>loading datasets...<p>");
			return this;
			
		} 
		
		var content = _.template(datasetsList_template, this.model);
		
		//console.log ("content of the dataset selection div : ");
		//console.log(content);
		
		this.$el.append(content);
		this.$el.trigger('create');
		
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
    	this.model.off("loadedDatasets", this.render, this);
    },
	
});

return DatasetSelectionView;

});