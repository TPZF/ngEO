
define(["jquery", "logger", "userPrefs", "ui/menubar", "search/model/datasetSearch", "search/model/dataSetPopulation", "search/model/datasetAuthorizations", "searchResults/model/searchResults", 
        "dataAccess/model/standingOrderDataAccessRequest", "search/view/datasetSelectionView",
		"search/view/searchCriteriaView", "search/model/standingOrder", "search/view/standingOrderView"], 
	function($, Logger, UserPrefs, MenuBar, DatasetSearch, DataSetPopulation, DataSetAuthorizations, SearchResults, StandingOrderDataAccessRequest,
			DataSetSelectionView, SearchCriteriaView, StandingOrder, StandingOrderView) {
			
return {
	
	/**
	 * Initialize the search component for data-services-area.
	 *
	 * @param element 	The root element of the data-services-area
	 * @param router 	The data-services-area router
	 */
	initialize: function(element, router, panelManager) {
			
		// Create the main search view
		var datasetView = new DataSetSelectionView({
			model : DataSetPopulation 
		});
		
		var onDatasetPopulationLoaded = function() {
			panelManager.on('leftResized', datasetView.updateContentHeight, datasetView );
			panelManager.left.add( datasetView, '#dataset' );
			datasetView.render();
		};
		
		// Fetch population and authorization from the server
		var dspXHR = DataSetPopulation.fetch();
		var dsaXHR = DataSetAuthorizations.fetch();
		
		$.when( dspXHR, dsaXHR ).then(
			// Success
			onDatasetPopulationLoaded,
			// Error
			function() {
				if ( dsaXHR.state() == "rejected"  ) {
					Logger.error('Cannot retreive the DataSet Authorizations from the server');
					dspXHR.done( onDatasetPopulationLoaded );
				} else {
					$("#dataset").addClass('ui-disabled');
					Logger.error('Cannot retreive the DataSetPopulationMatrix and/or DataSet Authorizations from the server');
				}
			}
		);
		
		// Create the view and append it to the panel manager
		var searchView = new SearchCriteriaView({
			model : DatasetSearch,
		});
			
		// Create the model for standing order		
		var standingOrder = new StandingOrder();

		// Create the standing order view and append it to the panel manager
		var standingOrderView = new StandingOrderView({
			model: standingOrder
		});

		panelManager.on('leftResized', searchView.updateContentHeight, searchView );
		panelManager.left.add( searchView, '#search' );
		panelManager.left.add( standingOrderView, '#subscribe' );
		searchView.render();
		standingOrderView.render();
			
		router.route(
				"data-services-area/search/:datasetId?:query", 
				"search", function(datasetId, query) {
			
			// Show the page first
			MenuBar.showPage("data-services-area");
						
			//set the attribute when the dataset has been loaded in order be sure that the criteria has been loaded
			//and not overwrite the start/stop dates 
			DatasetSearch.once("change:dataset", function(dataset) {
			
				if ( dataset ) {
													
					DatasetSearch.populateModelfromURL(query);
					
					searchView.displayDatasetRelatedViews( DatasetSearch.dataset );
					
					// Show search panel
					$('#search').click();
					
					// And launch the search!
					SearchResults.launch( DatasetSearch.getOpenSearchURL() );
					
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
									
			// Show the page first
			MenuBar.showPage("data-services-area");
			
			// Once DatasetSearch has been loaded, populate standing order's model
			standingOrder.once("change:dataset", function(dataset) {
				
				if ( dataset ) {
					
					StandingOrderDataAccessRequest.populateModelfromURL(query, standingOrder);
					standingOrder.populateModelfromURL(query);
					standingOrderView.displayDatasetRelatedViews( standingOrder );

					// Show standing order panel
					$('#subscribe').click();
					
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
			$('#subscribe').addClass('ui-disabled');
		}		
			
		// Display a message about dataset in the map, and save user preferences
		DatasetSearch.on('change:datasetId', function(model) {
			var datasetId = model.get('datasetId');
			if ( datasetId ) {
				$('#datasetMessage').html( "Dataset : " + datasetId );
				UserPrefs.save("Dataset", datasetId);
			} else {
				$('#datasetMessage').html( "Dataset : None" );
				UserPrefs.save("Dataset", "None");
			}
			
			// Activate search button or not if datasetsearch is ok
			if ( !datasetId || datasetId == '' ) {
				$('#subscribe').addClass('ui-disabled');
				$('#search').addClass('ui-disabled');
			} else {
				$('#subscribe').removeClass('ui-disabled');
				$('#search').removeClass('ui-disabled');
			}			
		});				
	

	},
};

});
