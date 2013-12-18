

define( ['jquery', 'backbone', 'configuration', 'logger', 'searchResults/model/searchResults', 'search/view/spatialExtentView',
         'search/view/timeExtentView',  'search/view/advancedSearchView', 'search/view/downloadOptionsView', 'search/view/corrInterView', 'search/view/openSearchURLView',
         'ui/sharePopup',
         'text!search/template/searchCriteriaContent_template.html'], 
		function($, Backbone, Configuration, Logger, SearchResults, SpatialExtentView, TimeExtentView, 
				 AdvancedSearchView, DownloadOptionsView, CorrInterView, OpenSearchURLView, SharePopup,
				 searchCriteria_template) {

/**
 * The model for this view is a backbone model : DatasetSearch 
 */
var SearchCriteriaView = Backbone.View.extend({

	/**
	 * Id for view div container
	 */
	id: "datasetSearchCriteria",

	events: {		
		// Click on search
		"click .scSubmit": function(event) {
			SearchResults.launch( this.model );
		},
					
		// To share a search
		"click #share" : function() {
			SharePopup.open({
				url: Configuration.serverHostName + (window.location.pathname) + this.model.getSharedSearchURL(),
				positionTo: this.$el.find('#share')[0]
			});
		},
		
		// To change the mode between simple, correlation and interferometry
		"change #sc-mode": function() {
			var value = this.$el.find('#sc-mode').val();
			
			// Remove previous accordion and view if any
			this.$el.find('#sc-corrinf-container').remove();
			if ( this.corrInterView ) {
				this.corrInterView.remove();
				this.corrInterView = null;
			}
			
			//this.model.set("mode",value);
			this.model.setMode(value);
			
			// Add the accordion for correlation/inteferometry
			if ( value != "Simple" ) {
				 this.$el.find('#sc-area-container').after(
					'<div id="sc-corrinf-container" data-role="collapsible" data-inset="false" data-mini="true">\
						<h3>' + value + '</h3>\
						<div id="sc-corrinf">	</div>\
					</div>'				 
				);
				
				this.corrInterView = new CorrInterView({
					el : this.$el.find("#sc-corrinf"), 
						model : this.model });
				this.corrInterView.render();

			}			
			this.$el.find('#sc-content').trigger('create');

		},
	},
		
	/**
	 * Update the Select to choose the search mode (Simple, Correlation or Interferometry)
	 */
	updateSelectMode: function() {
	
		this.$el.find('#sc-corrinf-container').remove();
		this.$el.find('#sc-mode-containter').remove();
		
		// Only interferometry supported for Task4
		//if ( this.model.datasetIds.length > 1 && this.model.datasetIds.length <= 4 ) {
		if ( this.model.datasetIds.length == 2 ) {
		
			var $mode = $('<div id="sc-mode-containter" data-role="fieldcontain">\
				<label for="sc-mode">Mode: </label>\
				<select id="sc-mode" data-mini="true">\
					<option value="Simple">Simple</option>\
					<option value="Interferometry">Interferometry</option>\
				</select>\
			</div>');
			
			/*// Check correlation and interferometry
			if ( this.model.datasetIds.length == 2 ) {
				$mode.find('#sc-mode').append('<option value="Interferometry">Interferometry</option>');
			}*/
			
			this.$el.find('#sc-content')
				.prepend($mode)
				.trigger('create');
		}

	},

	/**
	 * Call when the view is shown
	 */
	onShow: function() {
		this.updateSelectMode();
		this.updateContentHeight();
	},
	
	/**
	 * Call to set the height of content when the view size is changed
	 */
	updateContentHeight: function() {
		this.$el.find('#sc-content').css('height', this.$el.height() - this.$el.find('#sc-footer').outerHeight() );
	},
	
	/**
	 * Refresh the view : only for views that does not listen to model changes (for performance reasons)
	 */
	refresh: function() {
		this.advancedCriteriaView.render();
		this.downloadOptionsView.render();
	},
	
	/**
	 * Render the view
	 */
	render: function(){
	
		var content = _.template(searchCriteria_template, { submitText: "Search", useDate: true});
		this.$el.append(content);			
		
		// Create the views for each criteria : time, spatial, advanced and for download options
		this.dateCriteriaView = new TimeExtentView ({
			el : this.$el.find("#date"), 
			hasTimeSlider : true,
			model : this.model
			});
		this.dateCriteriaView.render();
		
		// Update the date view when the dateRange is changed
		this.dateCriteriaView.listenTo( this.model, "change:dateRange", this.dateCriteriaView.updateDateRange);						
			
		this.areaCriteriaView = new SpatialExtentView({
			el : this.$el.find("#area"), 
			searchCriteriaView : this,
			model : this.model });
		this.areaCriteriaView.render();
		
		this.advancedCriteriaView = new AdvancedSearchView({
			el : this.$el.find("#searchCriteria"), 
			model : this.model});
		this.advancedCriteriaView.render();
		
		//add download options view as a tab
		this.downloadOptionsView = new DownloadOptionsView({
			el : this.$el.find("#downloadOptions"), 
			model : this.model});
		this.downloadOptionsView.render();
		
		// OpenSearch URL view
		this.openSearchURLView = new OpenSearchURLView({
			el: this.$el.find("#osUrl"), 
			model : this.model });
		this.openSearchURLView.render();
		
		this.$el.trigger('create');
									
		return this;
	}
	
});

return SearchCriteriaView;

});