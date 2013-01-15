define( ['jquery', 'backbone', 'search/model/datasetSearch',
         'text!search/template/datasetsSelectionContent_template.html', 'text!search/template/datasetsListContent_template.html'], 
		function($, Backbone, DatasetSearch, datasetsSelection_template, datasetsList_template) {

/**
 * The related model is DatasetsPopulationModel
 */
var DatasetSelectionView = Backbone.View.extend({

	/**
	 * Id for view div container
	 */
	id: 'datasetSelection',
	
	/**
	 * Events to manage on the view
	 */
	events : {
	
		'click li' : function(event){
			
			var $target = $(event.currentTarget);
			
			// Manage single selection of dataset
			// TODO : need to manage multi-selection later
			if ( $target.hasClass('ui-btn-active') ) {
				$target.removeClass('ui-btn-active');
				this.selectedDatasetId = undefined;
				DatasetSearch.set("datasetId",undefined);				
				
			} else {
				this.$el.find('.ui-btn-active').removeClass('ui-btn-active');
				$target.addClass('ui-btn-active');
				this.selectedDatasetId = event.currentTarget.id;
				DatasetSearch.set("datasetId", this.selectedDatasetId);
			}
		}
	},
	
	/**
	 * Render the view
	 */
	render: function(){
		
		//if datasets array has no items that means that the server has sent a response
		//since the fetch was a success (it is called from the dataseSelection widget).
		//However, there was problem since the datsets were not created. 
		if (this.model.get("datasets").length == 0){
			$(this.el).append("<p>Error: There was a problem when creating the datasets.<p>");
			return this;		
		}
		var self = this;
		
		var mainContent = _.template(datasetsSelection_template, this.model);
		var listContent = _.template(datasetsList_template, this.model);
		
		this.$el.append(mainContent);
		this.$el.find("#datasetListContainer").append(listContent);
		this.$el.trigger('create');
		
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

					//console.log($("#"+ otherCriterion.criterionName).val());
					
					if ($("#"+ otherCriterion.criterionName).val() != ''){
						string = string + $("#"+ otherCriterion.criterionName).val() + ',';
					}else{
						string = string + '([^"]*|""),'
					}
	
					if (i == self.model.attributes.criteria.length-1){
						string = string + '[^"]*,[^"]*)'
					}					
				});				
				
				//console.log("created string from select boxes"); 
				//console.log(string);
				
				//filter the datasets according to the selected parameters reg exp
				//the datsets filtred as stored in the model
				self.model.filter(string);
				self.updateDatasetsList();
			});
		});		
		
		return this;
	},
	
	/** 
	 * Update only the list of datasets in the view 
	 */
	updateDatasetsList : function(){
		var $dslListContainer = this.$el.find("#datasetListContainer")
		$dslListContainer.empty();
		$dslListContainer.unbind();
		var listContent = _.template(datasetsList_template, this.model);
		$dslListContainer.append(listContent);
		$dslListContainer.trigger('create');
	},
		
});

return DatasetSelectionView;

});