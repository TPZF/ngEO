
define(["jquery", "logger", "userPrefs", "ui/menubar", "search/model/datasetSearch", "search/model/dataSetPopulation", 
        "dataAccess/model/standingOrderDataAccessRequest", "dataAccess/widget/standingOrderWidget", "search/view/datasetSelectionView",
		"search/view/searchCriteriaView"], 
	function($, Logger, UserPrefs, MenuBar, DatasetSearch, DataSetPopulation, StandingOrderDataAccessRequest, StandingOrderWidget,
			DataSetSelectionView, SearchCriteriaView) {

return {
	
	/**
	 * Initialize the search component for data-services-area.
	 *
	 * @param element 	The root element of the data-services-area
	 * @param router 	The data-services-area router
	 */
	initialize: function(element, router, panelManager) {
	
		// Create the model for DataSetPopulation
		var datasetPopulation = new DataSetPopulation();
		
		// Create the main search view
		var datasetView = new DataSetSelectionView({
			model : datasetPopulation 
		});
		
		// The dataset population is fetch only at the beginning for the moment
		// It was called every time the search widget was shown before, but it can trigger a bug!
		datasetPopulation.fetch({
			success: function() {
								
				panelManager.left.add( datasetView, '#dataset' );
				datasetView.render();
				
			},//when the fetch fails display an error message and disable the datasets "button"
			// so the application is still usable and the user can still see the other menus.
			error: function(){
				$("#dataset").addClass('ui-disabled');
				Logger.error('Cannot retreive the DataSetPopulationMatrix from the server');
			}
		});	
		
		// Create the view and append it to the panel manager
		var searchView = new SearchCriteriaView({
			model : DatasetSearch,
		});
		panelManager.on('leftResized', searchView.updateContentHeight, searchView );
		panelManager.left.add( searchView, '#search' );
		searchView.render();	
		
			
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
					
					// Show search panel
					$('#search').click();
					
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
		
		// Disable search criteria and result buttons if there is no dataset selected
		if ( !DatasetSearch.get('datasetId') || DatasetSearch.get('datasetId') == '' ) {
			$('#search').addClass('ui-disabled');
		}		
			
		// Display a message about dataset in the map, and save user preferences
		DatasetSearch.on('change:datasetId', function(model) {
			var datasetId = model.get('datasetId');
			if ( datasetId ) {
				$('#datasetMessage').html( "Current dataset : " + datasetId );
				UserPrefs.save("Dataset", datasetId);
			} else {
				$('#datasetMessage').html( "Current dataset : None" );
				UserPrefs.save("Dataset", "None");
			}
			
			// Activate search button or not if datasetsearch is ok
			if ( !datasetId || datasetId == '' ) {
				$('#search').addClass('ui-disabled');
			} else {
				$('#search').removeClass('ui-disabled');
			}			
		});				
	

	},
};

});
