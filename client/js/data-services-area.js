
define(["jquery", "configuration", "logger", "userPrefs", "menubar", "map/map", "map/selectHandler", "searchResults/model/searchResults", "search/model/datasetSearch",  
        "dataAccess/model/standingOrderDataAccessRequest", "dataAccess/widget/standingOrderWidget", "search/widget/datasetSelection",
		"search/widget/searchCriteria", "searchResults/widget/resultsTable", 
		"shopcart/widget/shopcart", "map/widget/toolbarMap", "map/widget/mapPopup", 
		"text!../pages/data-services-area.html", "context-help"], 
	function($, Configuration, Logger, UserPrefs, MenuBar, Map, SelectHandler, SearchResults, DatasetSearch, StandingOrderDataAccessRequest, StandingOrderWidget,
			DataSetSelectionWidget, SearchCriteriaWidget, ResultsTableWidget,
			ShopcartWidget, ToolBarMap, MapPopup, dataservicesarea, ContextHelp) {

// Private variable
var _$resultsTableWidget;
			
return {

	/**
	 * Build the root element of the module and return it
	 */
	buildElement: function() {
	
		var dsa = $(dataservicesarea);
		var toolbar = dsa.find('#toolbar');
		
		// Wrap the image with a div to display both image and text below, and then add class for button styling
		toolbar.find('img')
			.wrap('<div class="tb-elt" />')
			.addClass('tb-button');
			
		// Add text for each element
		toolbar.find('img').each( function(index) {
			$(this).after('<div class="tb-text">' + $(this).attr('name') + '</div>');
		});
	
	
		return dsa;
	},
	
	/**
	 * Called when the module main page is hidden
	 */
	hide: function() {
		_$resultsTableWidget.panel('hide');
		$('#statusBar').hide();
		$('#dateRangeSlider').hide();
	},
	
	/**
	 * Called when the module main page is shown
	 */
	show: function() {
		$('#statusBar').show();
		$('#dateRangeSlider').show();
	},
	
	/**
	 * Initialize the module.
	 * Called after buildElement
	 *
	 * @param element The root element of the module
	 */
	initialize: function(element) {
	
		// Hide/show widgets
		element.trigger('create');
		$('#showHideToolbar').click( { hide: true }, function(event) {
			if ( event.data.hide ) {
				$('#toolbar').hide();
				$('#statusBar').hide();
				$('#dateRangeSlider').hide();
				$(this).buttonMarkup({ icon: 'plus' });
			} else {
				$('#toolbar').show();
				$('#statusBar').show();
				$('#dateRangeSlider').show();
				$(this).buttonMarkup({ icon: 'minus' });
			}
			event.data.hide = !event.data.hide;			
		});
		
			
		// Create all widgets
		DataSetSelectionWidget(element);
		var searchWidget = SearchCriteriaWidget.create(element);
		_$resultsTableWidget = ResultsTableWidget(element);
		//ShopcartWidget(element);
		ToolBarMap(element);
		ContextHelp(element);
		
		// Setup the router for shared URL support
		var router = new Backbone.Router();
		var self = this;
		
		router.route(
				"data-services-area/search/:datasetId?:query", 
				"search", function(datasetId, query) {		
				
			//set the attribute when the dataset has been loaded in order be sure that the criteria has been loaded
			//and not overwrite the start/stop dates 
			DatasetSearch.on("datasetLoaded", function(){
				
				DatasetSearch.populateModelfromURL(query);
				
				MenuBar.showPage("data-services-area");
				
				//refresh the search widget after the model has been update
				SearchCriteriaWidget.refresh();
				searchWidget.ngeowidget("show");
			});
			
			//when the dataset selected is not loaded display an error message
			DatasetSearch.on("datasetNotLoadError", function(datasetId){
				Logger.error('Cannot load the dataset ' + datasetId + '.<br> The search cannot be shared.');
				MenuBar.showPage("data-services-area");
			});

			// Set the datasetId from the URL, the dataset will be loaded, and if exists it will be initialized
			DatasetSearch.set({"datasetId" : datasetId});

		});
		
		//Route standing order url
		router.route(
				"data-services-area/sto/:datasetId/search?:query", 
				"sto", function(datasetId, query) {		
						
			//set the attribute when the dataset has been loaded in order be sure that the criteria has been loaded
			//and not overwrite the start/stop dates 
			DatasetSearch.on("datasetLoaded", function(){
				
				DatasetSearch.populateModelfromURL(query);
				StandingOrderDataAccessRequest.populateModelfromURL(query);
				
				//Display the STO widget
				MenuBar.showPage("data-services-area");
				
				var standingOrderWidget = new StandingOrderWidget();
				standingOrderWidget.open();			
			});
			
			//when the dataset selected is not loaded display an error message
			DatasetSearch.on("datasetNotLoadError", function(datasetId){
				Logger.error('Cannot load the dataset ' + datasetId + '.<br> The standing order cannot be shared.');
				MenuBar.showPage("data-services-area");
			});

			// Set the datasetId from the URL, the dataset will be loaded, and if exists it will be initialized
			DatasetSearch.set({"datasetId" : datasetId});
			
		});
		
		// Route default
		router.route(
			"data-services-area", "dsa", function() {
			
				//when the dataset selected is not loaded display an error message
				DatasetSearch.on("datasetNotLoadError", function(datasetId){
					Logger.error('Cannot load the dataset :' + datasetId + '.');
				});

				//select the dataset id stored in the prefs
				var datasetId = UserPrefs.get("Dataset");
				if (datasetId && datasetId != "None") {
					//set the selected dataset in the model
					DatasetSearch.set("datasetId", datasetId);
				}
				// Show the page
				MenuBar.showPage("data-services-area");
		});
		
		// Create the popup for the map
		var mapPopup = new MapPopup('.ui-page-active');
		mapPopup.close();
	
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
			SearchResults.reset();
		});				
	
		// Connect search results events with map
		var footprintLayer = Map.addLayer({
			name: "Result Footprints",
			type: "Feature",
			visible: true,
			style: "footprint"
		});
		var browsesLayer = Map.addLayer({
			name: "Result Browses",
			type: "Browses",
			visible: true
		});
		SearchResults.on('reset:features', function() {
			footprintLayer.clear();
			browsesLayer.clear();
		});
		SearchResults.on('add:features', footprintLayer.addFeatures, footprintLayer);
		SearchResults.on('zoomToFeature', Map.zoomToFeature);
		
		SearchResults.on('selectFeatures', function(features) {
			footprintLayer.modifyFeaturesStyle(features, "select");
			browsesLayer.addFeatures(features);
		});
		SearchResults.on('unselectFeatures', function(features) {
			footprintLayer.revertFeaturesStyle(features);
			browsesLayer.removeFeatures(features);
		});
		SearchResults.on('highlightFeatures', function(features,prevFeatures,searchResults) {
			
			if ( prevFeatures ) {
				
				for ( var i = 0; i < prevFeatures.length; i++ ) {

					if ( searchResults.isSelected(prevFeatures[i]) ) {
						footprintLayer.modifyFeaturesStyle([prevFeatures[i]], "select" );
					} else {
						footprintLayer.modifyFeaturesStyle([prevFeatures[i]], "default" );
						browsesLayer.removeFeatures([prevFeatures[i]]);
					}
				}
			}
			
			if ( features ) {
				for ( var i = 0; i < features.length; i++ ) {
					footprintLayer.modifyFeaturesStyle([features[i]], "highlight");
				}
			}
		});	
		
		// Initialize the default handler
		SelectHandler.initialize({
			layer: footprintLayer
		});
		// Start it
		SelectHandler.start();

		// Connect with map feature picking
		Map.on('pickedFeatures', SearchResults.highlight, SearchResults);
		
		//display a pop-up message when the product search has failed
		SearchResults.on('error:features', function(searchUrl){
			Logger.error('An error occured when retrieving the products with the search url :<br>' + searchUrl);
		});
		SearchResults.on('startLoading', function() {
		
			$('#paging a').addClass('ui-disabled');

			var $resultsMessage = $('#resultsMessage');
			$resultsMessage.html( "Searching..." );
			
			// Pulsate animation when searching
			var fadeOutOptions = {
				duration: 300,
				easing: "linear",
				complete: function() {
					$(this).animate({opacity:1.0},fadeInOptions);
				}
			};
			var fadeInOptions = {
				duration: 300,
				easing: "linear",
				complete: function() {
					$(this).animate({opacity:0.2},fadeOutOptions);
				}
			};
			$resultsMessage.animate({opacity:0.2},fadeOutOptions);
			$resultsMessage.show();
		});
		
		SearchResults.on('reset:features', function() {
			$('#paging a').addClass('ui-disabled');
			var $resultsMessage = $('#resultsMessage');
			$resultsMessage.hide();
		});
		
		SearchResults.on('add:features', function(features) {
			var $resultsMessage = $('#resultsMessage');
			$resultsMessage.stop(true);
			$resultsMessage.css('opacity',1.0);
			$resultsMessage.show();
			
			if ( SearchResults.totalResults != 0 ) {
				var startIndex = 1 + (SearchResults.currentPage-1) * SearchResults.countPerPage;
				$resultsMessage.html( 'Showing ' + startIndex + ' to ' + (startIndex + features.length - 1) + " of " + SearchResults.totalResults + " products." );
				
				// Updage paging button according to the current page
				$('#paging a').removeClass('ui-disabled');
				if ( SearchResults.currentPage == 1 ) {
					$('#paging_prev').addClass('ui-disabled');
					$('#paging_first').addClass('ui-disabled');
				} 
				if ( SearchResults.currentPage == SearchResults.lastPage ) {
					$('#paging_next').addClass('ui-disabled');
					$('#paging_last').addClass('ui-disabled');
				}
			} else {
				$resultsMessage.html( 'No product found.' );
			}
		});
		
		// To start paging is disable
		$('#paging a').addClass('ui-disabled');

		// Manage paging through buttons
		$('#paging_first').click( function() {
			SearchResults.changePage(1);
		});
		$('#paging_last').click( function() {
			SearchResults.changePage( SearchResults.lastPage );
		});
		$('#paging_next').click( function() {
			SearchResults.changePage( SearchResults.currentPage + 1 );
		});
		$('#paging_prev').click( function() {
			SearchResults.changePage( SearchResults.currentPage - 1 );
		});
		
	},
};

});
