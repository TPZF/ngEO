define( ['jquery', 'backbone', 'search/view/spatialExtentView', 'search/view/timeExtentView',
		 'search/view/advancedSearchView', 'search/view/downloadOptionsView', 'search/view/openSearchURLView', 'search/model/dataSetPopulation'], 
		function($, Backbone, SpatialExtentView, TimeExtentView, 
				 AdvancedSearchView, DownloadOptionsView, OpenSearchURLView, DataSetPopulation) {

/**
 * Basic search view designed to contain the common parts between StandingOrder or SearchCriteriaView
 * So the backbone for this view can be : DatasetSearch or StandingOrder respectively
 */
var SearchView = Backbone.View.extend({

	initialize: function() {

		this.listenTo(DataSetPopulation, 'select', this.onDatasetSelected );
		this.listenTo(DataSetPopulation, 'unselect', this.onDatasetUnselected );

		// Table containing the views which are dynamically added depending on selected datasets
		this.datasetDependingViews = {};
	},

	/**
	 *	Add advanced & download options block on dataset select
	 */
	onDatasetSelected: function(dataset) {

		// Advanced search view
		var advancedCriteriaView = new AdvancedSearchView({  
			model : this.model,
			dataset : dataset
		});
		this.$el.find("#sc-advanced-container").append(advancedCriteriaView.el);
		advancedCriteriaView.render();

		// Download options view
		var downloadOptionsView = new DownloadOptionsView({
			model : this.model,
			dataset : dataset
		});
		this.$el.find("#sc-downloadOptions-container").append(downloadOptionsView.el);
		downloadOptionsView.render();

		// Store these views to be able to remove later
		this.datasetDependingViews[dataset.get("datasetId")] = [ advancedCriteriaView, downloadOptionsView ];
	},

	/**
	 *	Remove advanced & download options block on dataset unselect
	 */
	onDatasetUnselected: function(dataset) {

		var datasetId = dataset.get("datasetId");
		for ( var i=0; i<this.datasetDependingViews[datasetId].length; i++ ) {
			var viewToRemove = this.datasetDependingViews[datasetId][i];
			viewToRemove.remove();
		}
		delete this.datasetDependingViews[datasetId];
	},

	/**
	 * Call to set the height of content when the view size is changed
	 */
	updateContentHeight: function() {
		this.$el.find('#sc-content').css('height', this.$el.height() - this.$el.find('#sc-footer').outerHeight() );
	},
	
	/**
	 * Call when the view is shown
	 */
	onShow: function() {
		this.updateContentHeight();
	},

	/**
	 * Refresh the view : only for views that does not listen to model changes (for performance reasons)
	 */
	refresh: function() {
		for ( var x in this.datasetDependingViews ) {
			for ( var i; i<this.datasetDependingViews[x].length; i++ ) {
				this.datasetDependingViews[x][i].render();
			}
		}
	},
	
	/**
	 * Render the view
	 */
	render: function(){
			
		// Create the views for each criteria : time, spatial and opensearch url view
		this.dateCriteriaView = new TimeExtentView ({
			el : this.$el.find("#date"), 
			hasTimeSlider : true,
			model : this.model
		});
		this.dateCriteriaView.render();
			
		this.areaCriteriaView = new SpatialExtentView({
			el : this.$el.find("#area"), 
			searchCriteriaView : this,
			model : this.model
		});
		this.areaCriteriaView.render();
		
		// OpenSearch URL view
		this.openSearchURLView = new OpenSearchURLView({
			el: this.$el.find("#osUrl"), 
			model : this.model
		});
		this.openSearchURLView.render();
		
		this.$el.trigger('create');
									
		return this;
	}
	
});

return SearchView;

});