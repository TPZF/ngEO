
define(["jquery", "logger", "userPrefs", "menubar", "search/model/datasetSearch", 
        "dataAccess/model/standingOrderDataAccessRequest", "dataAccess/widget/standingOrderWidget", "search/widget/datasetSelection",
		"search/widget/searchCriteria"], 
	function($, Logger, UserPrefs, MenuBar, DatasetSearch, StandingOrderDataAccessRequest, StandingOrderWidget,
			DataSetSelectionWidget, SearchCriteriaWidget) {

return {
	
	/**
	 * Initialize the search component for data-services-area.
	 *
	 * @param element 	The root element of the data-services-area
	 * @param router 	The data-services-area router
	 */
	initialize: function(element, router) {
	
		// Create widgets
		DataSetSelectionWidget(element);
		var searchWidget = SearchCriteriaWidget.create(element);		
			
		router.route(
				"data-services-area/search/:datasetId?:query", 
				"search", function(datasetId, query) {
				
						
			//set the attribute when the dataset has been loaded in order be sure that the criteria has been loaded
			//and not overwrite the start/stop dates 
			DatasetSearch.once("change:dataset", function(dataset) {
			
				if ( dataset ) {
				
					DatasetSearch.populateModelfromURL(query);
					
					MenuBar.showPage("data-services-area");
					
					//refresh the search widget after the model has been update
					SearchCriteriaWidget.refresh();
					searchWidget.ngeowidget("show");
					
				} else {

					Logger.error('Cannot load the dataset ' + datasetId + '.<br> The search cannot be shared.');
					MenuBar.showPage("data-services-area");
					
				}
			});
			
			// Set the datasetId from the URL, the dataset will be loaded, and if exists it will be initialized
			DatasetSearch.set({"datasetId" : datasetId});

		});
		
		//Route standing order url
		router.route(
				"data-services-area/sto/:datasetId?:query", 
				"sto", function(datasetId, query) {		
									
			//set the attribute when the dataset has been loaded in order be sure that the criteria has been loaded
			//and not overwrite the start/stop dates 
			DatasetSearch.once("change:dataset", function(dataset) {
				
				if ( dataset ) {

					DatasetSearch.populateModelfromURL(query);
					StandingOrderDataAccessRequest.populateModelfromURL(query);
				
					//Display the STO widget
					MenuBar.showPage("data-services-area");
									
					var standingOrderWidget = new StandingOrderWidget();
					standingOrderWidget.open();			
					
				} else {
				
					Logger.error('Cannot load the dataset ' + datasetId + '.<br> The standing order cannot be shared.');
					MenuBar.showPage("data-services-area");
					
				}
			});
			
			// Set the datasetId from the URL, the dataset will be loaded, and if exists it will be initialized
			DatasetSearch.set({"datasetId" : datasetId});
			
		});
		
		// Set the default route
		router.route(
			"data-services-area", "dsa", function() {

				//select the dataset id stored in the prefs
				var datasetId = UserPrefs.get("Dataset");
				if (datasetId && datasetId != "None") {
							
					//when the dataset selected cannot be loaded, display an error message
					DatasetSearch.once("change:dataset", function(dataset){
						if (!dataset) {
							Logger.error('Cannot load the dataset :' + datasetId + ' from user preferences.');
						}
					});

					//set the selected dataset in the model
					DatasetSearch.set("datasetId", datasetId);
				}
				
				// Show the page
				MenuBar.showPage("data-services-area");			
						
		});
			
		// Display a message about dataset in the map, and save user preferences
		DatasetSearch.on('change:datasetId', function(model) {
			var datasetId = model.get('datasetId');
			if ( datasetId ) {
				$('#datasetMessage').html( "Current dataset : " + model.get('datasetId') );
				UserPrefs.save("Dataset", datasetId);
			} else {
				$('#datasetMessage').html( "Current dataset : None" );
				UserPrefs.save("Dataset", "None");
			}
		});				
	

	},
};

});
