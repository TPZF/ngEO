var Logger = require('logger');
var UserPrefs = require('userPrefs');
var MenuBar = require('ui/menubar');
var DatasetSearch = require('search/model/datasetSearch');
var DataSetPopulation = require('search/model/dataSetPopulation');
var DataSetAuthorizations = require('search/model/datasetAuthorizations');
var SearchResults = require('searchResults/model/searchResults');
var StandingOrderDataAccessRequest = require('dataAccess/model/standingOrderDataAccessRequest');
var DataSetSelectionView = require('search/view/datasetSelectionView');
var SearchCriteriaView = require('search/view/searchCriteriaView');
var StandingOrder = require('search/model/standingOrder');
var StandingOrderView = require('search/view/standingOrderView');

module.exports = {

	/**
	 * Initialize the search component for data-services-area.
	 *
	 * @param element 	The root element of the data-services-area
	 * @param router 	The data-services-area router
	 */
	initialize: function(element, router, panelManager) {

		// Create the main search view
		var datasetView = new DataSetSelectionView({
			model: DataSetPopulation
		});

		var onDatasetPopulationLoaded = function() {
			$("#dataset").removeClass('ui-disabled');
			panelManager.on('leftResized', datasetView.updateContentHeight, datasetView);
			panelManager.left.add(datasetView, '#dataset');
			datasetView.render();
		};

		// Fetch population and authorization from the server
		var dspXHR = DataSetPopulation.fetch();
		var dsaXHR = DataSetAuthorizations.fetch();

		$.when(dspXHR, dsaXHR).then(
			// Success
			onDatasetPopulationLoaded,
			// Error
			function() {
				if (dsaXHR.state() == "rejected") {
					Logger.error('Cannot retreive the DataSet Authorizations from the server');
					dspXHR.done(onDatasetPopulationLoaded);
				} else {
					$("#dataset").addClass('ui-disabled');
					Logger.error('Cannot retreive the DataSetPopulationMatrix and/or DataSet Authorizations from the server');
				}
			}
		);

		// Create the view and append it to the panel manager
		var searchView = new SearchCriteriaView({
			model: DatasetSearch,
		});

		// Create the model for standing order		
		var standingOrder = new StandingOrder();

		// Create the standing order view and append it to the panel manager
		var standingOrderView = new StandingOrderView({
			model: standingOrder
		});

		panelManager.on('leftResized', searchView.updateContentHeight, searchView);
		panelManager.on('leftResized', standingOrderView.updateContentHeight, standingOrderView);
		panelManager.left.add(searchView, '#search');
		panelManager.left.add(standingOrderView, '#subscribe');
		searchView.render();
		standingOrderView.render();

		router.route(
			"data-services-area/search/:datasetIds?:query",
			"search",
			function(datasetIds, query) {

				// Variable used to count the number of fetched datasets
				var datasetsToBeFetched = datasetIds.split(",").length;

				// Show the page first
				MenuBar.showPage("data-services-area");

				// On dataset fetch callback
				var onFetch = function(dataset, status) {

					var datasetId = dataset.get('datasetId');
					if (status == "SUCCESS") {
						DatasetSearch.populateModelfromURL(query, datasetId);

						// Resfreh the view
						searchView.refresh();

						// Show search panel only if not already opened
						if (!$('#search').hasClass('toggle')) {
							$('#search').click();
						}

						// And launch the search!
						SearchResults.launch(DatasetSearch);

					} else {

						Logger.error('Cannot load the dataset ' + datasetId + '.<br> The search cannot be shared.');
						MenuBar.showPage("data-services-area");

					}

					// Unsubscribe onFetch event once there are no more shared datasets
					// to initialize
					if (--datasetsToBeFetched == 0) {
						DataSetPopulation.off("datasetFetch", onFetch);
					}
				}

				//set the attribute when the dataset has been loaded in order be sure that the criteria has been loaded
				//and not overwrite the start/stop dates 
				DataSetPopulation.on("datasetFetch", onFetch);

				// Select & fetch all shared datasets
				_.each(datasetIds.split(","), function(id) {
					DataSetPopulation.select(id);
				});
			});

		// Route standing order url
		router.route(
			"data-services-area/sto/:datasetId?:query",
			"sto",
			function(datasetId, query) {

				// Show the page first
				MenuBar.showPage("data-services-area");

				// Once dataset has been loaded, populate standing order's model
				DataSetPopulation.once("datasetFetch", function(dataset, status) {

					if (status == "SUCCESS") {

						StandingOrderDataAccessRequest.populateModelfromURL(query, standingOrder);
						standingOrder.populateModelfromURL(query);

						// Refresh the view
						standingOrderView.refresh();

						// Show standing order panel
						$('#subscribe').click();

					} else {

						Logger.error('Cannot load the dataset ' + dataset + '.<br> The standing order cannot be shared.');
						MenuBar.showPage("data-services-area");

					}
				});

				// Set the datasetId from the URL, the dataset will be loaded, and if exists it will be initialized
				DataSetPopulation.select(datasetId);

			});

		// Set the default route
		router.route(
			"data-services-area", "dsa",
			function() {

				// Select the dataset id stored in the prefs
				var prefsDS = UserPrefs.get("Dataset");
				if (prefsDS && prefsDS != "None" && _.isString(prefsDS)) {

					var datasets = prefsDS.split(',');
					for (var i = 0; i < datasets.length; i++) {
						DataSetPopulation.select(datasets[i]);
					}
				}

				// When the dataset cannot be fetched from the server return an error to warn user
				/* NGEO-727 : no error when the dataset cannot be retrieved
				DataSetPopulation.on("datasetFetch", function(datasetId,status) {
					if ( status == "ERROR" ) {
						Logger.error('Cannot load the dataset ' + datasetId + '.');
					}
				});*/

				// Show the page
				MenuBar.showPage("data-services-area");

			});

		// Update interface when dataset selection has changed
		var onDatasetSelectionChanged = function(dataset) {
			var numDatasets = DatasetSearch.datasetIds.length;
			if (numDatasets == 0) {
				UserPrefs.save("Dataset", "None");

				$('#subscribe').addClass('ui-disabled');
				$('#search').addClass('ui-disabled');
			} else if (numDatasets == 1) {
				UserPrefs.save("Dataset", DatasetSearch.getDatasetPath());

				if (DataSetAuthorizations.hasDownloadAccess(DatasetSearch.getDatasetPath())) {
					$('#subscribe').removeClass('ui-disabled');
				} else {
					$('#subscribe').addClass('ui-disabled');
				}
				$('#search').removeClass('ui-disabled');
			} else {
				UserPrefs.save("Dataset", DatasetSearch.getDatasetPath());
				$('#subscribe').addClass('ui-disabled');
			}
		};

		DataSetPopulation.on("select", onDatasetSelectionChanged);
		DataSetPopulation.on("unselect", onDatasetSelectionChanged);

	},
};