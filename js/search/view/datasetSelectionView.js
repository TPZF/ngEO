define( ['jquery', 'backbone', 'search/model/datasetSearch', 'userPrefs',
         'text!search/template/datasetsSelectionContent_template.html', 'text!search/template/datasetsListContent_template.html'], 
		function($, Backbone, DatasetSearch, UserPrefs, datasetsSelection_template, datasetsList_template) {

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
				UserPrefs.save("Dataset", "None");
				
			} else {
				this.$el.find('.ui-btn-active').removeClass('ui-btn-active');
				$target.addClass('ui-btn-active');
				this.selectedDatasetId = event.currentTarget.id;
				DatasetSearch.set("datasetId", this.selectedDatasetId);
				//save the selected dataste id 
				UserPrefs.save("Dataset", this.selectedDatasetId);
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
		
		//select the dataset id stored in the prefs
		var datasetId = UserPrefs.get("Dataset");
		if (datasetId != "None"){
			var selector = "#" + datasetId;
			var datasetObject = this.$el.find(selector);
			//if the dataset is in the list select it unless reset the datset in the preferences and display on error message 
			if (datasetObject){
				//make the dataset list item selected
				datasetObject.addClass('ui-btn-active');
				//set the selected dataset in the model
				DatasetSearch.set("datasetId", datasetId);
			}else{
				//reset the preferences since the dataset set in the preferences is no more in the catalogue
				//and notify the user.
				UserPrefs.save("Dataset", "None");
				$('<div><p>The dataset ' + datasetId + ' stored in the preferences is no more in the catalogue,</p>' + 
				'<p>it cannot be seleted.</p></div>')
				.appendTo('.ui-page-active')
				.popup()
				.popup('open');
			}
		}
		
		var self = this;
		
		//notify the user if the browser does not support local storage
		UserPrefs.on("localStorageException", function(key){
			$('<div><p>Your browser does not support HTML5 local storage.</p>' + 
			'<p>The preferences cannot be stored.</p></div>')
			.appendTo('.ui-page-active')
			.popup()
			.popup('open');
		}); 
		
		//iterate on all the combo boxes identifiers and bind the event handler which will generate 
		//a regExp : "\b(criteria_1,criteria_2,...., criteria_n,[^"]*,[^"]*)
		//the two last elements are the dataset identifier and the items 
		//.* was not uses because it covers the caracter '"' and so the filtering is not correct.
		//to cover the all the values (especially "") the expression : ([^"]*|"") is used.
		
		_.each(self.model.attributes.criteria, function(criterion, index){
			
			//bind a change event handler to the select id
			//Fixes the binding after the display of the widget in case of success
			self.$el.find("#"+ criterion.criterionName).change(function(event){

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
	}
		
});

return DatasetSelectionView;

});