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

var Configuration = require('configuration');

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

		var datasetPopulationCallbacks = [];

		var onDatasetPopulationLoaded = function() {

			// Execute all registered callbacks
			for ( var i=0; i<datasetPopulationCallbacks.length; i++ ) {
				datasetPopulationCallbacks[i]();
			}

			$("#dataset").removeClass('ui-disabled');
			panelManager.on('leftResized', datasetView.updateContentHeight, datasetView);
			panelManager.left.add(datasetView, '#dataset');
			datasetView.render();
		};

		var onDatasetPopulationFailed = function() {
			if (dsaXHR.state() == "rejected") {
				Logger.error('Cannot retreive the DataSet Authorizations from the server');
				dspXHR.done(onDatasetPopulationLoaded);
			} else {
				$("#dataset").addClass('ui-disabled');
				Logger.error('Cannot retreive the DataSetPopulationMatrix and/or DataSet Authorizations from the server');
			}
		};

		// Fetch population and authorization from the server
		var dspXHR = DataSetPopulation.fetch();
		var dsaXHR = DataSetAuthorizations.fetch();

		$.when(dspXHR, dsaXHR).then(
			// Success
			onDatasetPopulationLoaded,
			// Error
			onDatasetPopulationFailed
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
		if (!Configuration.data.subscribe.enable) {
			$('#subscribe').hide();
		}

		// Route search shared url
		router.route(
			"data-services-area/search?:query",
			"search",
			function(query) {
				// Query contains osParameters={...}, substr starting from "{"
				var sharedParameters = JSON.parse(query.substr(query.indexOf("{")));

				// Build dataset ids ta
				var datasetIds = _.keys(_.omit(sharedParameters, "commonCriteria"));

				// Variable used to count the number of fetched datasets
				var datasetsToBeFetched = datasetIds.length;

				// Show the page first
				MenuBar.showPage("data-services-area");

				// On dataset fetch callback
				var onFetch = function(dataset, status) {

					var datasetId = dataset.get('datasetId');
					if (status == "SUCCESS") {

						// Update datasetsearch from common criterias containing date&area + adv&do options of the given dataset
						var currentSharedParameters = sharedParameters['commonCriteria'];

						// Check if dataset has download or advanced options, add to shared params if so
						if ( sharedParameters[datasetId] )
							currentSharedParameters += "&" + sharedParameters[datasetId];
						DatasetSearch.populateModelfromURL(currentSharedParameters, datasetId);

						// Refresh the view
						searchView.refresh();

					} else {

						Logger.error('Cannot load the dataset ' + datasetId + '.<br> The search cannot be shared.');
						MenuBar.showPage("data-services-area");

					}

					// Unsubscribe onFetch event once there are no more shared datasets
					// to initialize
					if (--datasetsToBeFetched == 0) {
						DataSetPopulation.off("datasetFetch", onFetch);

						// Explicitely set start/stop dates to force the update of datetimeslider
						DatasetSearch.set({
							start: DatasetSearch.get('start'),
							stop: DatasetSearch.get('stop')
						});

						// And launch the search!
						SearchResults.launch(DatasetSearch);
						
						// Show search panel
						$('#search').click();
					}
				}

				datasetPopulationCallbacks.push(function() {
					DataSetPopulation.on("datasetFetch", onFetch);
					// Select & fetch all shared datasets
					_.each(datasetIds, function(id) {
						DataSetPopulation.select(id);
					});
				})
			});

		// Route standing order shared url
		router.route(
			"data-services-area/sto/:datasetId?:query",
			"sto",
			function(datasetId, query) {

				// Show the page first
				MenuBar.showPage("data-services-area");

				// Once dataset has been loaded, populate standing order's model
				DataSetPopulation.once("datasetFetch", function(dataset, status) {

					if (status == "SUCCESS") {

						standingOrder.populateModelfromURL(query);
						StandingOrderDataAccessRequest.populateModelfromURL(query, standingOrder);

						// Refresh the view
						standingOrderView.refresh();

						// Show standing order panel
						$('#subscribe').click();

					} else {

						Logger.error('Cannot load the dataset ' + dataset + '.<br> The standing order cannot be shared.');
						MenuBar.showPage("data-services-area");

					}
				});
				
				datasetPopulationCallbacks.push(function() {					
					// Set the datasetId from the URL, the dataset will be loaded, and if exists it will be initialized
					DataSetPopulation.select(datasetId);
				})

			});

		// Set the default route
		router.route(
			"data-services-area", "dsa",
			function() {

				datasetPopulationCallbacks.push(function() {
					// Select the dataset id stored in the prefs
					var prefsDS = UserPrefs.get("Dataset");
					if (prefsDS && prefsDS != "None" && _.isString(prefsDS)) {

						var datasets = prefsDS.split(',');
						for (var i = 0; i < datasets.length; i++) {
							DataSetPopulation.select(datasets[i]);
						}
					}
				});

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