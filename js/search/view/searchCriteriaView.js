

define( ['jquery', 'backbone', 'configuration', 'logger', 'searchResults/model/searchResults', 'search/view/spatialExtentView',
         'search/view/timeExtentView',  'search/view/advancedSearchView', 'search/view/downloadOptionsView', 'search/view/corrInterView', 'search/view/openSearchURLView', 'search/model/dataSetPopulation', 'search/view/searchView',
         'ui/sharePopup',
         'text!search/template/searchCriteriaContent_template.html'], 
		function($, Backbone, Configuration, Logger, SearchResults, SpatialExtentView, TimeExtentView, 
				 AdvancedSearchView, DownloadOptionsView, CorrInterView, OpenSearchURLView, DataSetPopulation, SearchView, SharePopup,
				 searchCriteria_template) {

/**
 * The model for this view is a backbone model : DatasetSearch 
 */
var SearchCriteriaView = SearchView.extend({

	/**
	 * Id for view div container
	 */
	id: "datasetSearchCriteria",

	events: {		
		// Click on search
		"click .scSubmit": function(event) {
			var rangeIsValid = this.model.get("start") <= this.model.get("stop");
			if ( rangeIsValid )
			{
				SearchResults.launch( this.model );
			}
			else
			{
				// Prevent user that the range isn't valid
				$("#dateWarningPopup")
					.popup("open");
			}
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
		if ( this.model.isInterferometrySupported() ) {
		
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
		SearchView.prototype.onShow.apply(this);
	},
	
	/**
	 * Render the view
	 */
	render: function(){
		
		var content = _.template(searchCriteria_template, {
			submitText: "Search",
			useDate: true
		});
		this.$el.append(content);
		
		SearchView.prototype.render.apply(this);
		
		// Update the date view when the dateRange is changed
		this.dateCriteriaView.listenTo( this.model, "change:dateRange", this.dateCriteriaView.updateDateRange);
									
		return this;
	}
	
});

return SearchCriteriaView;

});