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
		
		console.log(this.model.attributes);
		var mainContent = _.template(datasetsSelection_template, this.model);
		console.log(mainContent);
		var listContent = _.template(datasetsList_template, this.model);
		console.log(listContent);
		
		this.$el.append(mainContent);
		this.$el.find("#datasetListContainer").append(listContent);
		this.$el.find("#datasetListContainer").trigger('create');
		this.$el.trigger('create');
		this.mainView.$el.ngeowidget('update');
		
		//iterate on all the combo boxes identifiers and bind the event handler which will generate 
		//a regExp : "\b(criteria_1,criteria_2,...., criteria_n,[^"]*,[^"]*)
		//the two last elements are the dataset identifier and the items 
		//.* was not uses because it covers the caracter '"' and so the filtering is not correct.
		//to cover the all the values (especially "") the expression : ([^"]*|"") is used.
		
		_.each(self.model.attributes.criteria, function(criterion, index){
			
			//bind a change event handler to the select id
			$("#"+ criterion.criterionName).change(function(event){

				var string = '';
				
				_.each(self.model.attributes.criteria, function(otherCriterion, i){
					
					if (i == 0){
						string = string + '\\b(';
					}

					console.log($("#"+ otherCriterion.criterionName).val());
					
					if ($("#"+ otherCriterion.criterionName).val() != ''){
						string = string + $("#"+ otherCriterion.criterionName).val() + ',';
					}else{
						string = string + '([^"]*|""),'
					}
	
					if (i == self.model.attributes.criteria.length-1){
						string = string + '[^"]*,[^"]*)'
					}					
					
					console.log(string);
				});				
				
				console.log("created string from select boxes"); 
				console.log(string);
				
				//filter the datasets according to the selected parameters reg exp
				//the datsets filtred as stored in the model
				self.model.filter(string);
				self.updateDatasetsList();
			});
		});		
		
		this.delegateEvents();
		
		return this;
	},
	
	/** update only the list of datasets in the view */
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