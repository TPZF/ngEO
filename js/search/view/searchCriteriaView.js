

define( ['jquery', 'backbone', 'configuration', 'logger', 'searchResults/model/searchResults', 'search/view/spatialExtentView',
         'search/view/timeExtentView',  'search/view/advancedSearchView', 'search/view/downloadOptionsView', 'search/view/corrInterView',
         'ui/sharePopup',
         'text!search/template/searchCriteriaContent_template.html'], 
		function($, Backbone, Configuration, Logger, SearchResults, SpatialExtentView, TimeExtentView, 
				 AdvancedSearchView, DownloadOptionsView, CorrInterView, SharePopup,
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
		// Update the search criteria from the OpenSearch URL
		"blur #osUrlText": function(event) {
			var newUrl = $(event.currentTarget).val();
			var prevUrl = Configuration.serverHostName + this.model.getOpenSearchURL();
			if ( newUrl != prevUrl ) {
				this.applyOpenSearchUrl(newUrl);
			}
		},
		
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
			
			this.model.set("mode",value);
			
			// Add the accordion for correlation/inteferometry
			if ( value != "Simple" ) {
				 this.$el.find('#sc-advanced-container').after(
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
	 * Update the opensearch URL
	 */
	displayOpenSearchURL: function() {
		var url = this.model.getOpenSearchURL();
		this.$el.find("#osUrlText").val( url );	
	},
	
	/**
	 * Constructor
	 */
	initialize : function() {
		this.listenTo( this.model, 'change:numDatasets', this.updateSelectMode );
	},
	
	/**
	 * Update the Select to choose the search mode (Simple, Correlation or Interferometry)
	 */
	updateSelectMode: function() {
	
		this.$el.find('#sc-corrinf-container').remove();
		this.$el.find('#sc-mode-containter').remove();
		
		if ( this.model.numDatasets > 1 && this.model.numDatasets <= 4 ) {
		
			var $mode = $('<div id="sc-mode-containter" data-role="fieldcontain">\
				<label for="sc-mode">Mode: </label>\
				<select id="sc-mode" data-mini="true">\
					<option value="Simple">Simple</option>\
					<option value="Correlation">Correlation</option>\
				</select>\
			</div>');
			
			// Check correlation and interferometry
			if ( this.model.numDatasets == 2 ) {
				$mode.find('#sc-mode').append('<option value="Interferometry">Interferometry</option>');
			}
			
			this.$el.find('#sc-content')
				.prepend($mode)
				.trigger('create');
		}

	},
		
	/**
	 * Apply a new OpenSearch URL to the view
	 */
	applyOpenSearchUrl: function(newUrl) {
	
		try {
			// Check if url is ok
			var re = new RegExp('^'  + Configuration.serverHostName + Configuration.baseServerUrl + '/catalogue/([^/]+)/search\\?(.+)');
			var m  = re.exec(newUrl);
			if ( m ) {
				// Url is ok, check if we need to change the dataset
				var datasetId = m[1];
				var currentDatasetId = this.model.get("datasetId");
				
				if ( datasetId == currentDatasetId ) {
					// Directly populate the DatasetSearch with the URL parameters
					this.model.populateModelfromURL( m[2] );
				} else {
					// First wait for the new dataset to be loaded, otherwise fallback to previous dataset, and do not update the parameters
					this.model.once('change:dataset', function(dataset) {
						if ( dataset ) {
							this.model.populateModelfromURL( m[2] );
						} else {
							Logger.error("Invalid OpenSearch URL : cannot load the dataset " + datasetId + ".");
							this.model.set('datasetId', currentDatasetId);
						}
					}, this);
					this.model.set('datasetId', datasetId);
				}
			} else {
				Logger.error("Invalid OpenSearch URL.");
			}
			
		} catch (err) {
			Logger.error("Invalid OpenSearch URL : " + err);
		}
		
	},
	
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
		this.$el.find('#sc-content').css('height', this.$el.height() - this.$el.find('#sc-footer').outerHeight() );
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
			searchCriteriaView : this,
			model : this.model
			});
		this.dateCriteriaView.render();

		// Append time slider
		this.$el.find('#date').append('<label class="useTimeSliderLabel">Use Time Slider<input type="checkbox" '+ (this.model.get('useTimeSlider') ? "checked" : "") +' class="useTimeSliderCheckBox" data-mini="true" data-theme="c"></label>');
			
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
		
		this.$el.trigger('create');
		
		// Refresh the OpenSearch URL when the textarea is visible
		var self = this;
		this.$el.find('#osUrl')
			.bind('collapse', function() {
					self.stopListening( self.model, 'change', self.displayOpenSearchURL );
				})
			.bind('expand', function() {
					self.displayOpenSearchURL();
					self.listenTo( self.model, 'change', self.displayOpenSearchURL );
				});
									
		return this;
	}
	
});

return SearchCriteriaView;

});