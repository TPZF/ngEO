define( ['jquery', 'backbone', 'underscore', 
         'text!search/template/datasetsSelectionContent_template.html', 'text!search/template/datasetsListContent_template.html'], 
		function($, Backbone, _ , datasetsSelection_template, datasetsList_template) {

	/**
	 * The related model is DatasetsPopulationModel
	 */
	
var DatasetSelectionView = Backbone.View.extend({

	initialize : function(options){

		this.mainView = options.mainView;
		this.model.on("change", this.render, this);
		//this.model.on("change:datasetsToDisplay", this.updateDatasetsList, this);
	},
	
	events : {
	
		'click li' : function(event){
			
			var $target = $(event.currentTarget);
			
			// Manage single selection of dataset
			// TODO : need to manage multi-selection later
			if ( $target.hasClass('ui-btn-active') ) {
				$target.removeClass('ui-btn-active');
				this.selectedDatasetId = undefined;
				this.nextButton.button('disable');
			} else {
				this.$el.find('.ui-btn-active').removeClass('ui-btn-active');
				$target.addClass('ui-btn-active');
				this.selectedDatasetId = event.currentTarget.id;
				this.nextButton.button('enable');
			}
		}
	},
	
	render: function(){
	
		// TODO : display loading image
		if (this.model.get("datasets").length == 0){
			// $(this.el).append("<p>loading datasets...<p>");
			console.log("Not loaded!!!");
			return this;
			
		}
		
		// Add a next button in the widget footer
		this.nextButton = this.mainView.$el.ngeowidget('addButton', { id: 'next', name: 'Next', position: 'right' });
		var self = this;
		this.nextButton.click( function() {
			self.mainView.displaySearchCriteria(self.selectedDatasetId);
		});
		// Next button is disable when no dataset is selected
		this.nextButton.button('disable');
		
		var mainContent = _.template(datasetsSelection_template, this.model);
		console.log(mainContent);
		var listContent = _.template(datasetsList_template, this.model);
		console.log(listContent);
		//console.log ("content of the dataset selection div : ");
		//console.log(content);
		
		this.$el.append(mainContent);
		this.$el.find("#datasetListContainer").append(listContent);
		this.$el.find("#datasetListContainer").trigger('create');
		this.$el.trigger('create');
		this.mainView.$el.ngeowidget('update');
		
		$("#missions").change(function(event){
			console.log($(event.currentTarget).val());
			self.model.updateDatasetsWithMission($(event.currentTarget).val());
			self.updateDatasetsList();
		});
		
		$("#sensors").change(function(event){
			console.log($(event.currentTarget).val());
			self.model.updateDatasetsWithSensor($(event.currentTarget).val());
			self.updateDatasetsList();
		});
		
		$("#keywords").change(function(event){
			console.log($(event.currentTarget).val());
			self.model.updateDatasetsWithKeyword($(event.currentTarget).val());
			self.updateDatasetsList();
		});
		
		
		this.delegateEvents();
		
		return this;
	},
	
	updateDatasetsList : function(){
		this.$el.find("#datasetListContainer").empty();
		this.$el.find("#datasetListContainer").unbind();
		var listContent = _.template(datasetsList_template, this.model);
		this.$el.find("#datasetListContainer").append(listContent);
		this.$el.find("#datasetListContainer").trigger('create');
	},

	// TODO move to Backbone.View.prototype
    close : function() {
       this.undelegateEvents();
	   this.mainView.$el.ngeowidget('removeButton', this.nextButton);
       this.$el.empty();
       if (this.onClose) {
          this.onClose();
       }
    },

    onClose : function() {
    	this.model.off("change", this.render, this);
    },
	
});

return DatasetSelectionView;

});