

define( ['jquery', 'backbone', 'configuration', 'logger', 'search/model/dataSetPopulation'], 
		function($, Backbone, Configuration, Logger, DataSetPopulation) {

/**
 * The model for this view is a backbone model : SearchCriteria 
 */
var OpenSearchURLView = Backbone.View.extend({

	events: {
		// Update the search criteria from the OpenSearch URL
		"blur #osUrlText": function(event) {
			var newUrl = $(event.currentTarget).val();
			var prevUrl = this.model.getOpenSearchURL();
			if ( newUrl != prevUrl ) {
				this.applyOpenSearchUrl(newUrl);
			}
		}
	},
	
	/**
	 * Update the opensearch URL
	 */
	displayOpenSearchURL: function() {
		var url = this.model.getOpenSearchURL();
		this.$el.find("#osUrlText").val( url );	
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
				var currentDatasetId = this.model.getDatasetPath();
				
				if ( datasetId == currentDatasetId ) {
					// Directly populate the DatasetSearch with the URL parameters
					this.model.populateModelfromURL( m[2] );
				} else {
					// First wait for the new dataset to be loaded, otherwise fallback to previous dataset, and do not update the parameters
					DataSetPopulation.once("datasetFetch", function(dataset, status) {
						if ( status == "SUCCESS" ) {
							this.model.populateModelfromURL( m[2] );
						} else {
							Logger.error("Invalid OpenSearch URL : cannot load the dataset " + datasetId + ".");
							this.model.set('datasetId', currentDatasetId);
						}
					}, this);
					DataSetPopulation.selectExclusive(datasetId);
				}
			} else {
				Logger.error("Invalid OpenSearch URL.");
			}
			
		} catch (err) {
			Logger.error("Invalid OpenSearch URL : " + err);
		}
		
	},
	
	/**
	 * Render the view
	 */
	render: function(){
		
		// Refresh the OpenSearch URL when the accordion is expand/collapse
		var self = this;
		this.$el.parent()
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

return OpenSearchURLView;

});