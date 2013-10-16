define( ['jquery', 'backbone', 'logger', 'search/model/datasetSearch', 'search/model/datasetAuthorizations', 'searchResults/model/searchResults',
         'text!search/template/datasetsSelectionContent_template.html', 'text!search/template/datasetsListContent_template.html'], 
		function($, Backbone, Logger, DatasetSearch, DatasetAuthorizations, SearchResults, datasetsSelection_template, datasetsList_template) {

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
		},
		
		// Click on search
		"click #dsSearch": function(event) {
			SearchResults.launch( DatasetSearch.getOpenSearchURL() );
		}
	},
	
	/**
	 * Constructor
	 */
	initialize: function() {
		this.criteriaFilter = [];
	},
	
	/**
	 * The template used to build the dataset list
	 */
	datasetsListTemplate : _.template(datasetsList_template),
	
	/**
	 * Call when the view is shown
	 */
	onShow: function() {
		this.updateContentHeight();
	},
	
	/**
	 * Call to set the height of content when the view size is changed
	 */
	updateContentHeight: function() {
		this.$el.find('#ds-content').css('height', this.$el.height() - this.$el.find('#ds-footer').outerHeight() );
	},
	
	/**
	 * Render the view
	 */
	render: function(){
		
		//if datasets array has no items that means that the server has sent a response
		//since the fetch was a success (it is called from the dataseSelection widget).
		//However, there was problem since the datsets were not created. 
		if ( !this.model.isValid() ){
			this.$el.append("<p>Error: There was a problem when creating the datasets.<p>");
			return this;		
		}
		
		// Build the main content
		var mainContent = _.template(datasetsSelection_template, this.model);		
		this.$el.append(mainContent);
		
		// Build the criteria select element and datasets list
		this.updateSelectCriteria();
		this.updateDatasetsList();
		
		this.$el.trigger('create');
		
		var self = this;
				
		//iterate on criteria to add a callback when the user selects a new criteria filter
		_.each(self.model.get('criterias'), function(criteria, index){
			
			//bind a change event handler to the select id
			//Fixes the binding after the display of the widget in case of success
			self.$el.find("#criteria_" + index).change(function(event){

				self.criteriaFilter[index] = $(this).val();
				if ( self.criteriaFilter[index] == '' ) {
					self.criteriaFilter[index] = undefined;
				}
				
				// Update datasets list and criteria according to the new criteria filter
				self.updateDatasetsList();
				self.updateSelectCriteria();
			});
		});		
		
		return this;
	},
	
	/**
	 * Update the select element for criterias
	 */
	updateSelectCriteria : function(filterResult) {
	
		// Rebuilt the criterias to select
		var criterias = this.model.get('criterias');
		for ( var i = 0; i < criterias.length; i++ ) {
		
			var $selectCriteria = this.$el.find("#criteria_" + i);
							
			$selectCriteria.empty();
			$selectCriteria.append( '<option value="">' + criterias[i].title + ' : None</option>');
			
			var criteriaValues = this.model.filterCriteriaValues(this.criteriaFilter,i);
			for ( var j = 0; j < criteriaValues.length; j++ ) {
			
				// Add the option to the select element
				var $opt = $( '<option value="' + criteriaValues[j] + '">' + criterias[i].title + ' : ' + criteriaValues[j] + '</option>')
					.appendTo( $selectCriteria );
				
				// Select it if necessary
				if ( this.criteriaFilter[i] == criteriaValues[j] ) {
					$opt.attr('selected','selected');
				}
			}
		}
		
	},
	
	/** 
	 * Update only the list of datasets in the view 
	 */
	updateDatasetsList : function() {
		var datasets = this.model.filterDatasets(this.criteriaFilter);
		var $dslListContainer = this.$el.find("#datasetListContainer")
		var listContent = this.datasetsListTemplate({
			datasets: datasets
		});
		$dslListContainer.html(listContent);	
		$dslListContainer.trigger('create');
		
		// Apply authorization after
		for ( var i = 0; i < datasets.length; i++ ) {
			if ( !DatasetAuthorizations.hasViewAccess( datasets[i].datasetId ) ) {
				$('#' + datasets[i].datasetId).append( '<img src="../images/noview.png" />' );
			} 
			if ( !DatasetAuthorizations.hasDownloadAccess( datasets[i].datasetId ) ) {
				$('#' + datasets[i].datasetId).append( '<img src="../images/nodownload.png" />' );
			}
		}
	
		// Check if the current dataset is still in the list
		var selectedDatasetId = DatasetSearch.get("datasetId");
		if ( selectedDatasetId && selectedDatasetId != "" ) {
			var $elt = $dslListContainer.find('#' + selectedDatasetId);
			if ( $elt.length == 0 ) {
				 DatasetSearch.set("datasetId",undefined)
			} else {
				$elt.addClass('ui-btn-active');
			}
		}
	}
		
});

return DatasetSelectionView;

});